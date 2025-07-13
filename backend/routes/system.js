const express = require('express');
const { authenticateToken } = require('./auth');
const router = express.Router();

// GET /api/system/settings - Get system settings
router.get('/settings', async (req, res) => {
  try {
    const result = await req.db.query(
      'SELECT setting_key, setting_value FROM system_settings ORDER BY setting_key'
    );

    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    res.json(settings);

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get system settings' });
  }
});

// GET /api/system/current-week - Get current NFL week and season
router.get('/current-week', async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT 
        setting_value as season 
       FROM system_settings 
       WHERE setting_key = 'current_season'
       UNION ALL
       SELECT 
        setting_value as week 
       FROM system_settings 
       WHERE setting_key = 'current_week'
       ORDER BY season DESC`
    );

    const season = parseInt(result.rows[0]?.season || new Date().getFullYear());
    const week = parseInt(result.rows[1]?.week || 1);

    res.json({ season, week });

  } catch (error) {
    console.error('Get current week error:', error);
    res.status(500).json({ error: 'Failed to get current week' });
  }
});

// PUT /api/system/settings/:key - Update system setting (admin only)
router.put('/settings/:key', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const settingKey = req.params.key;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({ error: 'Setting value is required' });
    }

    const result = await req.db.query(
      `INSERT INTO system_settings (setting_key, setting_value, updated_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (setting_key)
       DO UPDATE SET 
         setting_value = EXCLUDED.setting_value,
         updated_at = CURRENT_TIMESTAMP,
         updated_by = EXCLUDED.updated_by
       RETURNING *`,
      [settingKey, value, req.user.userId]
    );

    res.json({
      message: 'Setting updated successfully',
      setting: result.rows[0]
    });

  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// GET /api/system/health - System health check
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await req.db.query('SELECT 1');
    
    // Get basic stats
    const userCount = await req.db.query('SELECT COUNT(*) as count FROM users WHERE is_active = true');
    const gameCount = await req.db.query('SELECT COUNT(*) as count FROM games WHERE game_status = \'scheduled\'');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      stats: {
        active_users: parseInt(userCount.rows[0].count),
        upcoming_games: parseInt(gameCount.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

module.exports = router;