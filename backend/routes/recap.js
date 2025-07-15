const express = require('express');
const { authenticateToken } = require('./auth');
const router = express.Router();

// GET /api/recap/week/:week - Get recap data for a specific week
router.get('/week/:week', authenticateToken, async (req, res) => {
  try {
    const week = parseInt(req.params.week);
    const season = parseInt(req.query.season) || new Date().getFullYear();

    // Check if picks are closed for this week (first game has started)
    const firstGameResult = await req.db.query(
      `SELECT game_id, game_date, game_status 
       FROM games 
       WHERE week = $1 AND season = $2 
       ORDER BY game_date ASC 
       LIMIT 1`,
      [week, season]
    );

    if (firstGameResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No games found for this week',
        week,
        season
      });
    }

    const firstGame = firstGameResult.rows[0];
    const now = new Date();
    const picksAreClosed = new Date(firstGame.game_date) <= now;

    if (!picksAreClosed) {
      return res.status(403).json({
        error: 'Recap not available - picks are still open',
        week,
        season,
        first_game_date: firstGame.game_date,
        picks_close_at: firstGame.game_date
      });
    }

    // Get all games for this week
    const gamesResult = await req.db.query(
      `SELECT 
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
      ORDER BY game_date`,
      [week, season]
    );

    const games = gamesResult.rows;

    // Get final game for tiebreaker
    const finalGame = games[games.length - 1];

    // Get all active users with their picks for this week
    const picksResult = await req.db.query(
      `SELECT 
        u.user_id,
        u.username,
        u.alias,
        u.first_name,
        u.last_name,
        p.game_id,
        p.selected_team,
        p.tiebreaker_points,
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
      ORDER BY u.alias, g.game_date`,
      [week, season]
    );

    // Group picks by user
    const userPicksMap = new Map();
    
    picksResult.rows.forEach(row => {
      const userId = row.user_id;
      
      if (!userPicksMap.has(userId)) {
        userPicksMap.set(userId, {
          user_id: userId,
          username: row.username,
          alias: row.alias || row.username,
          first_name: row.first_name,
          last_name: row.last_name,
          picks: new Map()
        });
      }
      
      if (row.game_id) {
        userPicksMap.get(userId).picks.set(row.game_id, {
          game_id: row.game_id,
          selected_team: row.selected_team,
          tiebreaker_points: row.tiebreaker_points,
          is_correct: row.is_correct
        });
      }
    });

    // Convert to array and format for grid display
    const recapData = Array.from(userPicksMap.values()).map(user => {
      const userPicks = {};
      let tiebreakerPoints = null;
      
      games.forEach(game => {
        const pick = user.picks.get(game.game_id);
        userPicks[game.game_id] = pick ? pick.selected_team : null;
        
        // Get tiebreaker points from final game
        if (game.game_id === finalGame.game_id && pick && pick.tiebreaker_points !== null) {
          tiebreakerPoints = pick.tiebreaker_points;
        }
      });
      
      return {
        user_id: user.user_id,
        alias: user.alias,
        username: user.username,
        picks: userPicks,
        tiebreaker_points: tiebreakerPoints
      };
    });

    // Calculate pick percentages for each game
    const pickPercentages = {};
    
    games.forEach(game => {
      const gameId = game.game_id;
      let homeTeamPicks = 0;
      let awayTeamPicks = 0;
      let totalPicks = 0;
      
      recapData.forEach(user => {
        const userPick = user.picks[gameId];
        if (userPick) {
          totalPicks++;
          if (userPick === game.home_team) {
            homeTeamPicks++;
          } else if (userPick === game.away_team) {
            awayTeamPicks++;
          }
        }
      });
      
      pickPercentages[gameId] = {
        total_picks: totalPicks,
        home_team_picks: homeTeamPicks,
        away_team_picks: awayTeamPicks,
        home_team_percentage: totalPicks > 0 ? Math.round((homeTeamPicks / totalPicks) * 100) : 0,
        away_team_percentage: totalPicks > 0 ? Math.round((awayTeamPicks / totalPicks) * 100) : 0,
        home_team: game.home_team,
        away_team: game.away_team,
        is_upset: false // Will be calculated after we know the winner
      };
      
      // Determine if this is an upset (if game is finished)
      if (game.game_status === 'final' && game.home_score !== null && game.away_score !== null) {
        const winner = game.home_score > game.away_score ? game.home_team : game.away_team;
        const winnerPercentage = winner === game.home_team ? 
          pickPercentages[gameId].home_team_percentage : 
          pickPercentages[gameId].away_team_percentage;
        
        // Consider it an upset if the winning team was picked by less than 40% of users
        pickPercentages[gameId].is_upset = winnerPercentage < 40;
        pickPercentages[gameId].winner = winner;
      }
    });

    // Sort by alias alphabetically
    recapData.sort((a, b) => a.alias.localeCompare(b.alias));

    res.json({
      week,
      season,
      picks_closed: picksAreClosed,
      games,
      final_game: finalGame,
      recap_data: recapData,
      pick_percentages: pickPercentages,
      total_users: recapData.length,
      total_games: games.length
    });

  } catch (error) {
    console.error('Get recap error:', error);
    res.status(500).json({ error: 'Failed to get recap data' });
  }
});

// GET /api/recap/weeks/:season - Get list of available weeks for recaps
router.get('/weeks/:season', authenticateToken, async (req, res) => {
  try {
    const season = parseInt(req.params.season);
    
    const result = await req.db.query(
      `SELECT DISTINCT 
        week,
        MIN(game_date) as first_game_date,
        MAX(game_date) as last_game_date,
        COUNT(*) as game_count,
        COUNT(CASE WHEN game_status = 'final' THEN 1 END) as completed_games
      FROM games 
      WHERE season = $1 
      GROUP BY week 
      ORDER BY week`,
      [season]
    );

    const now = new Date();
    const weeks = result.rows.map(week => {
      const picksAreClosed = new Date(week.first_game_date) <= now;
      
      return {
        week: week.week,
        first_game_date: week.first_game_date,
        last_game_date: week.last_game_date,
        game_count: parseInt(week.game_count),
        completed_games: parseInt(week.completed_games),
        picks_closed: picksAreClosed,
        recap_available: picksAreClosed
      };
    });

    res.json({
      season,
      weeks
    });

  } catch (error) {
    console.error('Get recap weeks error:', error);
    res.status(500).json({ error: 'Failed to get recap weeks' });
  }
});

// GET /api/recap/user/:userId/week/:week - Get specific user's picks for recap
router.get('/user/:userId/week/:week', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const week = parseInt(req.params.week);
    const season = parseInt(req.query.season) || new Date().getFullYear();

    // Check access permissions
    if (req.user.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await req.db.query(
      `SELECT 
        u.username,
        u.alias,
        p.game_id,
        p.selected_team,
        p.tiebreaker_points,
        p.is_correct,
        g.home_team,
        g.away_team,
        g.game_date,
        g.game_status
      FROM users u
      LEFT JOIN picks p ON u.user_id = p.user_id
      LEFT JOIN games g ON p.game_id = g.game_id
      WHERE u.user_id = $1 
      AND g.week = $2 
      AND g.season = $3
      ORDER BY g.game_date`,
      [userId, week, season]
    );

    res.json({
      user_id: userId,
      week,
      season,
      picks: result.rows
    });

  } catch (error) {
    console.error('Get user recap error:', error);
    res.status(500).json({ error: 'Failed to get user recap data' });
  }
});

module.exports = router;