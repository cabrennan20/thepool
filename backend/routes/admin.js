const express = require('express');
const { authenticateToken, requireAdmin } = require('./auth');
const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// POST /api/admin/games/:gameId/result - Update game result
router.put('/games/:gameId/result', async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId);
    const { home_score, away_score } = req.body;

    if (home_score === undefined || away_score === undefined) {
      return res.status(400).json({ error: 'Both home_score and away_score are required' });
    }

    // Update game result
    const result = await req.db.query(
      `UPDATE games 
       SET home_score = $1, away_score = $2, game_status = 'final', updated_at = CURRENT_TIMESTAMP
       WHERE game_id = $3
       RETURNING *`,
      [home_score, away_score, gameId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = result.rows[0];

    // Update pick results for this game
    const winner = home_score > away_score ? game.home_team : game.away_team;
    
    await req.db.query(
      `UPDATE picks 
       SET is_correct = (selected_team = $1)
       WHERE game_id = $2`,
      [winner, gameId]
    );

    res.json({
      message: 'Game result updated successfully',
      game: game
    });

  } catch (error) {
    console.error('Update game result error:', error);
    res.status(500).json({ error: 'Failed to update game result' });
  }
});

// POST /api/admin/calculate-scores - Calculate weekly scores
router.post('/calculate-scores', async (req, res) => {
  try {
    const week = parseInt(req.query.week);
    const season = parseInt(req.query.season) || new Date().getFullYear();

    if (!week) {
      return res.status(400).json({ error: 'Week parameter is required' });
    }

    // Get all users who made picks for this week
    const usersResult = await req.db.query(
      `SELECT DISTINCT p.user_id 
       FROM picks p
       JOIN games g ON p.game_id = g.game_id
       WHERE g.week = $1 AND g.season = $2`,
      [week, season]
    );

    // Update scores for each user
    for (const user of usersResult.rows) {
      await req.db.query(
        'SELECT update_weekly_scores($1, $2, $3)',
        [user.user_id, week, season]
      );
    }

    // Calculate weekly rankings
    await req.db.query(
      `UPDATE weekly_scores 
       SET weekly_rank = ranked.rank
       FROM (
         SELECT user_id, 
                ROW_NUMBER() OVER (ORDER BY total_points DESC, correct_picks DESC) as rank
         FROM weekly_scores 
         WHERE week = $1 AND season = $2
       ) ranked
       WHERE weekly_scores.user_id = ranked.user_id 
       AND weekly_scores.week = $1 
       AND weekly_scores.season = $2`,
      [week, season]
    );

    res.json({ 
      message: `Weekly scores calculated for Week ${week}, ${season}`,
      users_updated: usersResult.rows.length
    });

  } catch (error) {
    console.error('Calculate scores error:', error);
    res.status(500).json({ error: 'Failed to calculate scores' });
  }
});

// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT user_id, username, email, first_name, last_name, is_admin, is_active, created_at, last_login
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// PUT /api/admin/users/:userId - Update user
router.put('/users/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { is_admin, is_active } = req.body;

    const result = await req.db.query(
      `UPDATE users 
       SET is_admin = COALESCE($1, is_admin),
           is_active = COALESCE($2, is_active)
       WHERE user_id = $3
       RETURNING user_id, username, email, is_admin, is_active`,
      [is_admin, is_active, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = router;