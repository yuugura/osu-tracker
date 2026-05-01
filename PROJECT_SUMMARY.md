# Project Summary

## Current App

osu! Session Tracker is a Next.js App Router app for logging in with osu!, importing recent plays, grouping them into rolling 24-hour sessions, and reviewing session history.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- MongoDB Atlas
- Mongoose
- osu! API v2 OAuth

## Major Work Completed

### Project Setup

- Initialized the Next.js app at the repository root.
- Normalized the project to use `src/app`.
- Added MongoDB/Mongoose setup.
- Added `.env.example`.
- Replaced generic generated docs with project-specific `README.md` and `AGENTS.md`.

### Authentication

- Implemented osu! OAuth login and callback routes.
- Added signed HTTP-only app session cookies.
- Renamed the session signing env var from `JWT_SECRET` to `SESSION_SECRET`.
- Added logout support.
- Protected dashboard and session pages.

### Data Models

- Added Mongoose models for:
  - `User`
  - `Session`
  - `Play`
- Sessions store import metadata and osu! profile totals.
- Plays store score metadata including rank, accuracy, score, PP, mods, failed/passed state, beatmap length, score URL, mapper, and tags when available.

### Import Flow

- Added one-click recent-play import.
- Added automatic dashboard import throttled in the browser.
- Imports reuse the current rolling 24-hour session instead of creating a new session every click.
- Imports avoid duplicate plays through score import keys.
- Added support for failed plays via `include_fails=1`.
- Added fallback import keys for failed scores that do not expose normal score IDs.

### Dashboard

- Added session list.
- Added delete session button.
- Added selectable trend chart for:
  - play count
  - playtime
  - score
  - PP
  - accuracy
  - passed count
  - failed count
- Added dashboard search that filters sessions by contained play metadata.

### Session Detail

- Added session stats:
  - play count
  - passed/failed
  - average accuracy
  - total score
  - PP
  - session span
  - play time
  - SS/S/A summary
  - rank breakdown
- Displayed rank labels as osu!-style labels:
  - `XH` -> `SS+`
  - `X` -> `SS`
  - `SH` -> `S+`
- Added imported play list.
- Added failed play badges.
- Added score-page links and explicit `View score` buttons when osu! exposes a usable score URL.
- Added play search inside a session.
- Added opt-in AI session summaries using the Gemini API.
- AI summaries are generated from imported play metadata and session stats, then stored on the `Session` document.
- Gemini summary generation disables thinking with `thinkingBudget: 0` to avoid very short truncated summaries on simple recap prompts.

## Important Decisions

- No NextAuth, Firebase, Prisma, or Supabase.
- osu! OAuth is the only login provider.
- The app uses its own signed app session cookie after osu! OAuth succeeds.
- Sessions are rolling 24-hour buckets because osu!'s recent scores view is also recent-window oriented.
- Automatic importing currently happens when the dashboard is opened, not from a deployed background job.
- True always-on importing will need deployed scheduled jobs and refresh-token handling.
- AI summaries are user-triggered from session pages rather than generated automatically.
- Gemini is the current AI provider because it has a practical free tier for small development usage.

## Environment Variables

Required in `.env.local`:

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

## Known Caveats

- Failed score links only work when osu! exposes a usable score ID.
- Mapper and tags only appear when osu! includes those fields in imported score payloads.
- Existing old plays may be missing newer fields until they are re-imported or migrated.
- PP session totals are summed from imported scores when available; osu! profile PP is weighted, so this is not an exact net profile PP gain.
- Browser-throttled auto import is not a replacement for scheduled server-side importing.
- AI summaries require a Gemini API key and only run when generated from a session page.
- Gemini free-tier requests may be used by Google to improve products; keep summary prompts limited to non-secret play/session metadata.
- Previously generated short or partial summaries may need to be refreshed from the session page.

## Good Next Steps

- Add token refresh so imports keep working after access tokens expire.
- Add a deployed scheduled import path, such as Vercel Cron.
- Add richer filters for plays and sessions.
- Add chart options for cumulative vs per-session stats.
- Improve handling and linking of failed plays if osu! exposes more reliable identifiers.
- Add deterministic fallback summaries for local/offline development without a Gemini key.
- Add tests around AI summary prompt shaping and truncated-response handling.
- Add tests for import mapping and session stat calculations.
