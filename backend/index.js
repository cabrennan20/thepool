const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "https://nfl-picks-tracker.vercel.app",
    /^https:\/\/.*\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use('/api/', limiter);

// Database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('🗄️  Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Initialize notification service
const NotificationService = require('./services/notificationService');
const notificationService = new NotificationService(pool);
notificationService.initialize();

// Import route handlers
const { router: authRoutes } = require('./routes/auth');
const gameRoutes = require('./routes/games');
const pickRoutes = require('./routes/picks');
const scoreRoutes = require('./routes/scores');
const adminRoutes = require('./routes/admin');
const adminMessageRoutes = require('./routes/admin-messages');
const systemRoutes = require('./routes/system');
const recapRoutes = require('./routes/recap');
const notificationRoutes = require('./routes/notifications');
const trackerRoutes = require('./routes/tracker');

// Add database pool to request object
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/picks', pickRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin-messages', adminMessageRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/recap', recapRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tracker', trackerRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// REMOVED: Dangerous admin creation endpoint for security

// GET /api/users/:userId/stats - Get user stats for dashboard
app.get("/api/users/:userId/stats", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const season = parseInt(req.query.season) || new Date().getFullYear();
    
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(ws.correct_picks), 0) as total_correct,
        COALESCE(SUM(ws.total_picks), 0) as total_games,
        COALESCE(AVG(ws.win_percentage), 0) as win_percentage,
        COUNT(ws.week) as weeks_played,
        0 as season_rank
      FROM weekly_scores ws
      WHERE ws.user_id = $1 AND ws.season = $2
    `, [userId, season]);
    
    const rawStats = result.rows[0] || {
      total_correct: 0,
      total_games: 0, 
      win_percentage: 0,
      weeks_played: 0,
      season_rank: 0
    };
    
    // Convert string numbers to actual numbers for frontend
    const stats = {
      total_correct: parseInt(rawStats.total_correct) || 0,
      total_games: parseInt(rawStats.total_games) || 0,
      win_percentage: parseFloat(rawStats.win_percentage) || 0,
      weeks_played: parseInt(rawStats.weeks_played) || 0,
      season_rank: parseInt(rawStats.season_rank) || 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Backward compatibility for existing frontend API calls
app.get("/api/leaderboard", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.username,
        u.first_name,
        u.last_name,
        COALESCE(SUM(ws.correct_picks), 0) as total_wins,
        COALESCE(SUM(ws.total_picks), 0) as total_games,
        COALESCE(AVG(ws.win_percentage), 0) as win_percentage
      FROM users u 
      LEFT JOIN weekly_scores ws ON u.user_id = ws.user_id
      WHERE u.is_active = true
      GROUP BY u.user_id, u.username, u.first_name, u.last_name
      ORDER BY total_wins DESC, win_percentage DESC
      LIMIT 20
    `);
    
    // Convert string numbers to actual numbers for frontend
    const leaderboard = result.rows.map(row => ({
      ...row,
      total_wins: parseInt(row.total_wins) || 0,
      total_games: parseInt(row.total_games) || 0,
      win_percentage: parseFloat(row.win_percentage) || 0
    }));
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Initialize database if needed
async function initializeDatabase() {
  try {
    // Check if tables exist
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users';
    `);
    
    if (result.rows.length === 0) {
      console.log('🔄 Initializing database schema...');
      const fs = require('fs');
      const path = require('path');
      // Try multiple possible paths for the schema file
      const possiblePaths = [
        path.join(__dirname, '../database/enhanced_schema.sql'),
        path.join(__dirname, '../../database/enhanced_schema.sql'),
        path.join(process.cwd(), 'database/enhanced_schema.sql')
      ];
      
      let schemaPath = null;
      for (const tryPath of possiblePaths) {
        if (fs.existsSync(tryPath)) {
          schemaPath = tryPath;
          break;
        }
      }
      
      if (schemaPath && fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schema);
        console.log('✅ Database schema initialized');
        
        // Insert sample games
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
      } else {
        console.log('⚠️  Schema file not found, skipping database initialization');
        console.log('Searched paths:', possiblePaths);
      }
    } else {
      console.log('✅ Database already initialized');
    }
  } catch (error) {
    console.error('⚠️  Database initialization warning:', error.message);
    // Don't exit - let the app start anyway
  }
}

// Railway standard HTTP deployment port configuration
const PORT = process.env.PORT || 3001;
console.log('🔧 Port configuration:', {
  'Railway PORT': process.env.PORT,
  'App will listen on': PORT,
  'Deployment type': 'Standard HTTP'
});
console.log('🔍 Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DETECTED_PORT: PORT,
  DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
  FRONTEND_URL: process.env.FRONTEND_URL || 'NOT SET'
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 NFL Picks API running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/api/health`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔧 Development mode - CORS enabled for ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
  }
  
  // Initialize database after server starts (non-blocking)
  initializeDatabase().catch(err => {
    console.error('⚠️  Database initialization failed but server continues:', err.message);
  });
});