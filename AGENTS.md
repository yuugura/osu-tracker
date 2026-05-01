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
- Keep `.env.local` private and use `.env.example` for variable names only.
- Prefer simple REST API routes under `src/app/api`.
- Explain changed files after each task.
- Run `npm run lint` and `npm run build` after code changes when practical.

## Project Notes

- This project uses `src/app`, not root `app`.
- Next.js version is new enough that local docs in `node_modules/next/dist/docs/` should be checked when touching framework-specific APIs.
- Auth uses osu! OAuth, then a signed HTTP-only app session cookie using `SESSION_SECRET`.
- MongoDB models live in `src/models`.
- Shared server helpers live in `src/lib`.
- UI components live in `src/components`.
- AI session summary generation lives in `src/lib/aiSessionSummary.ts` and is exposed through `src/app/api/sessions/[id]/ai-summary/route.ts`.
- Gemini summaries use `GEMINI_API_KEY` and `GEMINI_SUMMARY_MODEL`; keep generation opt-in and do not send tokens, cookies, or secrets to the model.
- For Gemini 2.5 Flash summaries, keep `thinkingBudget: 0` unless there is a clear need for reasoning, otherwise short responses can be truncated by hidden thinking tokens.

## Product Direction

- The core workflow is automatic recent-play importing into a rolling 24-hour session.
- Session pages should prioritize useful play review: stats, ranks, failed plays, score links, AI summaries, and search.
- Dashboard pages should prioritize trends and finding sessions by play metadata.
