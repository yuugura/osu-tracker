# osu! Session Tracker

A Next.js app for tracking osu! play sessions. Log in with osu!, import recent plays, and review session history with play lists, stats, search, and trend charts.

## Features

- osu! OAuth login
- Public Community highlights page for visitors without an osu! login
- MongoDB-backed user/session/play storage
- Automatic recent-play imports on dashboard load
- Manual import button for the current 24-hour session
- Failed play import support when osu! returns failed scores
- Session detail pages with:
  - imported plays
  - rank, accuracy, score, PP, and score-page links
  - session summary stats
  - Gemini AI session summaries generated after imports
  - rank breakdown
  - searchable play list
- Dashboard with:
  - shared app shell navigation with Community and logout controls
  - last import status panel
  - personal highlights for play count, top PP plays, best accuracy plays, and maps to retry across 24h, 7d, and all imported plays
  - session search across contained plays
  - selectable trend line chart for play count, playtime, score, PP, accuracy, passed, and failed counts
  - delete session action
- Public Community page with trending maps and app-user leaderboards for play volume and top imported PP plays
- Dashboard, Community, and Session detail pages share one authenticated app shell/navigation
- Dark mode UI across the landing page and authenticated app pages
- Settings page with a per-user toggle for AI-generated session summaries

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
    community/
    dashboard/
    settings/
    sessions/[id]/
  components/
    AppShell.tsx
  lib/
  models/
  types/
```

## AI Session Summaries

Session pages include a read-only **AI session summary** panel. Summaries are
generated automatically after each successful recent-play import, including the
dashboard auto import and the manual `Import now` action.

```text
POST /api/sessions/import-recent
```

The import route saves any new plays, loads the full current session, generates
a concise review with Gemini, and stores the result on the session as:

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

AI summary generation is best-effort: if Gemini is unavailable or
`GEMINI_API_KEY` is not configured, the play import still succeeds and the
session keeps its previous summary, if any.

Logged-in users can disable future AI summary generation from `/settings`.
Manual, dashboard-auto, and scheduled imports all respect the per-user setting.

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
CRON_SECRET=
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

## Scheduled Imports

Vercel Cron is configured in `vercel.json` to call:

```text
GET /api/cron/import-recent
```

The route uses `CRON_SECRET` for authorization. Set `CRON_SECRET` in Vercel
project environment variables before enabling the cron job. The route imports
recent plays for all stored users, refreshes osu! tokens when needed, records an
`ImportRun`, and generates session summaries best-effort.

## Vercel Deployment Notes

- Use the stable Vercel production domain for OAuth, not a one-off deployment URL.
- In the osu! OAuth app, keep the local callback and add the production callback:

```text
http://localhost:3000/api/auth/osu/callback
https://your-app.vercel.app/api/auth/osu/callback
```

- In Vercel production environment variables, set:

```text
OSU_REDIRECT_URI=https://your-app.vercel.app/api/auth/osu/callback
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

- MongoDB Atlas must allow Vercel serverless functions to connect. If you do
  not have fixed outbound IPs, add `0.0.0.0/0` in Atlas Network Access and use a
  strong database user password.
- Check production errors in Vercel under Project -> Logs or Deployment ->
  Runtime Logs.

## Notes

- `.env.local` contains secrets and must not be committed.
- `.env.example` documents required variables only.
- The app stores osu! access and refresh tokens in MongoDB for the logged-in user.
- AI session summaries use the Gemini API and require `GEMINI_API_KEY`.
- `GEMINI_SUMMARY_MODEL` defaults to `gemini-2.5-flash` when omitted.
- Community leaderboards rank users from imported app data only, not all osu! players globally.
- Community highlights are public; logged-out community navigation sends personal-dashboard intent straight to osu! login.
- Current automation imports when the dashboard is opened and throttles imports in the browser.
- Vercel Cron handles production automatic importing through `/api/cron/import-recent`.
- The protected automatic import endpoint refreshes osu! tokens before importing when needed.
- Import runs are recorded in MongoDB for manual, dashboard-auto, and scheduler imports.
- Authenticated app pages use `src/components/AppShell.tsx` for shared navigation, page headers, and logout.
- The UI currently defaults to dark mode with zinc surfaces and pink accents.
- Users can turn AI session summaries on or off from `/settings`; the setting defaults to enabled.

## Roadmap

- Improve score-page links for failed plays where osu! exposes a reliable URL
- Add richer filters for session plays
- Add charts for more session stats
- Polish Vercel deployment and production environment defaults
