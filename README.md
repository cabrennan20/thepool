# NFL Picks Tracker

A modern web app to track NFL picks with AI features, built for my dad's league.

## Tech Stack
- Frontend: Next.js, Tailwind CSS
- Backend: Express.js, PostgreSQL
- AI Assistant: OpenAI (via Vercel AI SDK)
- Hosting: Vercel (frontend) + Railway (backend & DB)

## Getting Started

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Add your DATABASE_URL

npm install
npm start
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Database

Use Supabase/Neon/Railway and run `schema.sql`.

## Deployment
- Frontend: [Vercel](https://vercel.com/)
- Backend: [Railway](https://railway.app/) or [Render](https://render.com/)
- GitHub Actions CI/CD is included in `.github/workflows/deploy.yml`
