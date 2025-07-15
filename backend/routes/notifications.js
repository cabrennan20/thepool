const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const NotificationService = require('../services/notificationService');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize notification service instance
const notificationService = new NotificationService(pool);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check admin role
const requireAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT role FROM users WHERE user_id = $1',
      [req.user.user_id]
    );

    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Error checking admin role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user notification preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM user_notification_preferences 
      WHERE user_id = $1
    `, [req.user.user_id]);

    if (result.rows.length === 0) {
      // Create default preferences if they don't exist
      await pool.query(`
        INSERT INTO user_notification_preferences (user_id)
        VALUES ($1)
      `, [req.user.user_id]);

      const defaultResult = await pool.query(`
        SELECT * FROM user_notification_preferences 
        WHERE user_id = $1
      `, [req.user.user_id]);

      return res.json(defaultResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({ error: 'Failed to get notification preferences' });
  }
});

// Update user notification preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const {
      email_pick_reminders,
      email_weekly_recap,
      email_urgent_reminders,
      sms_pick_reminders,
      reminder_hours_before
    } = req.body;

    const result = await pool.query(`
      UPDATE user_notification_preferences 
      SET 
        email_pick_reminders = COALESCE($1, email_pick_reminders),
        email_weekly_recap = COALESCE($2, email_weekly_recap),
        email_urgent_reminders = COALESCE($3, email_urgent_reminders),
        sms_pick_reminders = COALESCE($4, sms_pick_reminders),
        reminder_hours_before = COALESCE($5, reminder_hours_before),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $6
      RETURNING *
    `, [
      email_pick_reminders,
      email_weekly_recap,
      email_urgent_reminders,
      sms_pick_reminders,
      reminder_hours_before,
      req.user.user_id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification preferences not found' });
    }

    res.json({
      message: 'Notification preferences updated successfully',
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Test email configuration (admin only)
router.get('/test-email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await emailService.testEmailConfiguration();
    res.json(result);
  } catch (error) {
    console.error('Error testing email configuration:', error);
    res.status(500).json({ error: 'Failed to test email configuration' });
  }
});

// Send test email (admin only)
router.post('/test-email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // Get admin user info
    const userResult = await pool.query(
      'SELECT * FROM users WHERE user_id = $1',
      [req.user.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Send test email using pick reminder format
    const testUser = {
      ...userResult.rows[0],
      email: email // Override with test email
    };

    const testGames = [
      {
        away_team: 'Test Team A',
        home_team: 'Test Team B',
        game_date: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      }
    ];

    const result = await emailService.sendPickReminder(
      testUser, 
      testGames, 
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    );

    res.json({
      message: 'Test email sent',
      success: result.success,
      details: result.error || result.messageId
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// Manual trigger for pick reminders (admin only)
router.post('/trigger/pick-reminders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { week, season } = req.body;
    
    if (!week || !season) {
      return res.status(400).json({ error: 'Week and season are required' });
    }

    await notificationService.triggerPickReminders(week, season);
    
    res.json({
      message: `Pick reminders sent for Week ${week}, ${season}`,
      week,
      season
    });
  } catch (error) {
    console.error('Error triggering pick reminders:', error);
    res.status(500).json({ error: 'Failed to trigger pick reminders' });
  }
});

// Manual trigger for weekly recap (admin only)
router.post('/trigger/weekly-recap', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { week, season } = req.body;
    
    if (!week || !season) {
      return res.status(400).json({ error: 'Week and season are required' });
    }

    const result = await notificationService.triggerWeeklyRecap(week, season);
    
    res.json({
      message: `Weekly recap sent for Week ${week}, ${season}`,
      week,
      season,
      results: result
    });
  } catch (error) {
    console.error('Error triggering weekly recap:', error);
    res.status(500).json({ error: 'Failed to trigger weekly recap' });
  }
});

// Get notification log (admin only)
router.get('/log', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, type } = req.query;

    let query = `
      SELECT 
        notification_type,
        week,
        season,
        recipients_successful,
        recipients_failed,
        created_at
      FROM notification_log
    `;
    
    const params = [];
    
    if (type) {
      query += ' WHERE notification_type = $1';
      params.push(type);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      notifications: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error getting notification log:', error);
    res.status(500).json({ error: 'Failed to get notification log' });
  }
});

// Get notification statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        notification_type,
        COUNT(*) as total_sent,
        SUM(recipients_successful) as total_successful,
        SUM(recipients_failed) as total_failed,
        AVG(recipients_successful) as avg_successful,
        MAX(created_at) as last_sent
      FROM notification_log
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY notification_type
      ORDER BY notification_type
    `;

    const result = await pool.query(statsQuery);

    res.json({
      stats: result.rows,
      period: 'Last 30 days'
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({ error: 'Failed to get notification statistics' });
  }
});

module.exports = router;