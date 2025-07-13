const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const ODDS_API_KEY = process.env.ODDS_API_KEY || '79e5cc79e3e53c495cc5e8b237bef599';

// Team name mapping from full names to abbreviations
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

async function fetchNFLGames() {
  try {
    console.log('🏈 Fetching NFL games from The Odds API...');
    
    const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?regions=us&markets=h2h,spreads&apiKey=${ODDS_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const games = await response.json();
    console.log(`📊 Found ${games.length} games from The Odds API`);
    
    return games;
  } catch (error) {
    console.error('❌ Error fetching from Odds API:', error.message);
    return [];
  }
}

function calculateWeekFromDate(gameDate) {
  // Simple week calculation - September starts Week 1
  const date = new Date(gameDate);
  const month = date.getMonth() + 1; // 0-indexed
  const day = date.getDate();
  
  if (month === 9) {
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    if (day <= 28) return 4;
    return 5;
  } else if (month === 10) {
    if (day <= 7) return 5;
    if (day <= 14) return 6;
    if (day <= 21) return 7;
    if (day <= 28) return 8;
    return 9;
  } else if (month === 11) {
    if (day <= 7) return 10;
    if (day <= 14) return 11;
    if (day <= 21) return 12;
    if (day <= 28) return 13;
    return 14;
  } else if (month === 12) {
    if (day <= 7) return 15;
    if (day <= 14) return 16;
    if (day <= 21) return 17;
    if (day <= 28) return 18;
    return 19;
  } else if (month === 1) {
    return 20; // Playoffs
  }
  
  return 1; // Default to week 1
}

function extractSpread(game) {
  // Find spread market data
  for (const bookmaker of game.bookmakers) {
    const spreadMarket = bookmaker.markets.find(m => m.key === 'spreads');
    if (spreadMarket && spreadMarket.outcomes.length >= 2) {
      // Find home team outcome
      const homeOutcome = spreadMarket.outcomes.find(o => o.name === game.home_team);
      if (homeOutcome && homeOutcome.point) {
        return parseFloat(homeOutcome.point);
      }
    }
  }
  return null;
}

async function syncGamesToDatabase(games) {
  try {
    console.log('🗄️  Syncing games to database...');
    
    let insertedCount = 0;
    let updatedCount = 0;
    
    for (const game of games) {
      const homeTeam = teamMapping[game.home_team] || game.home_team;
      const awayTeam = teamMapping[game.away_team] || game.away_team;
      const gameDate = new Date(game.commence_time);
      const week = calculateWeekFromDate(gameDate);
      const season = gameDate.getFullYear();
      const spread = extractSpread(game);
      
      // Check if game already exists
      const existingGame = await pool.query(
        'SELECT game_id FROM games WHERE season = $1 AND week = $2 AND home_team = $3 AND away_team = $4',
        [season, week, homeTeam, awayTeam]
      );
      
      if (existingGame.rows.length > 0) {
        // Update existing game
        await pool.query(`
          UPDATE games 
          SET game_date = $1, spread = $2, odds_api_id = $3, updated_at = CURRENT_TIMESTAMP
          WHERE game_id = $4
        `, [gameDate, spread, game.id, existingGame.rows[0].game_id]);
        updatedCount++;
      } else {
        // Insert new game
        await pool.query(`
          INSERT INTO games (season, week, game_date, home_team, away_team, spread, odds_api_id, game_status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
        `, [season, week, gameDate, homeTeam, awayTeam, spread, game.id]);
        insertedCount++;
      }
    }
    
    console.log(`✅ Database sync complete:`);
    console.log(`   📝 Inserted: ${insertedCount} new games`);
    console.log(`   🔄 Updated: ${updatedCount} existing games`);
    
  } catch (error) {
    console.error('❌ Error syncing to database:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Starting NFL data sync...');
    
    const games = await fetchNFLGames();
    
    if (games.length === 0) {
      console.log('⚠️  No games found to sync');
      return;
    }
    
    await syncGamesToDatabase(games);
    
    console.log('🎉 NFL data sync completed successfully!');
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the sync
main();