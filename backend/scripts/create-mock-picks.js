const { Pool } = require('pg');
require('dotenv').config();

// NFL teams
const nflTeams = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN',
  'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA',
  'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB',
  'TEN', 'WAS'
];

// Function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate realistic games for a week
function generateWeekGames(week, season) {
  const shuffledTeams = shuffleArray(nflTeams);
  const games = [];
  
  // Create 16 games (32 teams / 2)
  for (let i = 0; i < shuffledTeams.length; i += 2) {
    const homeTeam = shuffledTeams[i];
    const awayTeam = shuffledTeams[i + 1];
    
    // Generate game date (spread across Thu-Mon)
    let dayOfWeek, hour;
    if (i === 0) { // Thursday Night Football
      dayOfWeek = 4; // Thursday
      hour = 20;
    } else if (i < 8) { // Early Sunday games
      dayOfWeek = 0; // Sunday
      hour = 13;
    } else if (i < 14) { // Late Sunday games
      dayOfWeek = 0; // Sunday
      hour = 16;
    } else if (i === 14) { // Sunday Night Football
      dayOfWeek = 0; // Sunday
      hour = 20;
    } else { // Monday Night Football
      dayOfWeek = 1; // Monday
      hour = 20;
    }
    
    // Calculate actual date (assuming week 1 starts around Sep 8, 2025)
    const baseDate = new Date('2025-09-08');
    const weekStartDate = new Date(baseDate);
    weekStartDate.setDate(baseDate.getDate() + (week - 1) * 7);
    
    const gameDate = new Date(weekStartDate);
    gameDate.setDate(weekStartDate.getDate() + dayOfWeek);
    gameDate.setHours(hour, 0, 0, 0);
    
    // Generate spread (home team favored if negative)
    const spread = (Math.random() - 0.5) * 14; // -7 to +7 point spread
    
    games.push({
      season,
      week,
      game_date: gameDate,
      home_team: homeTeam,
      away_team: awayTeam,
      spread: Math.round(spread * 2) / 2, // Round to nearest 0.5
      game_status: 'scheduled'
    });
  }
  
  return games.sort((a, b) => a.game_date - b.game_date);
}

// Generate final scores for completed games
function generateGameResult(homeTeam, awayTeam, spread) {
  // Generate realistic NFL scores
  const baseScore = Math.floor(Math.random() * 21) + 14; // 14-34 points
  const scoreDiff = Math.floor(Math.random() * 21) + 3; // 3-23 point difference
  
  let homeScore, awayScore;
  
  // Factor in the spread with some randomness
  const spreadFactor = Math.random() > 0.6; // 60% of time spread holds
  
  if (spreadFactor && spread < 0) { // Home team favored
    homeScore = baseScore + Math.floor(scoreDiff / 2);
    awayScore = baseScore - Math.floor(scoreDiff / 2);
  } else if (spreadFactor && spread > 0) { // Away team favored
    awayScore = baseScore + Math.floor(scoreDiff / 2);
    homeScore = baseScore - Math.floor(scoreDiff / 2);
  } else { // Random outcome
    if (Math.random() > 0.5) {
      homeScore = baseScore + Math.floor(scoreDiff / 2);
      awayScore = baseScore - Math.floor(scoreDiff / 2);
    } else {
      awayScore = baseScore + Math.floor(scoreDiff / 2);
      homeScore = baseScore - Math.floor(scoreDiff / 2);
    }
  }
  
  return { homeScore: Math.max(homeScore, 7), awayScore: Math.max(awayScore, 7) };
}

// Generate user picks for a game with realistic distribution
function generateUserPick(game, userSkillLevel = 0.5) {
  // Skill level affects pick accuracy (0.3 = 30% accurate, 0.7 = 70% accurate)
  const favoredTeam = game.spread < 0 ? game.home_team : game.away_team;
  const underdog = game.spread < 0 ? game.away_team : game.home_team;
  
  // Higher skill users pick favorites more often, lower skill more random
  const favoriteChance = 0.4 + (userSkillLevel * 0.3); // 40-70% chance to pick favorite
  
  return Math.random() < favoriteChance ? favoredTeam : underdog;
}

// Determine if pick was correct
function isPickCorrect(selectedTeam, game) {
  if (!game.home_score || !game.away_score) return null; // Game not completed
  
  const homeWon = game.home_score > game.away_score;
  const selectedHome = selectedTeam === game.home_team;
  
  return (homeWon && selectedHome) || (!homeWon && !selectedHome);
}

async function createMockPicks() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🏈 Creating mock picks data for weeks 1-9...');
    console.log('📅 Scenario: It\'s Sunday morning of Week 9, Thursday game is complete');
    
    // Get all users
    const usersResult = await pool.query('SELECT user_id, username FROM users WHERE is_active = true');
    const users = usersResult.rows;
    console.log(`👥 Found ${users.length} active users`);
    
    // Assign skill levels to users (affects pick accuracy)
    const userSkills = {};
    users.forEach(user => {
      // Normal distribution of skill: most users around 50%, some better/worse
      const skill = Math.max(0.2, Math.min(0.8, 0.5 + (Math.random() - 0.5) * 0.4));
      userSkills[user.user_id] = skill;
    });
    
    let totalGamesCreated = 0;
    let totalPicksCreated = 0;
    
    // Create games and picks for weeks 1-9
    for (let week = 1; week <= 9; week++) {
      console.log(`\n📊 Processing Week ${week}...`);
      
      // Generate games for this week
      const weekGames = generateWeekGames(week, 2025);
      
      // Insert games and collect game IDs
      const gameIds = [];
      for (const game of weekGames) {
        try {
          const result = await pool.query(`
            INSERT INTO games (season, week, game_date, home_team, away_team, spread, game_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (season, week, home_team, away_team) DO NOTHING
            RETURNING game_id
          `, [game.season, game.week, game.game_date, game.home_team, game.away_team, game.spread, game.game_status]);
          
          if (result.rows.length > 0) {
            gameIds.push({
              game_id: result.rows[0].game_id,
              ...game
            });
            totalGamesCreated++;
          }
        } catch (error) {
          console.error(`Error creating game: ${error.message}`);
        }
      }
      
      // For weeks 1-8: Complete all games and generate results
      if (week <= 8) {
        for (const game of gameIds) {
          const { homeScore, awayScore } = generateGameResult(game.home_team, game.away_team, game.spread);
          
          await pool.query(`
            UPDATE games 
            SET home_score = $1, away_score = $2, game_status = 'final' 
            WHERE game_id = $3
          `, [homeScore, awayScore, game.game_id]);
        }
      }
      
      // For Week 9: Complete only Thursday night game (first game)
      if (week === 9 && gameIds.length > 0) {
        const thursdayGame = gameIds[0]; // First game is Thursday
        const { homeScore, awayScore } = generateGameResult(thursdayGame.home_team, thursdayGame.away_team, thursdayGame.spread);
        
        await pool.query(`
          UPDATE games 
          SET home_score = $1, away_score = $2, game_status = 'final' 
          WHERE game_id = $3
        `, [homeScore, awayScore, thursdayGame.game_id]);
        
        console.log(`🏈 Thursday Night: ${thursdayGame.away_team} @ ${thursdayGame.home_team} - ${awayScore}-${homeScore} FINAL`);
      }
      
      // Create picks for all users for all games in this week
      for (const user of users) {
        for (const game of gameIds) {
          const selectedTeam = generateUserPick(game, userSkills[user.user_id]);
          
          try {
            await pool.query(`
              INSERT INTO picks (user_id, game_id, selected_team, pick_time)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (user_id, game_id) DO NOTHING
            `, [user.user_id, game.game_id, selectedTeam, new Date(game.game_date.getTime() - 2 * 60 * 60 * 1000)]); // Picked 2 hours before game
            
            totalPicksCreated++;
          } catch (error) {
            console.error(`Error creating pick: ${error.message}`);
          }
        }
      }
      
      console.log(`✅ Week ${week}: ${gameIds.length} games, ${users.length * gameIds.length} picks`);
    }
    
    // Update pick correctness for all completed games
    console.log('\n🎯 Calculating pick results...');
    await pool.query(`
      UPDATE picks 
      SET is_correct = (
        CASE 
          WHEN g.home_score IS NULL OR g.away_score IS NULL THEN NULL
          WHEN (g.home_score > g.away_score AND p.selected_team = g.home_team) THEN true
          WHEN (g.away_score > g.home_score AND p.selected_team = g.away_team) THEN true
          ELSE false
        END
      )
      FROM games g
      WHERE picks.game_id = g.game_id
    `);
    
    // Get final statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT g.game_id) as total_games,
        COUNT(DISTINCT CASE WHEN g.game_status = 'final' THEN g.game_id END) as completed_games,
        COUNT(p.pick_id) as total_picks,
        COUNT(CASE WHEN p.is_correct = true THEN 1 END) as correct_picks,
        COUNT(CASE WHEN p.is_correct = false THEN 1 END) as incorrect_picks,
        COUNT(CASE WHEN p.is_correct IS NULL THEN 1 END) as pending_picks
      FROM games g
      LEFT JOIN picks p ON g.game_id = p.game_id
      WHERE g.season = 2025
    `);
    
    const stats = statsResult.rows[0];
    
    console.log(`\n🎉 Mock picks data creation complete!`);
    console.log(`📊 Final Statistics:`);
    console.log(`   Total Games: ${stats.total_games}`);
    console.log(`   Completed Games: ${stats.completed_games}`);
    console.log(`   Scheduled Games: ${stats.total_games - stats.completed_games}`);
    console.log(`   Total Picks: ${stats.total_picks}`);
    console.log(`   Correct Picks: ${stats.correct_picks}`);
    console.log(`   Incorrect Picks: ${stats.incorrect_picks}`);
    console.log(`   Pending Results: ${stats.pending_picks}`);
    
    // Show Week 9 status
    const week9Result = await pool.query(`
      SELECT 
        g.away_team, g.home_team, g.game_date, g.game_status,
        g.away_score, g.home_score,
        COUNT(p.pick_id) as pick_count
      FROM games g
      LEFT JOIN picks p ON g.game_id = p.game_id
      WHERE g.week = 9 AND g.season = 2025
      GROUP BY g.game_id, g.away_team, g.home_team, g.game_date, g.game_status, g.away_score, g.home_score
      ORDER BY g.game_date
    `);
    
    console.log(`\n🏈 Week 9 Games Status:`);
    week9Result.rows.forEach((game, index) => {
      const status = game.game_status === 'final' ? 
        `${game.away_score}-${game.home_score} FINAL` : 
        `${game.game_date.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', hour12: true })}`;
      console.log(`   ${index + 1}. ${game.away_team} @ ${game.home_team} - ${status} (${game.pick_count} picks)`);
    });
    
    console.log(`\n✅ Ready to test Recap functionality with realistic data!`);
    console.log(`💡 Try: POST /api/notifications/trigger/weekly-recap with {"week": 8, "season": 2025}`);
    
  } catch (error) {
    console.error('❌ Failed to create mock picks:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  createMockPicks();
}

module.exports = { createMockPicks };