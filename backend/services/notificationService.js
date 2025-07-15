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
        SELECT u.user_id, u.email, u.username as alias, u.first_name
        FROM users u
        WHERE u.user_id NOT IN (
          SELECT DISTINCT p.user_id 
          FROM picks p 
          JOIN games g ON p.game_id = g.game_id 
          WHERE g.week = $1 AND g.season = $2
        )
        AND u.email IS NOT NULL
        AND u.email != ''
        AND u.is_active = true
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
        SELECT u.user_id, u.email, u.username as alias, u.first_name
        FROM users u
        WHERE u.user_id NOT IN (
          SELECT DISTINCT p.user_id 
          FROM picks p 
          JOIN games g ON p.game_id = g.game_id 
          WHERE g.week = $1 AND g.season = $2
        )
        AND u.email IS NOT NULL
        AND u.email != ''
        AND u.is_active = true
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

      // Get users who have opted in for weekly recap emails
      const usersQuery = `
        SELECT u.user_id, u.email, u.username as alias, u.first_name
        FROM users u
        LEFT JOIN user_notification_preferences unp ON u.user_id = unp.user_id
        WHERE u.email IS NOT NULL AND u.email != ''
        AND u.is_active = true
        AND (unp.email_weekly_recap = true OR unp.email_weekly_recap IS NULL)
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
    // Get comprehensive recap data similar to the recap API
    const gamesQuery = `
      SELECT 
        game_id,
        home_team,
        away_team,
        game_date,
        home_score,
        away_score,
        game_status,
        spread
      FROM games 
      WHERE week = $1 AND season = $2 
      ORDER BY game_date
    `;
    
    const gamesResult = await this.pool.query(gamesQuery, [week, season]);
    const games = gamesResult.rows;

    // Get all users' picks for this week
    const picksQuery = `
      SELECT 
        u.user_id,
        u.username,
        u.first_name,
        u.last_name,
        p.game_id,
        p.selected_team,
        p.is_correct,
        g.home_team,
        g.away_team,
        g.game_date,
        g.home_score,
        g.away_score,
        g.game_status
      FROM users u
      LEFT JOIN picks p ON u.user_id = p.user_id
      LEFT JOIN games g ON p.game_id = g.game_id AND g.week = $1 AND g.season = $2
      WHERE u.is_active = true
      ORDER BY u.username, g.game_date
    `;

    const picksResult = await this.pool.query(picksQuery, [week, season]);

    // Group picks by user
    const userPicksMap = new Map();
    
    picksResult.rows.forEach(row => {
      const userId = row.user_id;
      
      if (!userPicksMap.has(userId)) {
        userPicksMap.set(userId, {
          user_id: userId,
          username: row.username,
          alias: row.username, // Use username as alias since alias column doesn't exist
          first_name: row.first_name,
          last_name: row.last_name,
          picks: new Map(),
          correct_picks: 0,
          total_picks: 0
        });
      }
      
      if (row.game_id) {
        const pick = {
          game_id: row.game_id,
          selected_team: row.selected_team,
          is_correct: row.is_correct
        };
        
        userPicksMap.get(userId).picks.set(row.game_id, pick);
        
        if (row.is_correct !== null) {
          userPicksMap.get(userId).total_picks++;
          if (row.is_correct) {
            userPicksMap.get(userId).correct_picks++;
          }
        }
      }
    });

    // Convert to array and calculate statistics
    const recapData = Array.from(userPicksMap.values()).map(user => {
      const userPicks = {};
      
      games.forEach(game => {
        const pick = user.picks.get(game.game_id);
        userPicks[game.game_id] = pick ? pick.selected_team : null;
      });
      
      return {
        user_id: user.user_id,
        alias: user.alias,
        username: user.username,
        picks: userPicks,
        correct_picks: user.correct_picks,
        total_picks: user.total_picks,
        win_percentage: user.total_picks > 0 ? Math.round((user.correct_picks / user.total_picks) * 100) : 0
      };
    });

    return {
      week,
      season,
      games,
      recap_data: recapData,
      total_users: recapData.length,
      total_games: games.length
    };
  }

  async getSeasonLeaderboard(season) {
    const leaderboardQuery = `
      SELECT 
        u.username as alias,
        COUNT(CASE WHEN p.is_correct = true THEN 1 END) as correct_picks,
        COUNT(p.pick_id) as total_picks,
        CAST(
          CASE 
            WHEN COUNT(p.pick_id) > 0 
            THEN (COUNT(CASE WHEN p.is_correct = true THEN 1 END)::float / COUNT(p.pick_id)) * 100 
            ELSE 0 
          END AS INTEGER
        ) as win_percentage
      FROM users u
      LEFT JOIN picks p ON u.user_id = p.user_id
      LEFT JOIN games g ON p.game_id = g.game_id AND g.season = $1
      WHERE u.is_active = true
      GROUP BY u.user_id, u.username
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
      SELECT u.user_id, u.email, u.username as alias, u.first_name
      FROM users u
      LEFT JOIN user_notification_preferences unp ON u.user_id = unp.user_id
      WHERE u.email IS NOT NULL AND u.email != ''
      AND u.is_active = true
      AND (unp.email_weekly_recap = true OR unp.email_weekly_recap IS NULL)
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