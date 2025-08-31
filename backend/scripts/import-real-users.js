#!/usr/bin/env node

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function importRealUsers() {
  console.log('👥 Setting up real user import for The Pool...');
  
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

    console.log('\n📋 REAL USER IMPORT INSTRUCTIONS:');
    console.log('   This script helps you import your actual league participants.');
    console.log('   You have two options:\n');
    
    console.log('🔧 OPTION 1: Manual Entry');
    console.log('   Edit this script to add user data in the format below:');
    console.log('   const realUsers = [');
    console.log('     {');
    console.log('       username: "johnsmith",');
    console.log('       email: "john@email.com",');
    console.log('       firstName: "John",');
    console.log('       lastName: "Smith",');
    console.log('       alias: "Johnny Football",');
    console.log('       phone: "(555) 123-4567",');
    console.log('       venmoPaypal: "@johnsmith"');
    console.log('     },');
    console.log('     // ... add more users');
    console.log('   ];');
    
    console.log('\n📄 OPTION 2: CSV Import');
    console.log('   1. Create a CSV file with headers:');
    console.log('      username,email,firstName,lastName,alias,phone,venmoPaypal');
    console.log('   2. Update this script to read from CSV');
    console.log('   3. Run: node import-real-users.js path/to/users.csv');

    console.log('\n🔐 SECURITY NOTES:');
    console.log('   - All users get temporary password "TempPass2025!"');
    console.log('   - Users must change password on first login');
    console.log('   - Aliases must be unique (used for public display)');
    console.log('   - Real names/contact info only visible to admins');

    // Example users array (to be replaced with real data)
    const realUsers = [
      // Add your real users here in this format:
      // {
      //   username: "user1",
      //   email: "user1@email.com", 
      //   firstName: "First",
      //   lastName: "Last",
      //   alias: "Display Name",
      //   phone: "(555) 123-4567",
      //   venmoPaypal: "@username"
      // }
    ];

    if (realUsers.length === 0) {
      console.log('\n⚠️  No users to import. Please add user data to the realUsers array in this script.');
      console.log('    Then run: node import-real-users.js');
      return;
    }

    const saltRounds = 12;
    const tempPassword = await bcrypt.hash('TempPass2025!', saltRounds);
    
    let successCount = 0;
    let errorCount = 0;

    console.log(`\n🚀 Importing ${realUsers.length} real users...`);

    for (const user of realUsers) {
      try {
        const result = await pool.query(`
          INSERT INTO users (
            username, email, password_hash, first_name, last_name,
            alias, phone, venmo_paypal_handle, is_admin, is_active, created_at, timezone
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING user_id, username, alias
        `, [
          user.username,
          user.email,
          tempPassword,
          user.firstName,
          user.lastName,
          user.alias,
          user.phone || null,
          user.venmoPaypal || null,
          false, // is_admin
          true,  // is_active
          new Date(),
          'America/New_York'
        ]);

        const newUser = result.rows[0];
        console.log(`✅ Created: ${newUser.alias} (@${newUser.username})`);
        successCount++;

      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⚠️  Skipping duplicate: ${user.username} or ${user.alias}`);
        } else {
          console.error(`❌ Error creating user ${user.username}:`, error.message);
        }
        errorCount++;
      }
    }

    console.log(`\n🎉 Real user import complete!`);
    console.log(`✅ Successfully created: ${successCount} users`);
    console.log(`⚠️  Errors/Skipped: ${errorCount} users`);
    
    // Show final user count
    const finalCount = await pool.query('SELECT COUNT(*) FROM users WHERE is_admin = false');
    console.log(`👥 Total non-admin users: ${finalCount.rows[0].count}`);

    console.log('\n📧 NEXT STEPS:');
    console.log('   1. Send login credentials to each user:');
    console.log('      - Username: their_username');
    console.log('      - Temporary Password: TempPass2025!'); 
    console.log('      - They must change password on first login');
    console.log('   2. Test user registration and login flow');
    console.log('   3. Verify privacy: only aliases shown in public views');

  } catch (error) {
    console.error('❌ User import failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  importRealUsers();
}

module.exports = { importRealUsers };