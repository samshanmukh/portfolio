# Portfolio

A clean, fast personal portfolio built from scratch with **Next.js (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

## How it works

A chat-first "AI-native" portfolio (UI/UX modeled on [ai-native-portfolio](https://github.com/samshanmukh/ai-native-portfolio)):

- **Landing (`/`)** — memoji, "Ask me anything" input, and quick questions (Me, Projects, Skills, Fun, Contact)
- **Chat (`/chat?query=…`)** — the portfolio agent answers in first person and renders a rich card for each topic
  (intro, projects carousel, skills, experience, education, testimonials, live GitHub activity, gym + AI trainer demo,
  résumé, contact, writing). Optional ⚡ smart mode runs a small LLM in the browser via WebLLM.
- **Blog (`/blog`)** — markdown posts from `content/blog`
- **Liquid cursor** — a WebGL fluid trail follows the cursor (or finger) on the landing page; off for reduced motion
- **Spotify now playing** — a spinning album cover in the corner shows what Sam is listening to (needs env vars, below)
- Light / dark theme toggle (light by default)

## Getting started

```bash
pnpm install   # or: npm install
pnpm dev       # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Customize

| What | Where |
| --- | --- |
| All content (bio, projects, experience, skills, socials…) | `app/lib/data.ts` |
| Agent answers + which card each question shows | `app/lib/agent.ts` |
| Quick questions + drawer | `app/lib/questions.ts` |
| Answer cards | `app/components/views/` |
| Blog posts | `content/blog/*.md` |
| Colors / theme | `app/globals.css` |
| Avatar | `public/avatar-smile.png` |
| Page metadata | `app/layout.tsx` |

## Deploy

Deploy on [Vercel](https://vercel.com/new) — zero config for Next.js.

### GitHub stats (recommended)

The Projects answer shows live commits, releases, languages and last push for each repo (cached hourly), and
features whichever repo was pushed most recently as "Currently building". Set `GITHUB_TOKEN` in Vercel (a
fine-grained token with read-only access to public repositories) so GitHub's anonymous 60-requests/hour limit
isn't hit; without it the cards fall back to the static list in `app/lib/data.ts`.

### Booking meetings from the chat (optional)

When a visitor wants to meet, the chat shows a booking card: video, phone or in person, a free slot from Sam's calendar
(in the visitor's time zone), name and email, and a place or number when needed. Confirming books it onto Sam's
Google Calendar with a note on what the visitor asked in the chat, and Google sends them the invite (with a Meet link
for video). It runs through a small Google Apps Script under Sam's own account, so no Google Cloud project is needed.

1. Follow the setup steps at the top of `scripts/booking-calendar.gs` (paste it into script.google.com, add the
   Google Calendar service, set `SECRET`, deploy as a web app). Hours, slot length and time zone are set there too.
2. Set `BOOKING_SCRIPT_URL` (the web app URL) and `BOOKING_SECRET` (the same string as `SECRET`) in Vercel and
   `.env.local`, then redeploy. Without them the card offers email instead.

### Now-playing widget (optional)

A pill beside the theme button shows what Sam is playing (music, a game, a show), only while something plays. It stays hidden
until one of these sources is set in Vercel (also `.env.local` for dev).

**Discord via Lanyard (free, checked first):** `DISCORD_USER_ID`. Join [Lanyard's Discord server](https://discord.gg/lanyard),
then copy your user ID (Discord Settings > Advanced > Developer Mode, right-click your name > Copy User ID). The card
then shows games, shows and Spotify as Discord sees them, while Discord is open on one of your devices.

**Last.fm (free, used when set):** `LASTFM_API_KEY`, `LASTFM_USERNAME`.

1. Make a free account at [last.fm](https://www.last.fm) and connect Spotify under Settings > Applications.
   For YouTube Music, add a scrobbler browser extension such as Web Scrobbler.
2. Create an API key at [last.fm/api/account/create](https://www.last.fm/api/account/create).

**Spotify (needs Spotify Premium on the app owner's account since March 2026):**
`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`.

1. Create an app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) and add
   `http://127.0.0.1:3000/callback` as a Redirect URI.
2. Run `node scripts/get-spotify-token.mjs`, paste the client ID and secret, approve in the browser, and paste
   the `code` from the URL you land on. It prints the refresh token.
