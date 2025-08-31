#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

async function cleanupMockData() {
  console.log('🧹 Starting production database cleanup...');
  
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
    console.log('✅ Connected to production database');

    // Get current data counts
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const gameCount = await pool.query('SELECT COUNT(*) FROM games');
    const pickCount = await pool.query('SELECT COUNT(*) FROM picks');
    const scoreCount = await pool.query('SELECT COUNT(*) FROM weekly_scores');

    console.log('\n📊 Current database state:');
    console.log(`   Users: ${userCount.rows[0].count}`);
    console.log(`   Games: ${gameCount.rows[0].count}`);
    console.log(`   Picks: ${pickCount.rows[0].count}`);
    console.log(`   Weekly Scores: ${scoreCount.rows[0].count}`);

    // Confirm cleanup
    console.log('\n⚠️  This will DELETE ALL existing data. Are you sure?');
    console.log('    Run with --confirm flag to proceed: node cleanup-mock-data.js --confirm');
    
    if (!process.argv.includes('--confirm')) {
      console.log('❌ Cleanup cancelled. Add --confirm flag to proceed.');
      return;
    }

    console.log('\n🗑️  Starting cleanup...');

    // Delete in correct order due to foreign key constraints
    console.log('   Deleting weekly_scores...');
    try {
      await pool.query('DELETE FROM weekly_scores');
    } catch (e) {
      console.log('     (weekly_scores table not found, skipping)');
    }
    
    console.log('   Deleting picks...');
    try {
      await pool.query('DELETE FROM picks');
    } catch (e) {
      console.log('     (picks table not found, skipping)');
    }
    
    console.log('   Deleting games...');
    try {
      await pool.query('DELETE FROM games');
    } catch (e) {
      console.log('     (games table not found, skipping)');
    }
    
    console.log('   Deleting admin_messages...');
    try {
      await pool.query('DELETE FROM admin_messages');
    } catch (e) {
      console.log('     (admin_messages table not found, skipping)');
    }
    
    console.log('   Deleting non-admin users...');
    try {
      await pool.query('DELETE FROM users WHERE is_admin = false');
    } catch (e) {
      console.log('     (users table not found, skipping)');
    }
    
    // Reset sequences
    console.log('   Resetting sequences...');
    try {
      await pool.query('ALTER SEQUENCE users_user_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE games_game_id_seq RESTART WITH 1'); 
      await pool.query('ALTER SEQUENCE picks_pick_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE weekly_scores_score_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE season_standings_standing_id_seq RESTART WITH 1');
    } catch (e) {
      console.log('     (Some sequences not found, skipping)');
    }

    // Verify cleanup
    const finalUserCount = await pool.query('SELECT COUNT(*) FROM users');
    const finalGameCount = await pool.query('SELECT COUNT(*) FROM games');
    const finalPickCount = await pool.query('SELECT COUNT(*) FROM picks');

    console.log('\n✅ Cleanup complete!');
    console.log('📊 Final database state:');
    console.log(`   Users: ${finalUserCount.rows[0].count} (admin accounts only)`);
    console.log(`   Games: ${finalGameCount.rows[0].count}`);
    console.log(`   Picks: ${finalPickCount.rows[0].count}`);
    console.log('\n🎉 Database is ready for production users and real NFL data!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  cleanupMockData();
}

module.exports = { cleanupMockData };