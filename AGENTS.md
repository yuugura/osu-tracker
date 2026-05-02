# Codex Instructions

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- MongoDB Atlas
- Mongoose
- osu! OAuth only

## Rules

- Make small, reviewable changes.
- Do not add Firebase, Prisma, Supabase, or NextAuth.
- Do not commit secrets.
- Use environment variables for osu! and MongoDB credentials.
- Use environment variables for AI provider credentials.
- Use `CRON_SECRET` to protect automatic import endpoints.
- Keep `.env.local` private and use `.env.example` for variable names only.
- Prefer simple REST API routes under `src/app/api`.
- Explain changed files after each task.
- Run `npm run lint` and `npm run build` after code changes when practical.

## Project Notes

- This project uses `src/app`, not root `app`.
- Next.js version is new enough that local docs in `node_modules/next/dist/docs/` should be checked when touching framework-specific APIs.
- Auth uses osu! OAuth, then a signed HTTP-only app session cookie using `SESSION_SECRET`.
- Community highlights are public; Dashboard and Session detail pages require osu! login.
- MongoDB models live in `src/models`.
- Shared server helpers live in `src/lib`.
- UI components live in `src/components`.
- Authenticated Dashboard, Community, and Session pages share `src/components/AppShell.tsx` for navigation, page headers, and logout.
- The UI currently defaults to dark mode with zinc surfaces and pink accents.
- User settings live on the `User` model; `aiSummariesEnabled` defaults to true and controls future AI summary generation in shared import logic.
- AI session summary generation lives in `src/lib/aiSessionSummary.ts` and runs automatically from `src/app/api/sessions/import-recent/route.ts` after imports.
- Shared import logic lives in `src/lib/recentImport.ts`; manual and automatic imports should use it.
- Vercel Cron calls `src/app/api/cron/import-recent/route.ts`; keep it protected by `CRON_SECRET`.
- Vercel production OAuth should use the stable production domain in `NEXT_PUBLIC_APP_URL`, `OSU_REDIRECT_URI`, and the osu! OAuth callback.
- MongoDB Atlas Network Access must allow Vercel serverless connections.
- Gemini summaries use `GEMINI_API_KEY` and `GEMINI_SUMMARY_MODEL`; do not send tokens, cookies, or secrets to the model.
- AI summary generation should be best-effort: imports must still succeed if Gemini is unavailable or unconfigured.
- For Gemini 2.5 Flash summaries, keep `thinkingBudget: 0` unless there is a clear need for reasoning, otherwise short responses can be truncated by hidden thinking tokens.

## Product Direction

- The core workflow is automatic recent-play importing into a rolling 24-hour session.
- Session pages should prioritize useful play review: stats, ranks, failed plays, score links, AI summaries, and search.
- Dashboard pages should prioritize personal highlights, trends, and finding sessions by play metadata.
- Community pages should clearly label leaderboards as app-user/imported-data rankings rather than global osu! rankings.
- Public community access should not expose osu! tokens, session cookies, or private per-user controls.
- Logged-out community navigation should send login/personal dashboard intent directly to `/api/auth/osu/login`, not through the landing page.
