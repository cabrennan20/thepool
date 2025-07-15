# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an NFL picks tracking web application with a full-stack architecture:
- **Frontend**: Next.js 14 with TypeScript, React 18, and Tailwind CSS v4
- **Backend**: Node.js/Express API with PostgreSQL database
- **Data Sources**: The Odds API for live NFL odds, TheSportsDB for team logos
- **Deployment**: Frontend on Vercel, Backend on Railway

## Development Commands

### Frontend (Next.js)
```bash
cd frontend
npm run dev     # Start development server on http://localhost:3000
npm run build   # Build for production
npm run start   # Start production server
```

### Backend (Express)
```bash
cd backend
npm run dev     # Start development server with nodemon
npm start       # Start production server
npm run setup-db         # Initialize database schema
npm run init-railway-db  # Initialize Railway PostgreSQL database
```

### Root Level Commands
```bash
npm run dev     # Start frontend development server
npm run build   # Build frontend for production
npm start       # Start frontend production server
```

## Architecture

### Dual Project Structure
The repository contains both a monolithic structure in the root and separate `frontend/` and `backend/` directories. The active development happens in the separate directories:
- `frontend/` - Next.js application
- `backend/` - Express.js API server

### Key Components
- **Authentication**: JWT-based auth with React context (`frontend/contexts/AuthContext.tsx`)
- **API Integration**: Odds API client (`frontend/lib/oddsApi.ts`) and TheSportsDB client (`frontend/lib/theSportsDbApi.ts`)
- **Database**: PostgreSQL with schema in `database/schema.sql`
- **Picks System**: Confidence-based weekly NFL picks interface

### Important Files
- `frontend/pages/_app.tsx` - Next.js app wrapper with global providers
- `backend/index.js` - Express server entry point
- `backend/routes/` - API route handlers (auth, picks, games, etc.)
- `frontend/components/` - React components (Dashboard, LoginForm, Header)

## Environment Variables

### Frontend
- `ODDS_API_KEY` - Required for The Odds API integration

### Backend
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT token signing secret
- `PORT` - Server port (default: 3001)

## Database

PostgreSQL database with schema defined in `database/schema.sql`. Key tables:
- `users` - User authentication and profiles
- `games` - NFL game data with odds
- `picks` - User picks with confidence ratings
- `admin_messages` - System notifications

Use `npm run setup-db` (backend) to initialize the schema.

## Testing

The project uses Playwright for end-to-end testing (`@playwright/test` in frontend dependencies).

## Deployment

- **Frontend**: Deploys to Vercel automatically from Git
- **Backend**: Deploys to Railway with PostgreSQL database
- Configuration files: `vercel.json.backup`, `railway.json`, `railway.toml`