const cron = require('node-cron');
const { Pool } = require('pg');
const emailService = require('./emailService');

class NotificationService {
  constructor(dbPool) {
    this.pool = dbPool;
    this.jobs = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Schedule daily check for pick reminders at 9 AM
      cron.schedule('0 9 * * *', () => {
        this.checkPickReminders();
      });

      // Schedule hourly check for urgent reminders (2 hours before deadline)
      cron.schedule('0 * * * *', () => {
        this.checkUrgentPickReminders();
      });

      // Schedule weekly recap check on Tuesdays at 10 AM (after Monday night games)
      cron.schedule('0 10 * * 2', () => {
        this.sendWeeklyRecaps();
      });

      console.log('📅 Notification service initialized with scheduled jobs');
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
    }
  }

  async checkPickReminders() {
    try {
      console.log('🔍 Checking for pick reminder notifications...');

      // Get current week games and their deadlines
      const currentWeekQuery = `
        SELECT DISTINCT week, season, MIN(game_date) as first_game_date
        FROM games 
        WHERE game_date > NOW() 
        GROUP BY week, season 
        ORDER BY first_game_date 
        LIMIT 1
      `;
      
      const weekResult = await this.pool.query(currentWeekQuery);
      if (weekResult.rows.length === 0) {
        console.log('No upcoming games found');
        return;
      }

      const { week, season, first_game_date } = weekResult.rows[0];
      const deadline = new Date(first_game_date);
      const now = new Date();
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

      // Send reminders 24 hours before deadline
      if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 20) {
        await this.sendPickRemindersForWeek(week, season, deadline);
      }
    } catch (error) {
      console.error('❌ Error checking pick reminders:', error);
    }
  }

  async checkUrgentPickReminders() {
    try {
      console.log('⚡ Checking for urgent pick reminder notifications...');

      const currentWeekQuery = `
        SELECT DISTINCT week, season, MIN(game_date) as first_game_date
        FROM games 
        WHERE game_date > NOW() 
        GROUP BY week, season 
        ORDER BY first_game_date 
        LIMIT 1
      `;
      
      const weekResult = await this.pool.query(currentWeekQuery);
      if (weekResult.rows.length === 0) return;

      const { week, season, first_game_date } = weekResult.rows[0];
      const deadline = new Date(first_game_date);
      const now = new Date();
      const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

      // Send urgent reminders 2 hours before deadline
      if (hoursUntilDeadline <= 2 && hoursUntilDeadline > 1) {
        await this.sendUrgentPickReminders(week, season, deadline);
      }
    } catch (error) {
      console.error('❌ Error checking urgent pick reminders:', error);
    }
  }

  async sendPickRemindersForWeek(week, season, deadline) {
    try {
      // Get users who haven't submitted picks for this week
      const usersQuery = `
        SELECT u.user_id, u.email, u.alias, u.first_name
        FROM users u
        WHERE u.user_id NOT IN (
          SELECT DISTINCT p.user_id 
          FROM picks p 
          JOIN games g ON p.game_id = g.game_id 
          WHERE g.week = $1 AND g.season = $2
        )
        AND u.email IS NOT NULL
        AND u.email != ''
      `;

      const usersResult = await this.pool.query(usersQuery, [week, season]);
      
      if (usersResult.rows.length === 0) {
        console.log('All users have submitted picks for this week');
        return;
      }

      // Get games for this week
      const gamesQuery = `
        SELECT game_id, away_team, home_team, game_date
        FROM games 
        WHERE week = $1 AND season = $2 
        ORDER BY game_date
      `;
      
      const gamesResult = await this.pool.query(gamesQuery, [week, season]);
      const games = gamesResult.rows;

      console.log(`📧 Sending pick reminders to ${usersResult.rows.length} users for Week ${week}`);

      // Send reminder emails
      const emailPromises = usersResult.rows.map(user => 
        emailService.sendPickReminder(user, games, deadline)
      );

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      console.log(`✅ Pick reminders sent: ${successful} successful, ${failed} failed`);

      // Log notification activity
      await this.logNotification('pick_reminder', week, season, successful, failed);

    } catch (error) {
      console.error('❌ Error sending pick reminders:', error);
    }
  }

  async sendUrgentPickReminders(week, season, deadline) {
    try {
      // Get users who still haven't submitted picks
      const usersQuery = `
        SELECT u.user_id, u.email, u.alias, u.first_name
        FROM users u
        WHERE u.user_id NOT IN (
          SELECT DISTINCT p.user_id 
          FROM picks p 
          JOIN games g ON p.game_id = g.game_id 
          WHERE g.week = $1 AND g.season = $2
        )
        AND u.email IS NOT NULL
        AND u.email != ''
      `;

      const usersResult = await this.pool.query(usersQuery, [week, season]);
      
      if (usersResult.rows.length === 0) {
        console.log('All users have submitted picks - no urgent reminders needed');
        return;
      }

      const gamesQuery = `
        SELECT game_id, away_team, home_team, game_date
        FROM games 
        WHERE week = $1 AND season = $2 
        ORDER BY game_date
      `;
      
      const gamesResult = await this.pool.query(gamesQuery, [week, season]);
      const games = gamesResult.rows;

      console.log(`⚡ Sending URGENT pick reminders to ${usersResult.rows.length} users for Week ${week}`);

      // Send urgent reminder emails (modified subject line)
      const emailPromises = usersResult.rows.map(user => 
        emailService.sendPickReminder({
          ...user,
          isUrgent: true
        }, games, deadline)
      );

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

      console.log(`⚡ Urgent reminders sent: ${successful} successful`);

    } catch (error) {
      console.error('❌ Error sending urgent pick reminders:', error);
    }
  }

  async sendWeeklyRecaps() {
    try {
      console.log('📊 Checking for weekly recap notifications...');

      // Get the most recently completed week
      const completedWeekQuery = `
        SELECT DISTINCT week, season, MAX(game_date) as last_game_date
        FROM games 
        WHERE game_date < NOW() 
        GROUP BY week, season 
        ORDER BY last_game_date DESC 
        LIMIT 1
      `;
      
      const weekResult = await this.pool.query(completedWeekQuery);
      if (weekResult.rows.length === 0) {
        console.log('No completed weeks found');
        return;
      }

      const { week, season } = weekResult.rows[0];

      // Check if we already sent recaps for this week
      const alreadySentQuery = `
        SELECT COUNT(*) as count 
        FROM notification_log 
        WHERE notification_type = 'weekly_recap' 
        AND week = $1 AND season = $2
        AND created_at > NOW() - INTERVAL '7 days'
      `;

      const sentResult = await this.pool.query(alreadySentQuery, [week, season]);
      if (sentResult.rows[0].count > 0) {
        console.log(`Weekly recap already sent for Week ${week}`);
        return;
      }

      // Get all users
      const usersQuery = `
        SELECT user_id, email, alias, first_name
        FROM users 
        WHERE email IS NOT NULL AND email != ''
      `;

      const usersResult = await this.pool.query(usersQuery);
      
      // Get recap data and leaderboard
      const recapData = await this.getRecapData(week, season);
      const leaderboard = await this.getSeasonLeaderboard(season);

      console.log(`📧 Sending weekly recaps to ${usersResult.rows.length} users for Week ${week}`);

      // Send recap emails
      const emailPromises = usersResult.rows.map(user => 
        emailService.sendWeeklyRecap(user, recapData, leaderboard)
      );

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      console.log(`✅ Weekly recaps sent: ${successful} successful, ${failed} failed`);

      // Log notification activity
      await this.logNotification('weekly_recap', week, season, successful, failed);

    } catch (error) {
      console.error('❌ Error sending weekly recaps:', error);
    }
  }

  async getRecapData(week, season) {
    // Simplified recap data for email
    const gamesQuery = `
      SELECT game_id, away_team, home_team, game_date
      FROM games 
      WHERE week = $1 AND season = $2 
      ORDER BY game_date
    `;
    
    const gamesResult = await this.pool.query(gamesQuery, [week, season]);
    
    return {
      week,
      season,
      games: gamesResult.rows
    };
  }

  async getSeasonLeaderboard(season) {
    const leaderboardQuery = `
      SELECT 
        u.alias,
        COUNT(CASE WHEN p.is_correct = true THEN 1 END) as correct_picks,
        COUNT(p.pick_id) as total_picks,
        ROUND(
          CASE 
            WHEN COUNT(p.pick_id) > 0 
            THEN (COUNT(CASE WHEN p.is_correct = true THEN 1 END)::float / COUNT(p.pick_id)) * 100 
            ELSE 0 
          END, 1
        ) as win_percentage
      FROM users u
      LEFT JOIN picks p ON u.user_id = p.user_id
      LEFT JOIN games g ON p.game_id = g.game_id AND g.season = $1
      GROUP BY u.user_id, u.alias
      HAVING COUNT(p.pick_id) > 0
      ORDER BY win_percentage DESC, correct_picks DESC
    `;

    const result = await this.pool.query(leaderboardQuery, [season]);
    return result.rows;
  }

  async logNotification(type, week, season, successful, failed) {
    try {
      await this.pool.query(`
        INSERT INTO notification_log (notification_type, week, season, recipients_successful, recipients_failed)
        VALUES ($1, $2, $3, $4, $5)
      `, [type, week, season, successful, failed || 0]);
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // Manual trigger methods for testing
  async triggerPickReminders(week, season) {
    console.log(`🔧 Manually triggering pick reminders for Week ${week}, ${season}`);
    
    const gamesQuery = `
      SELECT MIN(game_date) as first_game_date
      FROM games 
      WHERE week = $1 AND season = $2
    `;
    
    const result = await this.pool.query(gamesQuery, [week, season]);
    if (result.rows.length === 0) {
      throw new Error('No games found for specified week');
    }

    const deadline = new Date(result.rows[0].first_game_date);
    await this.sendPickRemindersForWeek(week, season, deadline);
  }

  async triggerWeeklyRecap(week, season) {
    console.log(`🔧 Manually triggering weekly recap for Week ${week}, ${season}`);
    
    const recapData = await this.getRecapData(week, season);
    const leaderboard = await this.getSeasonLeaderboard(season);

    const usersQuery = `
      SELECT user_id, email, alias, first_name
      FROM users 
      WHERE email IS NOT NULL AND email != ''
    `;

    const usersResult = await this.pool.query(usersQuery);
    
    const emailPromises = usersResult.rows.map(user => 
      emailService.sendWeeklyRecap(user, recapData, leaderboard)
    );

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    await this.logNotification('weekly_recap', week, season, successful, failed);
    
    return { successful, failed, total: usersResult.rows.length };
  }
}

module.exports = NotificationService;