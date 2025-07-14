const express = require('express');
const { z } = require('zod');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Validation schemas
const pickSchema = z.object({
  game_id: z.number().int().positive(),
  selected_team: z.string().min(2).max(10),
  tiebreaker_points: z.number().int().min(0).max(200).optional()
});

const picksSubmissionSchema = z.object({
  picks: z.array(pickSchema).min(1).max(16)
});

// GET /api/picks/user/:userId - Get user's picks for a week
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const week = parseInt(req.query.week) || null;
    const season = parseInt(req.query.season) || new Date().getFullYear();

    // Check if user is requesting their own picks or is admin
    if (req.user.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = `
      SELECT 
        p.pick_id,
        p.user_id,
        p.game_id,
        p.selected_team,
        p.pick_time,
        p.is_correct,
        g.home_team,
        g.away_team,
        g.game_date,
        g.game_status,
        g.home_score,
        g.away_score,
        g.spread
      FROM picks p
      JOIN games g ON p.game_id = g.game_id
      WHERE p.user_id = $1 AND g.season = $2
    `;
    
    const params = [userId, season];
    
    if (week) {
      query += ' AND g.week = $3';
      params.push(week);
    }
    
    query += ' ORDER BY g.week, g.game_date';

    const result = await req.db.query(query, params);

    res.json(result.rows);

  } catch (error) {
    console.error('Get picks error:', error);
    res.status(500).json({ error: 'Failed to get picks' });
  }
});

// POST /api/picks - Submit picks for a week
router.post('/', authenticateToken, async (req, res) => {
  const client = await req.db.connect();
  
  try {
    await client.query('BEGIN');

    const validatedData = picksSubmissionSchema.parse(req.body);
    const { picks } = validatedData;
    const userId = req.user.userId;

    // Get game information to verify picks
    const gameIds = picks.map(p => p.game_id);
    const gamesResult = await client.query(
      `SELECT game_id, week, season, game_date, home_team, away_team, game_status 
       FROM games WHERE game_id = ANY($1)`,
      [gameIds]
    );

    const games = gamesResult.rows;
    
    if (games.length !== picks.length) {
      throw new Error('Some games not found');
    }

    // Check if all games are from the same week
    const weeks = [...new Set(games.map(g => g.week))];
    if (weeks.length > 1) {
      throw new Error('All picks must be from the same week');
    }

    const currentWeek = weeks[0];
    const currentSeason = games[0].season;

    // Check pick deadlines
    const now = new Date();
    const expiredGames = games.filter(g => new Date(g.game_date) <= now);
    
    if (expiredGames.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot submit picks for games that have already started',
        expired_games: expiredGames.map(g => `${g.away_team} @ ${g.home_team}`)
      });
    }

    // Validate no duplicate game picks
    const uniqueGameIds = [...new Set(gameIds)];
    
    if (uniqueGameIds.length !== picks.length) {
      throw new Error('Cannot make multiple picks for the same game');
    }

    // Validate selected teams
    for (const pick of picks) {
      const game = games.find(g => g.game_id === pick.game_id);
      if (!game) continue;
      
      if (pick.selected_team !== game.home_team && pick.selected_team !== game.away_team) {
        throw new Error(`Invalid team selection for game ${game.away_team} @ ${game.home_team}`);
      }
    }

    // Delete existing picks for this week
    await client.query(
      `DELETE FROM picks 
       WHERE user_id = $1 
       AND game_id IN (
         SELECT game_id FROM games 
         WHERE week = $2 AND season = $3
       )`,
      [userId, currentWeek, currentSeason]
    );

    // Insert new picks
    const insertedPicks = [];
    
    for (const pick of picks) {
      const result = await client.query(
        `INSERT INTO picks (user_id, game_id, selected_team, tiebreaker_points) 
         VALUES ($1, $2, $3, $4) 
         RETURNING pick_id, user_id, game_id, selected_team, tiebreaker_points, pick_time`,
        [userId, pick.game_id, pick.selected_team, pick.tiebreaker_points || null]
      );
      
      insertedPicks.push(result.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Picks submitted successfully',
      picks: insertedPicks,
      week: currentWeek,
      season: currentSeason
    });

  } catch (error) {
    await client.query('ROLLBACK');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    console.error('Submit picks error:', error);
    res.status(400).json({ error: error.message || 'Failed to submit picks' });
    
  } finally {
    client.release();
  }
});

// PUT /api/picks/:pickId - Update a single pick
router.put('/:pickId', authenticateToken, async (req, res) => {
  try {
    const pickId = parseInt(req.params.pickId);
    const { selected_team } = req.body;

    // Get pick and game info
    const result = await req.db.query(
      `SELECT p.*, g.game_date, g.home_team, g.away_team, g.week, g.season, g.game_status
       FROM picks p
       JOIN games g ON p.game_id = g.game_id
       WHERE p.pick_id = $1`,
      [pickId]
    );

    const pick = result.rows[0];
    if (!pick) {
      return res.status(404).json({ error: 'Pick not found' });
    }

    // Check ownership
    if (pick.user_id !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check deadline
    if (new Date(pick.game_date) <= new Date()) {
      return res.status(400).json({ error: 'Cannot modify pick after game has started' });
    }

    // Validate team selection
    if (selected_team && selected_team !== pick.home_team && selected_team !== pick.away_team) {
      return res.status(400).json({ error: 'Invalid team selection' });
    }

    // Update pick
    const updateResult = await req.db.query(
      `UPDATE picks 
       SET selected_team = COALESCE($1, selected_team),
           tiebreaker_points = COALESCE($2, tiebreaker_points),
           pick_time = CURRENT_TIMESTAMP
       WHERE pick_id = $3
       RETURNING *`,
      [selected_team, req.body.tiebreaker_points, pickId]
    );

    res.json({
      message: 'Pick updated successfully',
      pick: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Update pick error:', error);
    res.status(500).json({ error: 'Failed to update pick' });
  }
});

// DELETE /api/picks/:pickId - Delete a pick
router.delete('/:pickId', authenticateToken, async (req, res) => {
  try {
    const pickId = parseInt(req.params.pickId);

    // Get pick info
    const result = await req.db.query(
      `SELECT p.*, g.game_date
       FROM picks p
       JOIN games g ON p.game_id = g.game_id
       WHERE p.pick_id = $1`,
      [pickId]
    );

    const pick = result.rows[0];
    if (!pick) {
      return res.status(404).json({ error: 'Pick not found' });
    }

    // Check ownership
    if (pick.user_id !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check deadline
    if (new Date(pick.game_date) <= new Date()) {
      return res.status(400).json({ error: 'Cannot delete pick after game has started' });
    }

    // Delete pick
    await req.db.query('DELETE FROM picks WHERE pick_id = $1', [pickId]);

    res.json({ message: 'Pick deleted successfully' });

  } catch (error) {
    console.error('Delete pick error:', error);
    res.status(500).json({ error: 'Failed to delete pick' });
  }
});

// GET /api/picks/week/:week - Get all picks for a week (admin only)
router.get('/week/:week', authenticateToken, async (req, res) => {
  try {
    // Only admins can see all picks
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const week = parseInt(req.params.week);
    const season = parseInt(req.query.season) || new Date().getFullYear();

    const result = await req.db.query(
      `SELECT 
        p.*,
        u.username,
        u.first_name,
        u.last_name,
        g.home_team,
        g.away_team,
        g.game_date,
        g.game_status
      FROM picks p
      JOIN users u ON p.user_id = u.user_id
      JOIN games g ON p.game_id = g.game_id
      WHERE g.week = $1 AND g.season = $2
      ORDER BY u.username, p.pick_time ASC`,
      [week, season]
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Get week picks error:', error);
    res.status(500).json({ error: 'Failed to get week picks' });
  }
});

module.exports = router;