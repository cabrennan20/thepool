const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

async function addPasswordResetColumns() {
  try {
    console.log('🔄 Adding password reset columns to users table...');
    
    // Add reset_token and reset_token_expiry columns
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;
    `);
    
    // Create index for reset token lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
    `);
    
    console.log('✅ Password reset columns added successfully');
    
  } catch (error) {
    console.error('❌ Failed to add password reset columns:', error.message);
  } finally {
    await pool.end();
  }
}

addPasswordResetColumns();