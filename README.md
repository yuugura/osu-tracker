# osu! Session Tracker

A Next.js app for importing recent osu! plays into rolling 24-hour sessions, then reviewing performance with session stats, searchable play history, community highlights, and optional AI summaries.

## Features

- Sign in with osu! OAuth.
- Import recent plays manually, on dashboard load, or through Vercel Cron.
- Group imported scores into rolling 24-hour sessions.
- Review each session with play stats, rank breakdowns, failed plays, score links, and search.
- Browse personal dashboard highlights, trends, and session history.
- View public community highlights based on app-imported data.
- Generate best-effort Gemini session summaries after imports.
- Toggle AI summaries per user from settings.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- MongoDB Atlas
- Mongoose
- osu! API v2 OAuth
- Gemini API for optional AI summaries

## Getting Started

Install dependencies:

```bash
npm install
```

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in the required values in `.env.local`:

```text
MONGODB_URI=
OSU_CLIENT_ID=
OSU_CLIENT_SECRET=
OSU_REDIRECT_URI=http://localhost:3000/api/auth/osu/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=
GEMINI_API_KEY=
GEMINI_SUMMARY_MODEL=gemini-2.5-flash
CRON_SECRET=
```

For local osu! OAuth development, register this callback URL in your osu! OAuth app:

```text
http://localhost:3000/api/auth/osu/callback
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Project Structure

```text
src/
  app/
    api/            REST API routes, auth, imports, and cron
    community/      public community highlights
    dashboard/      authenticated personal dashboard
    settings/       authenticated user settings
    sessions/[id]/  authenticated session detail pages
  components/       shared UI components
  lib/              server helpers and import logic
  models/           Mongoose models
  types/            shared TypeScript types
```

## Deployment

The app is designed to deploy on Vercel with MongoDB Atlas.

Set production environment variables in Vercel, including:

```text
OSU_REDIRECT_URI=https://your-app.vercel.app/api/auth/osu/callback
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
MONGODB_URI=
OSU_CLIENT_ID=
OSU_CLIENT_SECRET=
SESSION_SECRET=
CRON_SECRET=
GEMINI_API_KEY=
GEMINI_SUMMARY_MODEL=gemini-2.5-flash
```

Use your stable production domain for the osu! OAuth callback. Avoid one-off deployment preview URLs for production OAuth.

Vercel Cron is configured in `vercel.json` to call:

```text
GET /api/cron/import-recent
```

The cron endpoint is protected by `CRON_SECRET`, so set that variable before enabling scheduled imports.

MongoDB Atlas must allow Vercel serverless connections. If you do not have fixed outbound IPs, configure Atlas Network Access accordingly and use a strong database password.

## Notes

- `.env.local` contains secrets and should never be committed.
- `.env.example` documents variable names only.
- Community rankings are based on this app's imported data, not global osu! rankings.
- AI summaries are best-effort; imports still succeed if Gemini is unavailable or unconfigured.
- More detailed project context lives in `PROJECT_SUMMARY.md`.
- The previous detailed README has been preserved as `PROJECT_INSTRUCTIONS.md`.
