# osu! Session Tracker

A Next.js app for tracking osu! play sessions. Log in with osu!, import recent plays, and review session history with play lists, stats, search, and trend charts.

## Features

- osu! OAuth login
- MongoDB-backed user/session/play storage
- Automatic recent-play imports on dashboard load
- Manual import button for the current 24-hour session
- Failed play import support when osu! returns failed scores
- Session detail pages with:
  - imported plays
  - rank, accuracy, score, PP, and score-page links
  - session summary stats
  - opt-in Gemini AI session summaries
  - rank breakdown
  - searchable play list
- Dashboard with:
  - session search across contained plays
  - selectable trend line chart for play count, playtime, score, PP, accuracy, passed, and failed counts
  - delete session action

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- MongoDB Atlas
- Mongoose
- osu! API v2 OAuth

## Project Structure

```text
src/
  app/
    api/
      auth/
      sessions/
    dashboard/
    sessions/[id]/
  components/
  lib/
  models/
  types/
```

## AI Session Summaries

Session pages include an opt-in **AI session summary** panel. Clicking
`Generate summary` calls:

```text
POST /api/sessions/[id]/ai-summary
```

The route verifies the logged-in user owns the session, loads imported plays,
generates a concise review with Gemini, and stores the result on the session as:

```text
aiSummary.text
aiSummary.model
aiSummary.generatedAt
```

The prompt is built from imported play metadata and aggregate stats only. It
does not send osu! OAuth tokens, app session cookies, MongoDB credentials, or
other secrets. The Gemini request sets `thinkingBudget: 0` because this is a
short summarization task; without that, Gemini 2.5 Flash can spend the small
token budget on hidden reasoning and return a truncated visible summary.

## Environment Variables

Create `.env.local` in the project root.

```text
MONGODB_URI=
OSU_CLIENT_ID=
OSU_CLIENT_SECRET=
OSU_REDIRECT_URI=http://localhost:3000/api/auth/osu/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=
GEMINI_API_KEY=
GEMINI_SUMMARY_MODEL=gemini-2.5-flash
```

For the osu! OAuth application, use this local callback URL:

```text
http://localhost:3000/api/auth/osu/callback
```

For production, update these values:

```text
OSU_REDIRECT_URI=https://your-app.vercel.app/api/auth/osu/callback
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Validate:

```bash
npm run lint
npm run build
```

## Notes

- `.env.local` contains secrets and must not be committed.
- `.env.example` documents required variables only.
- The app stores osu! access and refresh tokens in MongoDB for the logged-in user.
- AI session summaries use the Gemini API and require `GEMINI_API_KEY`.
- `GEMINI_SUMMARY_MODEL` defaults to `gemini-2.5-flash` when omitted.
- Current automation imports when the dashboard is opened and throttles imports in the browser. Always-on background importing would require a deployed scheduled job and token refresh handling.

## Roadmap

- Improve score-page links for failed plays where osu! exposes a reliable URL
- Add richer filters for session plays
- Add charts for more session stats
- Add token refresh for long-lived imports
- Add Vercel Cron or another scheduled importer after deployment
