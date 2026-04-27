# osu! Session Tracker

A web app for tracking osu! play sessions and saving them as a personal history/log that you can revisit over time.

The app uses osu! authentication to identify users and pulls play data from the osu! API, allowing you to organize your plays into sessions and analyze your progress.

---

## Core Idea

Log in with your osu! account, create sessions, import your recent plays, and store them as a structured log.

Each session represents a snapshot of what you played during a specific time period.

---

## Planned Features

- osu! OAuth login
- Fetch recent plays from the osu! API
- Create and manage session sets
- Import plays into sessions
- View past sessions
- Inspect individual plays
- Basic stats per session:
  - total plays
  - average accuracy
  - best score
  - ranks achieved
  - most played maps

---

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- MongoDB Atlas
- Mongoose
- osu! API v2
- Vercel

---

## Data Model
```ts
type User = {
  osuUserId: string;
  username: string;
  avatarUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
};

type Session = {
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type Play = {
  userId: string;
  sessionId: string;
  osuScoreId?: string;
  beatmapId?: string;
  title: string;
  artist?: string;
  difficulty?: string;
  score?: number;
  accuracy?: number;
  rank?: string;
  mods?: string[];
  playedAt?: Date;
};
```

## Project Structure
src/
  app/
    api/
      auth/
        osu/
          login/
          callback/
      sessions/
      sessions/[id]/
      sessions/[id]/plays/
    dashboard/
    sessions/
    sessions/[id]/

  components/
  lib/
    mongodb.ts
    osuAuth.ts
    osuApi.ts

  models/
    User.ts
    Session.ts
    Play.ts

  types/

## Environment Variables
Create a .env.local file: 
MONGODB_URI=
OSU_CLIENT_ID=
OSU_CLIENT_SECRET=
OSU_REDIRECT_URI=http://localhost:3000/api/auth/osu/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=

For production (Vercel):
OSU_REDIRECT_URI=https://your-app.vercel.app/api/auth/osu/callback
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

## Development
npm install
npm run dev

Open:
http://localhost:3000

Build:
npm run build

## Roadmap
### Phase 1: Setup
- Initialize Next.js project
- Add Tailwind CSS
- Connect MongoDB Atlas
- Define Mongoose models
### Phase 2: Authentication
- Implement osu! OAuth
- Store user data
- Set up session handling (cookies/JWT)
### Phase 3: Sessions
- Create sessions
- List sessions
- View session details
- Delete sessions
### Phase 4: Plays
- Fetch recent plays from osu! API
- Import plays into sessions
- View plays within a session
- Delete plays
### Phase 5: Stats
- Session summaries
- Basic analytics (avg accuracy, best scores, etc.)
- Filtering and search
- Charts (later)

