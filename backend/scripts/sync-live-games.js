#!/usr/bin/env node

const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

// Team abbreviation mapping for The Odds API
const teamMapping = {
  'Arizona Cardinals': 'ARI',
  'Atlanta Falcons': 'ATL', 
  'Baltimore Ravens': 'BAL',
  'Buffalo Bills': 'BUF',
  'Carolina Panthers': 'CAR',
  'Chicago Bears': 'CHI',
  'Cincinnati Bengals': 'CIN',
  'Cleveland Browns': 'CLE',
  'Dallas Cowboys': 'DAL',
  'Denver Broncos': 'DEN',
  'Detroit Lions': 'DET',
  'Green Bay Packers': 'GB',
  'Houston Texans': 'HOU',
  'Indianapolis Colts': 'IND',
  'Jacksonville Jaguars': 'JAX',
  'Kansas City Chiefs': 'KC',
  'Las Vegas Raiders': 'LV',
  'Los Angeles Chargers': 'LAC',
  'Los Angeles Rams': 'LAR',
  'Miami Dolphins': 'MIA',
  'Minnesota Vikings': 'MIN',
  'New England Patriots': 'NE',
  'New Orleans Saints': 'NO',
  'New York Giants': 'NYG',
  'New York Jets': 'NYJ',
  'Philadelphia Eagles': 'PHI',
  'Pittsburgh Steelers': 'PIT',
  'San Francisco 49ers': 'SF',
  'Seattle Seahawks': 'SEA',
  'Tampa Bay Buccaneers': 'TB',
  'Tennessee Titans': 'TEN',
  'Washington Commanders': 'WAS'
};

async function syncLiveGames(week = null, season = 2025) {
  console.log('🏈 Syncing live NFL games from The Odds API...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  if (!process.env.ODDS_API_KEY) {
    console.log('⚠️  ODDS_API_KEY not set. Add your API key to .env file:');
    console.log('   ODDS_API_KEY=your_api_key_here');
    console.log('   Get your free API key at: https://the-odds-api.com/');
    console.log('\n🔧 Using fallback: Creating sample games for testing...');
    await createSampleGames(week, season);
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to production database');

    // Get current week if not specified
    if (!week) {
      const currentWeek = await pool.query("SELECT setting_value FROM system_settings WHERE setting_key = 'current_week'");
      week = currentWeek.rows.length > 0 ? parseInt(currentWeek.rows[0].setting_value) : 1;
    }

    console.log(`📅 Fetching games for Week ${week}, ${season} season...`);

    // Calculate date range for the specified week
    // NFL Week 1 typically starts around September 5-8
    const week1Start = new Date(`${season}-09-05`);
    const weekStart = new Date(week1Start);
    weekStart.setDate(week1Start.getDate() + (week - 1) * 7);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59);

    console.log(`📆 Week ${week} date range: ${weekStart.toDateString()} to ${weekEnd.toDateString()}`);

    // Fetch games from The Odds API
    const response = await axios.get('https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds', {
      params: {
        apiKey: process.env.ODDS_API_KEY,
        regions: 'us',
        markets: 'spreads',
        oddsFormat: 'american'
      }
    });

    // Filter games to only the specified week
    const weekGames = response.data.filter(game => {
      const gameDate = new Date(game.commence_time);
      return gameDate >= weekStart && gameDate <= weekEnd;
    });

    console.log(`📊 Found ${response.data.length} total games from API`);
    console.log(`🎯 Filtered to ${weekGames.length} games for Week ${week}`);

    let gamesCreated = 0;
    let gamesUpdated = 0;

    for (const game of weekGames) {
      try {
        const homeTeam = teamMapping[game.home_team] || game.home_team;
        const awayTeam = teamMapping[game.away_team] || game.away_team;
        const gameDate = new Date(game.commence_time);
        
        // Extract spread from odds data
        let spread = null;
        if (game.bookmakers && game.bookmakers.length > 0) {
          const spreadMarket = game.bookmakers[0].markets.find(m => m.key === 'spreads');
          if (spreadMarket && spreadMarket.outcomes) {
            const homeSpread = spreadMarket.outcomes.find(o => o.name === game.home_team);
            if (homeSpread) {
              spread = parseFloat(homeSpread.point);
            }
          }
        }

        // Insert or update game
        const result = await pool.query(`
          INSERT INTO games (season, week, game_date, home_team, away_team, spread, odds_api_id, game_status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (season, week, home_team, away_team) 
          DO UPDATE SET
            game_date = EXCLUDED.game_date,
            spread = EXCLUDED.spread,
            odds_api_id = EXCLUDED.odds_api_id,
            updated_at = CURRENT_TIMESTAMP
          RETURNING game_id, (xmax = 0) AS inserted
        `, [season, week, gameDate, homeTeam, awayTeam, spread, game.id, 'scheduled']);

        if (result.rows[0].inserted) {
          gamesCreated++;
        } else {
          gamesUpdated++;
        }

      } catch (error) {
        console.error(`❌ Error processing game ${game.home_team} vs ${game.away_team}:`, error.message);
      }
    }

    console.log(`✅ Sync complete!`);
    console.log(`   Games created: ${gamesCreated}`);
    console.log(`   Games updated: ${gamesUpdated}`);
    console.log(`   Total games in Week ${week}: ${gamesCreated + gamesUpdated}`);

  } catch (error) {
    console.error('❌ Live games sync failed:', error.message);
    
    if (error.response && error.response.status === 401) {
      console.log('🔑 API key may be invalid. Check your ODDS_API_KEY in .env');
    } else if (error.response && error.response.status === 429) {
      console.log('⏱️  API rate limit exceeded. Try again later.');
    }
    
  } finally {
    await pool.end();
  }
}

async function createSampleGames(week = 1, season = 2025) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log(`🎯 Creating sample games for Week ${week}...`);
    
    // Week 1 sample games (you'll replace with API data)
    const sampleGames = [
      { home: 'KC', away: 'BAL', date: '2025-09-05 20:20:00', spread: -3.5 },
      { home: 'BUF', away: 'MIA', date: '2025-09-07 13:00:00', spread: -6.0 },
      { home: 'DAL', away: 'NYG', date: '2025-09-07 13:00:00', spread: -4.5 },
      { home: 'SF', away: 'LAR', date: '2025-09-07 16:25:00', spread: -2.5 },
      { home: 'GB', away: 'CHI', date: '2025-09-07 20:20:00', spread: -7.0 }
    ];

    let created = 0;
    for (const game of sampleGames) {
      try {
        await pool.query(`
          INSERT INTO games (season, week, game_date, home_team, away_team, spread, game_status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (season, week, home_team, away_team) DO NOTHING
        `, [season, week, game.date, game.home, game.away, game.spread, 'scheduled']);
        created++;
      } catch (error) {
        console.error(`Error creating game: ${error.message}`);
      }
    }

    console.log(`✅ Created ${created} sample games for testing`);
    console.log('💡 To use real data, add ODDS_API_KEY to .env and run again');

  } catch (error) {
    console.error('❌ Sample games creation failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  const week = process.argv[2] ? parseInt(process.argv[2]) : null;
  const season = process.argv[3] ? parseInt(process.argv[3]) : 2025;
  syncLiveGames(week, season);
}

module.exports = { syncLiveGames };