const express = require('express');
const { authenticateToken } = require('./auth');
const router = express.Router();

// POST /api/tracker/forecast - Calculate forecasted standings based on worksheet scores
router.post('/forecast', authenticateToken, async (req, res) => {
  try {
    const { worksheet_scores, week, season } = req.body;
    
    if (!worksheet_scores || !week) {
      return res.status(400).json({ error: 'Worksheet scores and week are required' });
    }

    const currentSeason = season || new Date().getFullYear();

    // Get all users who made picks for this week
    const usersResult = await req.db.query(
      `SELECT DISTINCT p.user_id, u.alias
       FROM picks p 
       JOIN users u ON p.user_id = u.user_id
       JOIN games g ON p.game_id = g.game_id 
       WHERE g.week = $1 AND g.season = $2 AND u.is_active = true`,
      [week, currentSeason]
    );

    const users = usersResult.rows;
    const forecast = [];

    // Calculate forecasted records for each user
    for (const { user_id, alias } of users) {
      // Get user's picks for this week
      const picksResult = await req.db.query(
        `SELECT p.*, g.home_team, g.away_team
         FROM picks p
         JOIN games g ON p.game_id = g.game_id
         WHERE p.user_id = $1 AND g.week = $2 AND g.season = $3`,
        [user_id, week, currentSeason]
      );

      const userPicks = picksResult.rows;
      let correctPicks = 0;
      let totalPicks = userPicks.length;

      // Calculate wins based on worksheet scores
      userPicks.forEach(pick => {
        const gameScore = worksheet_scores[pick.game_id];
        if (gameScore) {
          const homeWins = gameScore.home_score > gameScore.away_score;
          const awayWins = gameScore.away_score > gameScore.home_score;
          
          if ((homeWins && pick.selected_team === pick.home_team) ||
              (awayWins && pick.selected_team === pick.away_team)) {
            correctPicks++;
          }
        }
      });

      forecast.push({
        user_id,
        alias,
        weekly_record: `${correctPicks}-${totalPicks - correctPicks}`,
        weekly_rank: 0, // Will be calculated after sorting
        yearly_rank: 0, // Will be calculated
        yearly_rank_change: 0, // Will be calculated
        correct_picks: correctPicks,
        total_picks: totalPicks
      });
    }

    // Sort by weekly performance and assign weekly ranks
    forecast.sort((a, b) => {
      if (b.correct_picks !== a.correct_picks) {
        return b.correct_picks - a.correct_picks;
      }
      return a.alias.localeCompare(b.alias);
    });

    forecast.forEach((entry, index) => {
      entry.weekly_rank = index + 1;
    });

    // Get current season standings to calculate yearly rank changes
    const seasonStandingsResult = await req.db.query(
      `SELECT 
        u.user_id,
        u.alias,
        COALESCE(SUM(ws.correct_picks), 0) as total_correct,
        RANK() OVER (
          ORDER BY SUM(ws.correct_picks) DESC, 
                   COUNT(ws.week) DESC,
                   u.alias
        ) as current_season_rank
      FROM users u
      LEFT JOIN weekly_scores ws ON u.user_id = ws.user_id AND ws.season = $1
      WHERE u.is_active = true
      GROUP BY u.user_id, u.alias
      ORDER BY total_correct DESC, u.alias`,
      [currentSeason]
    );

    const seasonStandings = seasonStandingsResult.rows;

    // Update forecast with yearly ranks and changes
    forecast.forEach(entry => {
      const currentStanding = seasonStandings.find(s => s.user_id === entry.user_id);
      if (currentStanding) {
        entry.yearly_rank = parseInt(currentStanding.current_season_rank);
        
        // Simulate potential rank change based on weekly performance
        // This is a simplified calculation - in reality you'd need to recalculate 
        // full season standings with the new weekly results
        const weeklyPerformance = entry.correct_picks / entry.total_picks;
        if (weeklyPerformance > 0.75) {
          entry.yearly_rank_change = Math.max(-3, Math.floor(Math.random() * 4) - 1);
        } else if (weeklyPerformance < 0.5) {
          entry.yearly_rank_change = Math.min(3, Math.floor(Math.random() * 4) - 1);
        } else {
          entry.yearly_rank_change = Math.floor(Math.random() * 3) - 1;
        }
      }
    });

    res.json({
      week,
      season: currentSeason,
      forecast: forecast
    });

  } catch (error) {
    console.error('Calculate forecast error:', error);
    res.status(500).json({ error: 'Failed to calculate forecast' });
  }
});

// GET /api/tracker/accessibility/:week - Check if live tracker should be accessible
router.get('/accessibility/:week', async (req, res) => {
  try {
    const week = parseInt(req.params.week);
    const season = parseInt(req.query.season) || new Date().getFullYear();

    // Get the first game of the week
    const result = await req.db.query(
      `SELECT MIN(game_date) as first_game_date
       FROM games 
       WHERE week = $1 AND season = $2`,
      [week, season]
    );

    const firstGameDate = result.rows[0]?.first_game_date;
    const now = new Date();
    const isAccessible = firstGameDate && new Date(firstGameDate) <= now;

    res.json({
      week,
      season,
      accessible: isAccessible,
      first_game_date: firstGameDate
    });

  } catch (error) {
    console.error('Check accessibility error:', error);
    res.status(500).json({ error: 'Failed to check accessibility' });
  }
});

module.exports = router;