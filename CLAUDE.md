# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend Development
```bash
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Backend Development
```bash
cd backend
npm run dev          # Start Express server with nodemon (port 3001)
npm run start        # Production start
npm run setup-db     # Initialize local database
npm run init-railway-db  # Initialize Railway production database
```

### Database Management
```bash
cd backend
node scripts/init-railway-db.js     # Setup production database
node scripts/create-admin.js        # Create admin user
node scripts/create-mock-picks.js   # Generate test data
```

## Architecture Overview

### Dual Frontend Structure
This project has an **unusual dual frontend setup** for deployment flexibility:
- **Root level**: Complete Next.js frontend configured for Vercel deployment
- **/frontend/**: Identical Next.js frontend (subdirectory copy for alternative deployment)
- When making frontend changes, you typically need to update both locations or use the root level as primary

### Backend API Architecture
Express.js API server in `/backend/` with modular route structure:
- **Authentication**: JWT-based with bcrypt password hashing
- **Database**: PostgreSQL with manual schema management
- **Routes**: Organized by feature (auth, games, picks, scores, admin, recap)
- **Services**: Email and notification services for admin functions

### Database Schema
PostgreSQL with these core tables:
- `users` - Authentication, profiles, admin flags, contact information
- `games` - NFL game data, spreads, scores, game status
- `picks` - User team selections with tiebreakers
- `weekly_scores` - Calculated performance metrics
- `admin_messages` - System notifications

Schema files in `/database/` with migration scripts for updates.

### Key Business Logic
1. **Pick Deadlines**: Automatically enforced when games start
2. **Tiebreakers**: Final game of week used for total points prediction
3. **Anonymity**: User aliases required for league privacy
4. **Transparency**: All picks visible after deadline in Excel-style recap
5. **Scoring**: Real-time calculations with weekly and season leaderboards

## Deployment Configuration

### Production Environment
- **Backend**: Railway.app with PostgreSQL database
- **Frontend**: Vercel with automatic GitHub deployments
- **API Base URL**: `https://thepool-production.up.railway.app/api`

### Environment Variables
**Backend Required**:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Token signing key
- `FRONTEND_URL` - CORS configuration

**Frontend Required**:
- `NEXT_PUBLIC_API_URL` - Backend API endpoint

### Deployment Notes
- Railway deploys automatically from backend changes
- Vercel configured to build from root level with `vercel.json.backup` settings
- Both environments require environment variables to be set in their respective dashboards

## Development Workflow

### Starting Development
1. Backend: `cd backend && npm run dev` (starts API on port 3001)
2. Frontend: `npm run dev` (starts Next.js on port 3000)
3. Database: Ensure PostgreSQL is running or use Railway connection

### Making Changes
- **Frontend**: Update root level files (Vercel deployment source)
- **Backend**: All changes in `/backend/` directory
- **Database**: Create migration scripts in `/database/` for schema changes
- **Always test both development and production builds before deployment**

### Automatic Git Workflow
**IMPORTANT**: After completing any task or set of changes, ALWAYS commit and push to the remote repository immediately:

1. **After completing changes**: Run `git status` and `git diff` to review changes
2. **Stage relevant files**: Add all modified files with `git add .` or selectively stage files
3. **Create descriptive commit**: Use format "Brief description of changes" with standard footer
4. **Push to remote**: Always push to remote repository unless explicitly told not to
5. **Verify deployment**: Check that both Railway (backend) and Vercel (frontend) deployments succeed

This ensures all work is immediately saved and deployed to production.

### Database Changes
1. Create new migration file in `/database/`
2. Test migration locally with `npm run setup-db`
3. Apply to production with `npm run init-railway-db`
4. Update TypeScript interfaces to match schema changes

## API Integration

### External APIs
- **The Odds API**: Live NFL game odds (requires API key)
- **TheSportsDB**: Team logos and NFL data
- Fallback to mock data when APIs unavailable

### Internal API Structure
- All routes use `/api/` prefix
- JWT authentication required for most endpoints
- Zod validation on all inputs
- Rate limiting: 100 requests per 15 minutes per IP
- Comprehensive error handling with proper HTTP status codes

## Special Considerations

### Security Implementation
- JWT tokens with 7-day expiration
- bcrypt password hashing with 12 salt rounds
- CORS restricted to allowed origins
- Helmet security headers
- Input validation with Zod schemas

### Data Privacy
- User contact information visible to admins only
- Aliases used throughout public-facing features
- Pick visibility controlled by game start times

### Performance Optimizations
- Database indexes on frequently queried fields
- Next.js production builds ~86kB
- Optimized queries for leaderboard calculations
- Health check endpoint for monitoring