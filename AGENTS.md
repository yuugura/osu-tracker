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

## Product Direction

- The core workflow is automatic recent-play importing into a rolling 24-hour session.
- Session pages should prioritize useful play review: stats, ranks, failed plays, score links, and search.
- Dashboard pages should prioritize trends and finding sessions by play metadata.
