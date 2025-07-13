#!/bin/bash

# NFL Picks Tracker Deployment Script

echo "🚀 NFL Picks Tracker Deployment Script"
echo "======================================"

# Check if required tools are installed
command -v railway >/dev/null 2>&1 || { echo "❌ Railway CLI not found. Install with: npm install -g @railway/cli"; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "❌ npx not found. Please install Node.js"; exit 1; }

echo "✅ Prerequisites check passed"

# Deploy Backend to Railway
echo ""
echo "📦 Deploying Backend to Railway..."
cd backend

if [ ! -f ".railway/project.json" ]; then
    echo "🔧 Initializing Railway project..."
    railway init
fi

echo "🚀 Deploying to Railway..."
railway up

BACKEND_URL=$(railway url)
echo "✅ Backend deployed to: $BACKEND_URL"

# Deploy Frontend to Vercel
echo ""
echo "📦 Deploying Frontend to Vercel..."
cd ../frontend

# Update environment variable with actual backend URL
echo "NEXT_PUBLIC_API_URL=${BACKEND_URL}/api" > .env.production
echo "NODE_ENV=production" >> .env.production
echo "ODDS_API_KEY=79e5cc79e3e53c495cc5e8b237bef599" >> .env.production

echo "🚀 Deploying to Vercel..."
npx vercel --prod

echo ""
echo "🎉 Deployment Complete!"
echo "========================"
echo "Frontend: Check Vercel dashboard for URL"
echo "Backend: $BACKEND_URL"
echo "Health Check: ${BACKEND_URL}/api/health"
echo ""
echo "⚠️  Remember to update Railway environment variables:"
echo "   FRONTEND_URL with your Vercel URL"