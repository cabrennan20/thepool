#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  console.log('🔄 Initializing Railway PostgreSQL database...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to Railway PostgreSQL');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '../../database/enhanced_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Creating database schema...');
    await pool.query(schema);
    console.log('✅ Database schema created successfully');

    // Insert sample games for testing
    console.log('🏈 Inserting sample NFL games...');
    await pool.query(`
      INSERT INTO games (season, week, game_date, home_team, away_team, game_status) VALUES
      (2025, 1, '2025-09-08 20:00:00', 'Chiefs', 'Ravens', 'scheduled'),
      (2025, 1, '2025-09-09 13:00:00', 'Bills', 'Dolphins', 'scheduled'),
      (2025, 1, '2025-09-09 13:00:00', 'Cowboys', 'Giants', 'scheduled'),
      (2025, 1, '2025-09-09 16:25:00', '49ers', 'Rams', 'scheduled'),
      (2025, 1, '2025-09-09 20:20:00', 'Packers', 'Bears', 'scheduled')
      ON CONFLICT (season, week, home_team, away_team) DO NOTHING;
    `);
    
    console.log('✅ Sample games inserted');
    console.log('🎉 Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };