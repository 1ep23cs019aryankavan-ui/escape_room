# Hackovers Escape Room Webapp

This is a full 4-level technical escape room built with Next.js for online college events.

## Features

- 4 levels with progressive unlocking
- 2h 30m countdown timer
- Dynamic marquee scoreboard on top
- Negative marking for wrong answers
- Hint penalties:
  - Hint 1: -10 points and -5 minutes
  - Hint 2: -20 points and -10 minutes
  - Hint 3: -30 points and -15 minutes
- Final escape validation using all 4 level codes
- Admin panel showing completed teams, points, and completion time
- Different visual themes across levels

## Tech Stack

- Next.js 14 (App Router)
- React + TypeScript
- API route for leaderboard records

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run dev server:
   ```bash
   npm run dev
   ```
3. Open:
   - http://localhost:3000

## Deploy to Vercel (Step-by-Step)

1. Push this project to your GitHub repository:
   ```bash
   git add .
   git commit -m "Add full technical escape room webapp"
   git push origin main
   ```
2. Go to [Vercel](https://vercel.com/) and login.
3. Click **Add New...** -> **Project**.
4. Import your `escape_room` GitHub repository.
5. Keep default settings:
   - Framework preset: `Next.js`
   - Build command: `next build`
   - Output: default
6. Click **Deploy**.
7. After deployment, open the generated Vercel URL and test the game flow.

## Important Production Note

Current leaderboard storage is in-memory (runtime memory). For production multi-session persistence, connect a real database (Vercel KV / Postgres / Supabase) and replace `app/api/scoreboard/route.ts` storage logic.
