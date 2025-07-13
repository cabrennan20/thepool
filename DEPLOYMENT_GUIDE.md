# NFL Picks Tracker - Production Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Backend Deployment (Railway)

**Option A: Railway CLI (Recommended)**
```bash
# Install Railway CLI (already done)
npm install -g @railway/cli

# Navigate to backend directory
cd backend

# Login to Railway (requires browser)
railway login

# Initialize and deploy
railway init
railway up
```

**Option B: Railway Web Interface**
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub account
3. Click "New Project" → "Deploy from GitHub repo"
4. Select this repository
5. Choose "backend" as the root directory
6. Railway will auto-detect the Node.js app

**Environment Variables for Railway:**
```
DATABASE_URL=postgresql://postgres:HwKlzm@G!41AsZ^E@db.kovvuunskzaplmonxvld.supabase.co:5432/postgres
JWT_SECRET=nfl-picks-production-jwt-secret-key-2025-highly-secure-random-string
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://nfl-picks-tracker.vercel.app
ODDS_API_KEY=79e5cc79e3e53c495cc5e8b237bef599
```

### 2. Frontend Deployment (Vercel)

**Option A: Vercel CLI**
```bash
# Navigate to frontend directory
cd frontend

# Login to Vercel (requires browser)
npx vercel login

# Deploy to production
npx vercel --prod
```

**Option B: Vercel Web Interface**
1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub account
3. Click "New Project" → Import from Git
4. Select this repository
5. Set "Root Directory" to `frontend`
6. Click "Deploy"

**Environment Variables for Vercel:**
```
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app/api
NODE_ENV=production
ODDS_API_KEY=79e5cc79e3e53c495cc5e8b237bef599
```

### 3. Update CORS Configuration

After deployment, update the backend's `FRONTEND_URL` environment variable with your actual Vercel URL.

## 📋 Production Checklist

- [x] Database: Supabase PostgreSQL configured
- [x] Backend: Production-ready with security middleware
- [x] Frontend: Next.js build configuration ready
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel
- [ ] Configure environment variables
- [ ] Test production endpoints
- [ ] Update CORS settings

## 🔗 Expected Production URLs

- **Frontend**: `https://nfl-picks-tracker.vercel.app`
- **Backend API**: `https://your-app-name.railway.app/api`
- **Health Check**: `https://your-app-name.railway.app/api/health`

## 🧪 Testing Production

1. Visit frontend URL
2. Test user registration/login
3. Verify API connectivity with browser dev tools
4. Test pick submission functionality
5. Check database connections

## 🔧 Troubleshooting

**Common Issues:**
- **CORS errors**: Update `FRONTEND_URL` in Railway
- **Database connection**: Verify `DATABASE_URL` format
- **API not found**: Check `NEXT_PUBLIC_API_URL` in Vercel

**Verification Commands:**
```bash
# Test backend health
curl https://your-app.railway.app/api/health

# Test frontend build locally
cd frontend && npm run build
```

## 📞 Support

If you encounter issues:
1. Check Vercel/Railway deployment logs
2. Verify all environment variables are set
3. Test database connection via health endpoint