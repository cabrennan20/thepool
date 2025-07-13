# NFL Picks Tracker

A modern web application for tracking NFL weekly picks with authentication, team logos, and live odds integration.

## Features

- 🏈 **Live NFL Data**: Real-time game odds from The Odds API
- 🎨 **Team Branding**: Official NFL team logos from TheSportsDB
- 🔐 **Authentication**: Simple login/logout system
- 📊 **Picks Interface**: Confidence-based weekly picks selection
- 📱 **Responsive Design**: Tailwind CSS with mobile-first approach

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS v4
- **APIs**: The Odds API, TheSportsDB
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- The Odds API key (free at [the-odds-api.com](https://the-odds-api.com/))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/cabrennan20/thepool.git
cd thepool
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your Odds API key to `.env.local`:
```
ODDS_API_KEY=your_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel Deployment

1. Fork this repository to your GitHub account

2. Import the project in [Vercel](https://vercel.com):
   - Connect your GitHub account
   - Import the repository
   - Vercel will auto-detect Next.js

3. Configure environment variables in Vercel:
   - Go to Project Settings → Environment Variables
   - Add `ODDS_API_KEY` with your API key

4. Deploy! Vercel will automatically deploy on every push to main.

### Manual Deployment Steps

If you encounter issues, try these steps:

1. Ensure the `vercel.json` configuration is correct
2. Check that all environment variables are set
3. Verify the build works locally: `npm run build`
4. Check Vercel function logs for API errors

## API Endpoints

- `/api/odds` - Fetches live NFL game odds
- `/api/teams` - Cached NFL team data from TheSportsDB

## Project Structure

```
frontend/
├── components/          # React components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Header.tsx      # Navigation header
│   └── LoginForm.tsx   # Authentication form
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── lib/               # Utility libraries
│   ├── oddsApi.ts     # Odds API client
│   └── theSportsDbApi.ts # TheSportsDB client
├── pages/             # Next.js pages
│   ├── api/          # API routes
│   ├── index.tsx     # Home page
│   ├── picks.tsx     # Picks interface
│   └── _app.tsx      # App wrapper
└── styles/           # Global styles
    └── globals.css   # Tailwind imports
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ODDS_API_KEY` | API key from The Odds API | Yes |

## Troubleshooting

### Common Issues

**Build Errors:**
- Ensure all TypeScript errors are resolved
- Check that environment variables are set
- Verify API endpoints are accessible

**Deployment Issues:**
- Check Vercel function logs
- Ensure `vercel.json` is properly configured
- Verify environment variables in Vercel dashboard

**API Issues:**
- Verify your Odds API key is valid and has remaining requests
- Check network connectivity for external APIs
- Review API rate limits
# Deployment trigger
