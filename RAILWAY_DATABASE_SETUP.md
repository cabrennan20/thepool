# Railway Database Setup Options

## Option 1: Fix Supabase Connection

In Railway dashboard, set these environment variables:

```
DATABASE_URL=postgresql://postgres:HwKlzm@G!41AsZ^E@db.kovvuunskzaplmonxvld.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=nfl-picks-production-jwt-secret-key-2025-highly-secure-random-string
NODE_ENV=production
FRONTEND_URL=https://your-vercel-url.vercel.app
ODDS_API_KEY=79e5cc79e3e53c495cc5e8b237bef599
```

## Option 2: Use Railway PostgreSQL (Recommended)

1. In Railway dashboard, click "New" → "Database" → "PostgreSQL"
2. Railway will create a database and provide a `DATABASE_URL`
3. Copy the database URL and use it instead of Supabase
4. Run the setup script to create tables:

```bash
# In Railway console or locally with the new DATABASE_URL:
node backend/scripts/setup-database.js
```

## Option 3: Try IPv4-only Connection

Sometimes Railway has issues with IPv6. In your Railway Variables, try:

```
DATABASE_URL=postgresql://postgres:HwKlzm@G!41AsZ^E@kovvuunskzaplmonxvld.supabase.co:5432/postgres?sslmode=require&prefer_simple_protocol=true
```

## Current Error Analysis

The error shows Railway trying to connect to an IPv6 address:
`2600:1f16:1cd0:330a:a95f:4953:f204:d823:5432`

This suggests Railway's networking might not support IPv6 for Supabase connections.