const express = require('express');
const { authenticateToken } = require('./auth');
const router = express.Router();

// GET /api/scores/weekly - Get weekly leaderboard
router.get('/weekly', async (req, res) => {
  try {
    const week = parseInt(req.query.week);
    const season = parseInt(req.query.season) || new Date().getFullYear();

    if (!week) {
      return res.status(400).json({ error: 'Week parameter is required' });
    }

    const result = await req.db.query(
      `SELECT 
        ws.user_id,
        u.username,
        u.first_name,
        u.last_name,
        ws.week,
        ws.season,
        ws.correct_picks,
        ws.total_picks,
        ws.total_points,
        ws.possible_points,
        ws.win_percentage,
        ws.weekly_rank,
        RANK() OVER (ORDER BY ws.total_points DESC, ws.correct_picks DESC, u.username) as current_rank
      FROM weekly_scores ws
      JOIN users u ON ws.user_id = u.user_id
      WHERE ws.week = $1 AND ws.season = $2 AND u.is_active = true
      ORDER BY ws.total_points DESC, ws.correct_picks DESC, u.username`,
      [week, season]
    );

    res.json({
      week,
      season,
      leaderboard: result.rows
    });

  } catch (error) {
    console.error('Get weekly scores error:', error);
    res.status(500).json({ error: 'Failed to get weekly scores' });
  }
});

// GET /api/scores/season - Get season standings
router.get('/season', async (req, res) => {
  try {
    const season = parseInt(req.query.season) || new Date().getFullYear();

    const result = await req.db.query(
      `SELECT 
        u.user_id,
        u.username,
        u.first_name,
        u.last_name,
        COUNT(ws.week) as weeks_played,
        COALESCE(SUM(ws.correct_picks), 0) as total_correct,
        COALESCE(SUM(ws.total_picks), 0) as total_games,
        COALESCE(SUM(ws.total_points), 0) as total_points,
        COALESCE(SUM(ws.possible_points), 0) as total_possible,
        CASE 
          WHEN SUM(ws.total_picks) > 0 THEN 
            ROUND((SUM(ws.correct_picks)::DECIMAL / SUM(ws.total_picks)) * 100, 2)
          ELSE 0 
        END as season_win_percentage,
        RANK() OVER (
          ORDER BY SUM(ws.total_points) DESC, 
                   SUM(ws.correct_picks) DESC, 
                   COUNT(ws.week) DESC,
                   u.username
        ) as season_rank
      FROM users u
      LEFT JOIN weekly_scores ws ON u.user_id = ws.user_id AND ws.season = $1
      WHERE u.is_active = true
      GROUP BY u.user_id, u.username, u.first_name, u.last_name
      HAVING COUNT(ws.week) > 0 OR u.is_admin = true
      ORDER BY total_points DESC, total_correct DESC, weeks_played DESC, u.username`,
      [season]
    );

    res.json({
      season,
      standings: result.rows
    });

  } catch (error) {
    console.error('Get season standings error:', error);
    res.status(500).json({ error: 'Failed to get season standings' });
  }
});

// GET /api/scores/user/:userId - Get user's scoring history
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const season = parseInt(req.query.season) || new Date().getFullYear();

    // Check if user is requesting their own scores or is admin
    if (req.user.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get weekly scores
    const weeklyResult = await req.db.query(
      `SELECT 
        week,
        correct_picks,
        total_picks,
        total_points,
        possible_points,
        win_percentage,
        weekly_rank
      FROM weekly_scores
      WHERE user_id = $1 AND season = $2
      ORDER BY week`,
      [userId, season]
    );

    // Get season totals
    const seasonResult = await req.db.query(
      `SELECT 
        COUNT(week) as weeks_played,
        COALESCE(SUM(correct_picks), 0) as total_correct,
        COALESCE(SUM(total_picks), 0) as total_games,
        COALESCE(SUM(total_points), 0) as total_points,
        COALESCE(SUM(possible_points), 0) as total_possible,
        CASE 
          WHEN SUM(total_picks) > 0 THEN 
            ROUND((SUM(correct_picks)::DECIMAL / SUM(total_picks)) * 100, 2)
          ELSE 0 
        END as season_win_percentage
      FROM weekly_scores
      WHERE user_id = $1 AND season = $2`,
      [userId, season]
    );

    // Get current season rank
    const rankResult = await req.db.query(
      `WITH season_totals AS (
        SELECT 
          user_id,
          SUM(total_points) as total_points,
          SUM(correct_picks) as total_correct,
          COUNT(week) as weeks_played
        FROM weekly_scores
        WHERE season = $2
        GROUP BY user_id
      )
      SELECT 
        RANK() OVER (
          ORDER BY total_points DESC, 
                   total_correct DESC, 
                   weeks_played DESC
        ) as season_rank
      FROM season_totals
      WHERE user_id = $1`,
      [userId, season]
    );

    const seasonTotals = seasonResult.rows[0];
    const seasonRank = rankResult.rows[0]?.season_rank || null;

    res.json({
      user_id: userId,
      season,
      weekly_scores: weeklyResult.rows,
      season_summary: {
        ...seasonTotals,
        season_rank: seasonRank,
        weeks_played: parseInt(seasonTotals.weeks_played),
        total_correct: parseInt(seasonTotals.total_correct),
        total_games: parseInt(seasonTotals.total_games),
        total_points: parseInt(seasonTotals.total_points),
        total_possible: parseInt(seasonTotals.total_possible)
      }
    });

  } catch (error) {
    console.error('Get user scores error:', error);
    res.status(500).json({ error: 'Failed to get user scores' });
  }
});

// POST /api/scores/calculate/:week - Calculate scores for a week (admin only)
router.post('/calculate/:week', authenticateToken, async (req, res) => {
  try {
    // Only admins can trigger score calculation
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const week = parseInt(req.params.week);
    const season = parseInt(req.body.season) || new Date().getFullYear();

    const client = await req.db.connect();
    
    try {
      await client.query('BEGIN');

      // First, update pick correctness based on game results
      await client.query(
        `UPDATE picks 
         SET 
           is_correct = CASE 
             WHEN g.game_status = 'final' THEN
               CASE 
                 WHEN g.home_score > g.away_score AND p.selected_team = g.home_team THEN true
                 WHEN g.away_score > g.home_score AND p.selected_team = g.away_team THEN true
                 ELSE false
               END
             ELSE NULL
           END,
           points_earned = CASE 
             WHEN g.game_status = 'final' THEN
               CASE 
                 WHEN g.home_score > g.away_score AND p.selected_team = g.home_team THEN p.confidence_points
                 WHEN g.away_score > g.home_score AND p.selected_team = g.away_team THEN p.confidence_points
                 ELSE 0
               END
             ELSE NULL
           END
         FROM games g 
         WHERE p.game_id = g.game_id 
         AND g.week = $1 
         AND g.season = $2`,
        [week, season]
      );

      // Get all users who made picks this week
      const usersResult = await client.query(
        `SELECT DISTINCT p.user_id 
         FROM picks p 
         JOIN games g ON p.game_id = g.game_id 
         WHERE g.week = $1 AND g.season = $2`,
        [week, season]
      );

      const users = usersResult.rows;
      const updatedUsers = [];

      // Calculate weekly scores for each user
      for (const { user_id } of users) {
        const scoreResult = await client.query(
          `SELECT 
            COUNT(p.pick_id) as total_picks,
            COUNT(CASE WHEN p.is_correct = true THEN 1 END) as correct_picks,
            COALESCE(SUM(CASE WHEN p.is_correct = true THEN p.confidence_points ELSE 0 END), 0) as total_points,
            COALESCE(SUM(p.confidence_points), 0) as possible_points
          FROM picks p
          JOIN games g ON p.game_id = g.game_id
          WHERE p.user_id = $1 
          AND g.week = $2 
          AND g.season = $3 
          AND g.game_status = 'final'`,
          [user_id, week, season]
        );

        const scores = scoreResult.rows[0];
        const winPercentage = scores.total_picks > 0 
          ? (scores.correct_picks / scores.total_picks * 100) 
          : 0;

        // Insert or update weekly scores
        await client.query(
          `INSERT INTO weekly_scores (
            user_id, week, season, correct_picks, total_picks, 
            total_points, possible_points, win_percentage
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (user_id, season, week) 
          DO UPDATE SET
            correct_picks = EXCLUDED.correct_picks,
            total_picks = EXCLUDED.total_picks,
            total_points = EXCLUDED.total_points,
            possible_points = EXCLUDED.possible_points,
            win_percentage = EXCLUDED.win_percentage`,
          [
            user_id, week, season, 
            scores.correct_picks, scores.total_picks,
            scores.total_points, scores.possible_points, 
            winPercentage
          ]
        );

        updatedUsers.push(user_id);
      }

      // Update weekly ranks
      await client.query(
        `UPDATE weekly_scores 
         SET weekly_rank = ranked.rank
         FROM (
           SELECT 
             user_id,
             RANK() OVER (ORDER BY total_points DESC, correct_picks DESC) as rank
           FROM weekly_scores 
           WHERE week = $1 AND season = $2
         ) ranked
         WHERE weekly_scores.user_id = ranked.user_id 
         AND weekly_scores.week = $1 
         AND weekly_scores.season = $2`,
        [week, season]
      );

      await client.query('COMMIT');

      // Get updated leaderboard
      const leaderboardResult = await client.query(
        `SELECT 
          ws.*,
          u.username,
          u.first_name,
          u.last_name
        FROM weekly_scores ws
        JOIN users u ON ws.user_id = u.user_id
        WHERE ws.week = $1 AND ws.season = $2
        ORDER BY ws.total_points DESC, ws.correct_picks DESC`,
        [week, season]
      );

      res.json({
        message: 'Scores calculated successfully',
        week,
        season,
        users_updated: updatedUsers.length,
        leaderboard: leaderboardResult.rows
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Calculate scores error:', error);
    res.status(500).json({ error: 'Failed to calculate scores' });
  }
});

// GET /api/scores/summary - Get overall league summary
router.get('/summary', async (req, res) => {
  try {
    const season = parseInt(req.query.season) || new Date().getFullYear();

    // Get overall stats
    const statsResult = await req.db.query(
      `SELECT 
        COUNT(DISTINCT u.user_id) as total_users,
        COUNT(DISTINCT ws.week) as weeks_completed,
        COALESCE(SUM(ws.total_picks), 0) as total_picks_made,
        COALESCE(SUM(ws.correct_picks), 0) as total_correct_picks,
        CASE 
          WHEN SUM(ws.total_picks) > 0 THEN 
            ROUND((SUM(ws.correct_picks)::DECIMAL / SUM(ws.total_picks)) * 100, 2)
          ELSE 0 
        END as league_accuracy
      FROM users u
      LEFT JOIN weekly_scores ws ON u.user_id = ws.user_id AND ws.season = $1
      WHERE u.is_active = true`,
      [season]
    );

    // Get top performers
    const topPerformersResult = await req.db.query(
      `SELECT 
        u.username,
        u.first_name,
        u.last_name,
        SUM(ws.total_points) as total_points,
        SUM(ws.correct_picks) as total_correct,
        COUNT(ws.week) as weeks_played
      FROM weekly_scores ws
      JOIN users u ON ws.user_id = u.user_id
      WHERE ws.season = $1 AND u.is_active = true
      GROUP BY u.user_id, u.username, u.first_name, u.last_name
      HAVING COUNT(ws.week) > 0
      ORDER BY total_points DESC
      LIMIT 5`,
      [season]
    );

    // Get recent weeks performance
    const recentWeeksResult = await req.db.query(
      `SELECT 
        week,
        COUNT(DISTINCT user_id) as participants,
        COALESCE(SUM(total_picks), 0) as total_picks,
        COALESCE(SUM(correct_picks), 0) as correct_picks,
        CASE 
          WHEN SUM(total_picks) > 0 THEN 
            ROUND((SUM(correct_picks)::DECIMAL / SUM(total_picks)) * 100, 2)
          ELSE 0 
        END as week_accuracy
      FROM weekly_scores
      WHERE season = $1
      GROUP BY week
      ORDER BY week DESC
      LIMIT 4`,
      [season]
    );

    const stats = statsResult.rows[0];

    res.json({
      season,
      league_summary: {
        total_users: parseInt(stats.total_users),
        weeks_completed: parseInt(stats.weeks_completed),
        total_picks_made: parseInt(stats.total_picks_made),
        total_correct_picks: parseInt(stats.total_correct_picks),
        league_accuracy: parseFloat(stats.league_accuracy)
      },
      top_performers: topPerformersResult.rows,
      recent_weeks: recentWeeksResult.rows
    });

  } catch (error) {
    console.error('Get scores summary error:', error);
    res.status(500).json({ error: 'Failed to get scores summary' });
  }
});

module.exports = router;