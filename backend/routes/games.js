const express = require('express');
const { authenticateToken } = require('./auth');
const espnService = require('../services/espnService');
const router = express.Router();

// GET /api/games - Get games with optional filtering
router.get('/', async (req, res) => {
  try {
    const season = parseInt(req.query.season) || new Date().getFullYear();
    const week = req.query.week ? parseInt(req.query.week) : null;
    const status = req.query.status;

    let query = `
      SELECT 
        game_id,
        season,
        week,
        game_date,
        home_team,
        away_team,
        home_score,
        away_score,
        spread,
        game_status,
        odds_api_id,
        created_at,
        updated_at
      FROM games 
      WHERE season = $1
    `;
    
    const params = [season];
    let paramCount = 1;

    if (week !== null) {
      paramCount++;
      query += ` AND week = $${paramCount}`;
      params.push(week);
    }

    if (status) {
      paramCount++;
      query += ` AND game_status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY week, game_date';

    const result = await req.db.query(query, params);
    res.json(result.rows);

  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Failed to get games' });
  }
});

// GET /api/games/current-week - Get current week's games with live data
router.get('/current-week', async (req, res) => {
  try {
    // Get current week from system settings
    const settingsResult = await req.db.query(
      `SELECT setting_key, setting_value FROM system_settings 
       WHERE setting_key IN ('current_week', 'current_season')`
    );

    const settings = {};
    settingsResult.rows.forEach(row => {
      if (row.setting_key === 'current_week') settings.week = parseInt(row.setting_value);
      if (row.setting_key === 'current_season') settings.season = parseInt(row.setting_value);
    });

    const currentWeek = settings.week || 1;
    const currentSeason = settings.season || 2025;

    try {
      // Try to get live data from ESPN API first
      const liveGames = await espnService.getWeekGames(currentWeek, currentSeason);
      
      if (liveGames && liveGames.length > 0) {
        // Return live ESPN data with additional metadata
        res.json({
          week: currentWeek,
          season: currentSeason,
          games: liveGames.map(game => ({
            ...game,
            // Map ESPN data to our expected format
            game_id: game.espn_id,
            odds_api_id: game.espn_id
          })),
          source: 'espn_live'
        });
        return;
      }
    } catch (espnError) {
      console.error('ESPN API failed, falling back to database:', espnError.message);
    }

    // Fallback to database if ESPN API fails
    const result = await req.db.query(
      `SELECT 
        game_id,
        season,
        week,
        game_date,
        home_team,
        away_team,
        home_score,
        away_score,
        spread,
        game_status,
        odds_api_id
      FROM games 
      WHERE season = $1 AND week = $2
      ORDER BY game_date`,
      [currentSeason, currentWeek]
    );

    res.json({
      week: currentWeek,
      season: currentSeason,
      games: result.rows,
      source: 'database_fallback'
    });

  } catch (error) {
    console.error('Get current week games error:', error);
    res.status(500).json({ error: 'Failed to get current week games' });
  }
});

// GET /api/games/:gameId - Get single game
router.get('/:gameId', async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId);

    const result = await req.db.query(
      'SELECT * FROM games WHERE game_id = $1',
      [gameId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Failed to get game' });
  }
});

// GET /api/games/:gameId/picks - Get all picks for a game (after game starts)
router.get('/:gameId/picks', async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId);

    // Get game info
    const gameResult = await req.db.query(
      'SELECT game_date, game_status FROM games WHERE game_id = $1',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = gameResult.rows[0];

    // Only show picks after game has started or for admins
    const now = new Date();
    const gameStarted = new Date(game.game_date) <= now;

    if (!gameStarted && (!req.user || !req.user.isAdmin)) {
      return res.status(403).json({ 
        error: 'Picks are hidden until game starts',
        game_date: game.game_date
      });
    }

    const result = await req.db.query(
      `SELECT 
        p.pick_id,
        p.selected_team,
        p.tiebreaker_points,
        p.is_correct,
        u.username,
        u.alias
      FROM picks p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.game_id = $1
      ORDER BY u.alias, u.username`,
      [gameId]
    );

    res.json({
      game_id: gameId,
      game_status: game.game_status,
      picks_visible: gameStarted,
      picks: result.rows
    });

  } catch (error) {
    console.error('Get game picks error:', error);
    res.status(500).json({ error: 'Failed to get game picks' });
  }
});

// POST /api/games/sync-from-odds-api - Sync games from The Odds API
router.post('/sync-from-odds-api', authenticateToken, async (req, res) => {
  try {
    // Only admins can sync games
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const week = req.body.week || 1;
    const season = req.body.season || new Date().getFullYear();

    // This would typically call The Odds API
    // For now, return a placeholder response
    res.json({
      message: 'Game sync functionality would be implemented here',
      week,
      season,
      note: 'This would fetch from The Odds API and update the games table'
    });

  } catch (error) {
    console.error('Sync games error:', error);
    res.status(500).json({ error: 'Failed to sync games' });
  }
});

// GET /api/games/week/:week/stats - Get week statistics
router.get('/week/:week/stats', async (req, res) => {
  try {
    const week = parseInt(req.params.week);
    const season = parseInt(req.query.season) || new Date().getFullYear();

    const result = await req.db.query(
      `SELECT 
        COUNT(*) as total_games,
        COUNT(CASE WHEN game_status = 'final' THEN 1 END) as completed_games,
        COUNT(CASE WHEN game_status = 'in_progress' THEN 1 END) as live_games,
        COUNT(CASE WHEN game_status = 'scheduled' THEN 1 END) as scheduled_games,
        MIN(game_date) as first_game,
        MAX(game_date) as last_game
      FROM games 
      WHERE week = $1 AND season = $2`,
      [week, season]
    );

    const gameStats = result.rows[0];

    // Get pick statistics
    const pickResult = await req.db.query(
      `SELECT 
        COUNT(DISTINCT p.user_id) as users_with_picks,
        COUNT(p.pick_id) as total_picks,
        COUNT(CASE WHEN p.is_correct = true THEN 1 END) as correct_picks
      FROM picks p
      JOIN games g ON p.game_id = g.game_id
      WHERE g.week = $1 AND g.season = $2`,
      [week, season]
    );

    const pickStats = pickResult.rows[0];

    res.json({
      week,
      season,
      games: {
        total: parseInt(gameStats.total_games),
        completed: parseInt(gameStats.completed_games),
        live: parseInt(gameStats.live_games),
        scheduled: parseInt(gameStats.scheduled_games),
        first_game: gameStats.first_game,
        last_game: gameStats.last_game
      },
      picks: {
        users_with_picks: parseInt(pickStats.users_with_picks),
        total_picks: parseInt(pickStats.total_picks),
        correct_picks: parseInt(pickStats.correct_picks) || 0,
        accuracy_rate: pickStats.total_picks > 0 
          ? ((pickStats.correct_picks || 0) / pickStats.total_picks * 100).toFixed(2)
          : '0.00'
      }
    });

  } catch (error) {
    console.error('Get week stats error:', error);
    res.status(500).json({ error: 'Failed to get week statistics' });
  }
});

// GET /api/games/live-scores - Get live ESPN scores
router.get('/live-scores', async (req, res) => {
  try {
    const week = parseInt(req.query.week) || 1;
    const season = parseInt(req.query.season) || 2025;

    // Get live scores from ESPN
    const liveScores = await espnService.getWeekGames(week, season);
    
    res.json({
      week,
      season,
      games: liveScores,
      source: 'espn_api',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get live scores error:', error);
    res.status(500).json({ 
      error: 'Failed to get live scores from ESPN',
      details: error.message 
    });
  }
});

// GET /api/games/espn/health - Check ESPN API health
router.get('/espn/health', async (req, res) => {
  try {
    const health = await espnService.healthCheck();
    res.json(health);
  } catch (error) {
    console.error('ESPN health check error:', error);
    res.status(500).json({ 
      available: false,
      message: error.message 
    });
  }
});

module.exports = router;