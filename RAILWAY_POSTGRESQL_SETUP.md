# Railway PostgreSQL Setup Guide

## ✅ Step-by-Step Instructions

### 1. Create Railway PostgreSQL Database
1. In Railway dashboard, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway creates a new database service
3. Click on the database service → **"Connect"** tab
4. Copy the **"Postgres Connection URL"** (starts with `postgresql://`)

### 2. Update Backend Service Variables
1. Go to your backend service → **"Variables"** tab
2. Update these variables:

```
DATABASE_URL=postgresql://postgres:password@hostname:port/railway
JWT_SECRET=nfl-picks-production-jwt-secret-key-2025-highly-secure-random-string
NODE_ENV=production
FRONTEND_URL=https://your-vercel-url.vercel.app
ODDS_API_KEY=79e5cc79e3e53c495cc5e8b237bef599
```

### 3. Deploy and Initialize
1. Railway will automatically:
   - Install dependencies
   - Initialize database schema
   - Insert sample NFL games
   - Start the API server

### 4. Verify Deployment
1. Check **"Deployments"** tab for success
2. Visit your Railway URL + `/api/health` 
3. Should show: `{"status":"healthy","database":"connected"}`

## 🔧 Manual Database Setup (if needed)

If automatic initialization fails, run manually:

```bash
# In Railway console or locally with Railway DATABASE_URL:
npm run init-railway-db
```

## 📊 What Gets Created

**Database Tables:**
- `users` - User accounts and authentication
- `games` - NFL games with teams, dates, scores
- `picks` - User predictions for games  
- `weekly_scores` - Calculated weekly performance
- `leagues` - Support for multiple leagues

**Sample Data:**
- 5 sample NFL games for Week 1, 2025 season
- Ready for user registration and picks

## 🚀 After Database Setup

1. **Frontend**: Deploy to Vercel with Railway API URL
2. **Test**: Register user, make picks, verify functionality
3. **Scale**: Add real NFL schedule data when ready

## 🔍 Troubleshooting

**Connection Issues:**
- Verify `DATABASE_URL` in Railway variables
- Check database service is running
- Review deployment logs for errors

**Schema Issues:**
- Run `npm run init-railway-db` manually
- Check if tables exist in Railway database console