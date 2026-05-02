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
https://osu-tracker-khaki.vercel.app/
