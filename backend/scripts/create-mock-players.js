const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

// List of 100 unique aliases
const aliases = [
  'ABN JJ', 'Afro B Pod', 'Alan Greenspan', 'AndyMoog', 'Avengers', 'Babyit', 'Bdwstang1', 
  'Bellas Chicks', 'BigJ', 'Blue Balls', 'Bob Baffert', 'Bob Kraft', 'BobbyMFWaffles', 'Boner', 
  'BREWS BROTHERS', 'Clammy Twatkins', 'Clueless Again', 'Cluuless777', 'Cmorepink', 'Cnicastro2014',
  'Cruznforabruizn', 'Cuacon85', 'D&K', 'dbgravediggers', 'Deputy Dawg', 'Dirk Diggler', 'Dragon',
  'Dream Team', 'E4', 'fishing', 'Footsteps Falco', 'G Money', 'G-Money', 'Gavone', 'Geoff',
  'Going for Broke', 'Gold Rush', 'GOtoC', 'hawktua68', 'Hopeless', 'Hyphen', 'J and J', 'Jackson',
  'John Keane', 'John Quincy Adams', 'jongiggs', 'konabolona', 'Larry Gs Picks', 'Left Bench',
  'limoncello', 'Little Thumbs', 'Long Overdue', 'LostBoys', 'Lsredskins', 'Lucky Bastard 2',
  'Marvelous 3', 'Master Deflator', 'Matt Staffords Cousin', 'Maye The Force Be With U', 'MEAHDA',
  'Mischief', 'MLD', 'Moonlight', 'Munchkins', 'NeverForgetWhatsHisName', 'Notaclue', 'Pecanpie',
  'Phantom Menace', 'Pick Wizard', 'Pickles', 'Pokerface', 'Puka HawkTua', 'QueenK', 'Red Light',
  'Reggie', 'Rogo2mt2023', 'RunDLB', 'Sack n Snatch', 'Santuccio', 'SistaJ', 'Skibidi Rizzler',
  'Skippersan', 'Spider2yBanana', 'Suburban housewives', 'Sweet Polly Purebred', 'Team Dingas',
  'Team Ram Rod', 'Tet1968', 'The cac', 'The Elite', 'The Juggy', 'The Pack', 'thechumpishere',
  'Tweetybird', 'Whos coming in second', 'Wintersoldier', 'WTF CHUCK', 'WTFMrBill', 'WTFMrMagoo', 'Z'
];

// Common first names
const firstNames = [
  'Michael', 'John', 'David', 'James', 'Robert', 'William', 'Mary', 'Patricia', 'Jennifer', 'Linda',
  'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Dorothy',
  'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Margaret', 'Carol', 'Michelle', 'Amanda', 'Melissa',
  'Deborah', 'Stephanie', 'Daniel', 'Paul', 'Mark', 'Donald', 'George', 'Kenneth', 'Steven', 'Edward',
  'Brian', 'Ronald', 'Anthony', 'Kevin', 'Jason', 'Matthew', 'Gary', 'Timothy', 'Jose', 'Larry',
  'Jeffrey', 'Frank', 'Scott', 'Eric', 'Stephen', 'Andrew', 'Raymond', 'Joshua', 'Wayne', 'Brandon',
  'Christopher', 'Richard', 'Charles', 'Joseph', 'Thomas', 'Jacob', 'Ryan', 'Nicholas', 'Tyler', 'Aaron',
  'Samuel', 'Benjamin', 'Noah', 'Mason', 'Lucas', 'Ethan', 'Logan', 'Oliver', 'Elijah', 'Alexander',
  'Grace', 'Victoria', 'Hannah', 'Alexis', 'Rachel', 'Samantha', 'Lauren', 'Madison', 'Taylor', 'Kayla',
  'Abigail', 'Brittany', 'Danielle', 'Megan', 'Jasmine', 'Katherine', 'Amy', 'Crystal', 'Anna', 'Julie'
];

// Common last names
const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'
];

// Common street names
const streetNames = [
  'Main Street', 'Oak Avenue', 'Park Drive', 'Maple Lane', 'First Avenue', 'Second Street', 'Third Street',
  'Church Street', 'Washington Street', 'Elm Street', 'Cedar Avenue', 'Pine Street', 'Lake Drive',
  'Hill Road', 'Spring Street', 'Court Street', 'Liberty Street', 'Franklin Street', 'Market Street',
  'High Street', 'Mill Street', 'School Street', 'Center Street', 'Valley Road', 'River Road',
  'Sunset Drive', 'Sunrise Avenue', 'Meadow Lane', 'Forest Drive', 'Garden Street', 'Ridge Road'
];

// Common cities and states
const cities = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA',
  'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA', 'Austin, TX', 'Jacksonville, FL',
  'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC', 'San Francisco, CA', 'Indianapolis, IN', 'Seattle, WA',
  'Denver, CO', 'Washington, DC', 'Boston, MA', 'El Paso, TX', 'Nashville, TN', 'Detroit, MI',
  'Oklahoma City, OK', 'Portland, OR', 'Las Vegas, NV', 'Memphis, TN', 'Louisville, KY', 'Baltimore, MD',
  'Milwaukee, WI', 'Albuquerque, NM', 'Tucson, AZ', 'Fresno, CA', 'Mesa, AZ', 'Sacramento, CA',
  'Atlanta, GA', 'Kansas City, MO', 'Colorado Springs, CO', 'Miami, FL', 'Raleigh, NC', 'Omaha, NE',
  'Long Beach, CA', 'Virginia Beach, VA', 'Oakland, CA', 'Minneapolis, MN', 'Tulsa, OK', 'Tampa, FL',
  'Arlington, TX', 'New Orleans, LA'
];

// Email domains
const emailDomains = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com',
  'comcast.net', 'verizon.net', 'att.net', 'sbcglobal.net', 'cox.net', 'charter.net'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generatePhoneNumber() {
  const areaCode = Math.floor(Math.random() * 800) + 200; // 200-999
  const exchange = Math.floor(Math.random() * 800) + 200; // 200-999
  const number = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
  return `(${areaCode}) ${exchange}-${number}`;
}

function generateAddress() {
  const houseNumber = Math.floor(Math.random() * 9999) + 1;
  const street = getRandomElement(streetNames);
  const cityState = getRandomElement(cities);
  const zipCode = Math.floor(Math.random() * 90000) + 10000;
  return `${houseNumber} ${street}, ${cityState} ${zipCode}`;
}

function createUsername(firstName, lastName) {
  const variations = [
    firstName.toLowerCase() + lastName.toLowerCase(),
    firstName.toLowerCase() + lastName.toLowerCase() + Math.floor(Math.random() * 100),
    firstName.toLowerCase() + '.' + lastName.toLowerCase(),
    firstName.charAt(0).toLowerCase() + lastName.toLowerCase(),
    firstName.toLowerCase() + lastName.charAt(0).toLowerCase(),
    firstName.toLowerCase() + '_' + lastName.toLowerCase()
  ];
  return getRandomElement(variations);
}

function createEmail(firstName, lastName) {
  const username = createUsername(firstName, lastName);
  const domain = getRandomElement(emailDomains);
  return `${username}@${domain}`;
}

async function createMockPlayers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🏈 Creating 100 mock players for The Pool...');
    
    // First, let's backup existing users (just in case)
    const existingUsers = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`📋 Current users in database: ${existingUsers.rows[0].count}`);

    const saltRounds = 12;
    const defaultPassword = await bcrypt.hash('password123', saltRounds);
    
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < aliases.length; i++) {
      const alias = aliases[i];
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const username = createUsername(firstName, lastName);
      const email = createEmail(firstName, lastName);
      const phone = generatePhoneNumber();
      const address = generateAddress();

      try {
        await pool.query(`
          INSERT INTO users (
            username, email, password_hash, first_name, last_name, 
            is_admin, is_active, created_at, timezone
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          username,
          email,
          defaultPassword,
          firstName,
          lastName,
          false, // is_admin
          true,  // is_active
          new Date(),
          'America/New_York'
        ]);

        successCount++;
        if (successCount % 20 === 0) {
          console.log(`✅ Created ${successCount} players...`);
        }

      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⚠️  Skipping duplicate: ${username} (${email})`);
        } else {
          console.error(`❌ Error creating player ${alias}:`, error.message);
        }
        errorCount++;
      }
    }

    console.log(`\n🎉 Mock player creation complete!`);
    console.log(`✅ Successfully created: ${successCount} players`);
    console.log(`⚠️  Errors/Skipped: ${errorCount} players`);
    console.log(`📊 Total players now: ${successCount + parseInt(existingUsers.rows[0].count)}`);

    // Show a few sample players
    const sampleUsers = await pool.query(`
      SELECT username, first_name, last_name, email
      FROM users 
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log('\n📋 Sample of newly created players:');
    sampleUsers.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.first_name} ${user.last_name} (@${user.username}) - ${user.email}`);
    });

    console.log('\n🔑 All players have the default password: password123');
    console.log('💡 You can now test the app with a realistic user base!');

  } catch (error) {
    console.error('❌ Failed to create mock players:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  createMockPlayers();
}

module.exports = { createMockPlayers };