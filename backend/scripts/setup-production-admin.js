#!/usr/bin/env node

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function setupProductionAdmin() {
  console.log('👑 Setting up production admin accounts...');
  
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

    const saltRounds = 12;

    // Create main admin account
    console.log('\n🔐 Creating main admin account...');
    console.log('📝 Please provide the following information:');
    
    // For now, create a placeholder admin that can be updated
    const adminData = {
      username: 'admin',
      email: 'admin@thepool.com',  // This should be updated to real email
      password: 'AdminPassword2025!', // This should be changed immediately
      firstName: 'Pool',
      lastName: 'Administrator',
      alias: 'Commissioner'
    };

    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

    try {
      const result = await pool.query(`
        INSERT INTO users (
          username, email, password_hash, first_name, last_name,
          alias, is_admin, is_active, created_at, timezone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING user_id, username, email, alias
      `, [
        adminData.username,
        adminData.email,
        hashedPassword,
        adminData.firstName,
        adminData.lastName,
        adminData.alias,
        true,  // is_admin
        true,  // is_active
        new Date(),
        'America/New_York'
      ]);

      const admin = result.rows[0];
      console.log(`✅ Admin account created successfully!`);
      console.log(`   User ID: ${admin.user_id}`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Alias: ${admin.alias}`);
      console.log(`   Password: ${adminData.password}`);
      
      console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
      console.log('   1. Change the admin password immediately after first login');
      console.log('   2. Update admin email to your real email address');
      console.log('   3. Consider creating additional admin accounts for backup access');

    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log('⚠️  Admin account already exists. Checking current admin users...');
        
        const admins = await pool.query(`
          SELECT user_id, username, email, alias, created_at
          FROM users 
          WHERE is_admin = true
          ORDER BY created_at ASC
        `);

        console.log(`\n👑 Current admin accounts (${admins.rows.length}):`);
        admins.rows.forEach((admin, index) => {
          console.log(`   ${index + 1}. ${admin.username} (${admin.email}) - ${admin.alias}`);
        });
      } else {
        throw error;
      }
    }

    console.log('\n🎯 Next steps:');
    console.log('   1. Update DATABASE_URL in .env to point to Railway');
    console.log('   2. Run cleanup-mock-data.js --confirm to remove test data');
    console.log('   3. Set up real user accounts for league participants');
    console.log('   4. Configure The Odds API for live game data');

  } catch (error) {
    console.error('❌ Admin setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupProductionAdmin();
}

module.exports = { setupProductionAdmin };