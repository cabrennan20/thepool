const { Pool } = require('pg');
require('dotenv').config();

// NFL teams
const nflTeams = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN',
  'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA',
  'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB',
  'TEN', 'WAS'
];

// Generate realistic games for a week (simplified)
function generateWeekGames(week, season) {
  const shuffledTeams = [...nflTeams].sort(() => Math.random() - 0.5);
  const games = [];
  
  // Create 16 games
  for (let i = 0; i < 32; i += 2) {
    const homeTeam = shuffledTeams[i];
    const awayTeam = shuffledTeams[i + 1];
    
    // Calculate game date
    const baseDate = new Date('2025-09-08');
    const weekStartDate = new Date(baseDate);
    weekStartDate.setDate(baseDate.getDate() + (week - 1) * 7);
    
    const gameDate = new Date(weekStartDate);
    if (i === 0) gameDate.setDate(weekStartDate.getDate() + 4); // Thursday
    else gameDate.setDate(weekStartDate.getDate()); // Sunday
    gameDate.setHours(13 + (i % 3) * 3, 0, 0, 0);
    
    games.push({
      season,
      week,
      game_date: gameDate,
      home_team: homeTeam,
      away_team: awayTeam,
      spread: Math.round((Math.random() - 0.5) * 14 * 2) / 2,
      game_status: 'scheduled'
    });
  }
  
  return games.sort((a, b) => a.game_date - b.game_date);
}

async function createMockPicksFast() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🚀 Creating mock picks data FAST (weeks 1-9)...');
    
    // Get users (limit to 20 for faster testing)
    const usersResult = await pool.query('SELECT user_id FROM users WHERE is_active = true ORDER BY user_id LIMIT 20');
    const users = usersResult.rows;
    console.log(`👥 Using ${users.length} users for testing`);
    
    // Clear existing data
    await pool.query('DELETE FROM picks');
    await pool.query('DELETE FROM games WHERE season = 2025');
    
    let totalGames = 0;
    let totalPicks = 0;
    
    for (let week = 1; week <= 9; week++) {
      console.log(`📊 Week ${week}...`);
      
      const weekGames = generateWeekGames(week, 2025);
      
      // Batch insert games
      const gameValues = weekGames.map((game, i) => 
        `(${game.season}, ${game.week}, '${game.game_date.toISOString()}', '${game.home_team}', '${game.away_team}', ${game.spread}, '${game.game_status}')`
      ).join(',');
      
      await pool.query(`
        INSERT INTO games (season, week, game_date, home_team, away_team, spread, game_status)
        VALUES ${gameValues}
      `);
      
      // Get inserted game IDs
      const gamesResult = await pool.query(`
        SELECT game_id, home_team, away_team, spread 
        FROM games 
        WHERE week = $1 AND season = 2025 
        ORDER BY game_date
      `, [week]);
      
      const games = gamesResult.rows;
      totalGames += games.length;
      
      // Complete games for weeks 1-8, Thursday game for week 9
      if (week <= 8) {
        for (const game of games) {
          const homeScore = Math.floor(Math.random() * 21) + 14;
          const awayScore = Math.floor(Math.random() * 21) + 14;
          
          await pool.query(`
            UPDATE games 
            SET home_score = $1, away_score = $2, game_status = 'final' 
            WHERE game_id = $3
          `, [homeScore, awayScore, game.game_id]);
        }
      } else if (week === 9) {
        // Complete only first game (Thursday)
        const thursdayGame = games[0];
        const homeScore = 24;
        const awayScore = 17;
        
        await pool.query(`
          UPDATE games 
          SET home_score = $1, away_score = $2, game_status = 'final' 
          WHERE game_id = $3
        `, [homeScore, awayScore, thursdayGame.game_id]);
        
        console.log(`🏈 Thursday: ${thursdayGame.away_team} @ ${thursdayGame.home_team} - ${awayScore}-${homeScore} FINAL`);
      }
      
      // Batch create picks
      const pickValues = [];
      for (const user of users) {
        for (const game of games) {
          const selectedTeam = Math.random() > 0.5 ? game.home_team : game.away_team;
          const pickTime = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000); // Random pick time in last 24h
          
          pickValues.push(`(${user.user_id}, ${game.game_id}, '${selectedTeam}', '${pickTime.toISOString()}')`);
          totalPicks++;
        }
      }
      
      // Insert picks in batches
      const batchSize = 1000;
      for (let i = 0; i < pickValues.length; i += batchSize) {
        const batch = pickValues.slice(i, i + batchSize);
        await pool.query(`
          INSERT INTO picks (user_id, game_id, selected_team, pick_time)
          VALUES ${batch.join(',')}
          ON CONFLICT (user_id, game_id) DO NOTHING
        `);
      }
      
      console.log(`✅ Week ${week}: ${games.length} games, ${users.length * games.length} picks`);
    }
    
    // Update pick correctness
    console.log('🎯 Calculating results...');
    await pool.query(`
      UPDATE picks 
      SET is_correct = (
        CASE 
          WHEN g.home_score IS NULL THEN NULL
          WHEN (g.home_score > g.away_score AND picks.selected_team = g.home_team) THEN true
          WHEN (g.away_score > g.home_score AND picks.selected_team = g.away_team) THEN true
          ELSE false
        END
      )
      FROM games g
      WHERE picks.game_id = g.game_id
    `);
    
    // Show stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT g.game_id) as total_games,
        COUNT(DISTINCT CASE WHEN g.game_status = 'final' THEN g.game_id END) as completed_games,
        COUNT(p.pick_id) as total_picks,
        COUNT(CASE WHEN p.is_correct = true THEN 1 END) as correct_picks
      FROM games g
      LEFT JOIN picks p ON g.game_id = p.game_id
      WHERE g.season = 2025
    `);
    
    const stats = statsResult.rows[0];
    console.log(`\n🎉 Mock data created!`);
    console.log(`📊 Stats: ${stats.total_games} games, ${stats.completed_games} completed, ${stats.total_picks} picks, ${stats.correct_picks} correct`);
    
    // Show top performers
    const leaderboard = await pool.query(`
      SELECT 
        u.username,
        COUNT(CASE WHEN p.is_correct = true THEN 1 END) as correct,
        COUNT(CASE WHEN p.is_correct IS NOT NULL THEN 1 END) as total,
        ROUND(COUNT(CASE WHEN p.is_correct = true THEN 1 END)::float / NULLIF(COUNT(CASE WHEN p.is_correct IS NOT NULL THEN 1 END), 0) * 100) as pct
      FROM users u
      JOIN picks p ON u.user_id = p.user_id
      JOIN games g ON p.game_id = g.game_id AND g.game_status = 'final'
      GROUP BY u.user_id, u.username
      ORDER BY pct DESC, correct DESC
      LIMIT 5
    `);
    
    console.log(`\n🏆 Top 5 Performers:`);
    leaderboard.rows.forEach((user, i) => {
      console.log(`   ${i+1}. ${user.username}: ${user.correct}/${user.total} (${user.pct}%)`);
    });
    
    console.log(`\n✅ Ready to test! Try triggering weekly recap for Week 8`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createMockPicksFast();