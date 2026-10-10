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

### Now-playing widget (optional)

A card in the bottom-right corner shows the song Sam is playing, only while something plays. It stays hidden
until one of these sources is set in Vercel (also `.env.local` for dev).

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
