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

## Bot moji creator

Ask the portfolio chat **“Make my bot moji”**, or choose it in the chat suggestions / quick-question drawer.
Visitors can share a LinkedIn `/in/` URL or GitHub profile, or enter their name and professional headline.
The server reads public metadata only. If a profile cannot be read, the creator asks for pasted text instead of
guessing a job from the URL. No profile data is persisted, and no additional API key is needed.

Characters use the supplied six-column plush artwork at `public/botmoji/reference-plush.png`.
The role chooses an initial character; the profile signature generates continuous personal colors,
and subtle proportions. Characters have no accessory icons, props, or floating badges.
Visitors can also choose any of the six plush shapes. The editor explains which profile signals
inspired the palette. Canvas recoloring preserves the original fur lighting and facial features;
local image warps animate the original eyes, eyebrows, and mouth without drawing a replacement face.
Libraries.dev’s documented BotAvatar generates its own shapes, so it is not used to replace this artwork.
No per-visitor image-generation API calls are needed.

Visitors can remix the design, preview four animated expressions, pause or play the preview,
download a transparent 384 × 384 looping GIF, and copy or preview the generation prompt.
The profile generates the palette automatically; the creator does not show color controls or embed-code actions. The GIF encoder is loaded only when exporting; plush textures are cached during animation.

Each mode has its own repeating performance: attending blinks and follows with its eyes; working
scans side to side with moving serious brows and a pulsing red forehead; responding opens a closed
smile into a wide grin. The shared timeline in `app/lib/botmoji-motion.ts` drives the preview,
embed, and GIF export, so facial motion is preserved in the download. Each 15-second GIF includes
the four expressions followed by the jump, full turn, landing squash and smile (176 frames).
The short jump sequence is sampled at 20 fps; the expression sequence uses 10 fps.
Selected modes continue animating, Pause freezes the current pose, and reduced-motion preferences
show a still expression. Tapping or clicking the character (or pressing Enter/Space on it) uses
Zup Fenn’s .24-second crouch, .68-second hop/full turn and .24-second landing squash, followed by a
happy face. Only the character moves; the backdrop and labels stay still. During a turn, a closed
WebGL pillow mesh preserves the original front artwork and uses matching fur on its back, with
an in-canvas spin fallback if WebGL is disabled. Reduced-motion taps show a smile without a jump
or turn. The interaction also works in embeds and the small creator previews.

The embed at `/botmoji/embed` accepts `name`, `role`, `variation`, and a validated `design` JSON recipe.
It reproduces the exact edited palette and silhouette without exposing the original profile
text or profile URL. Accessory fields in legacy recipes are accepted but ignored. Invalid or old embed recipes fall back to a new safe design.

Design generation, URL validation, prompts, and embed serialization live in `app/lib/botmoji.ts`;
public LinkedIn metadata / JSON-LD extraction is in `app/lib/botmoji-profile.ts`; the plush renderer is
in `app/lib/botmoji-render.ts`, with sprite crops and facial landmarks in `app/lib/botmoji-artwork.ts`.

Run `pnpm test:botmoji` with Node 22.18+ to check role selection, same-profile reproducibility,
same-role uniqueness, accessory-free profiles, profile extraction, URL restrictions, embed recipe
validation, prompt personalization, blink timing, working expression / heat, smile growth, tap timing, and motion loops.

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

When a visitor wants to meet, the chat asks softly, one question at a time with tap-to-answer chips: video, phone or
in person, a day and a free time from Sam's calendar (in the visitor's time zone), a place or number when needed, name
and email. Their "Yes, book it" books it onto Sam's
Google Calendar with a note on what the visitor asked in the chat, and Google sends them the invite (with a Meet link
for video). For in person, the place they name is looked up on Google Maps and checked with them, so the invite carries
the address. Saying "cancel it" (or asking to reschedule) later from the same browser really takes the meeting off the
calendar, and Google emails them the cancellation. From any other browser the chat asks for the email they booked
with and emails them a 6-digit code first, so only that inbox can cancel it. It runs through a small Google Apps Script under Sam's own account,
so no Google Cloud project is needed. After changing the script, paste it again and deploy a new version (Deploy >
Manage deployments > edit > New version) so the URL stays the same.

1. Follow the setup steps at the top of `scripts/booking-calendar.gs` (paste it into script.google.com, add the
   Google Calendar service, set `SECRET`, deploy as a web app). Hours, slot length and time zone are set there too.
2. Set `BOOKING_SCRIPT_URL` (the web app URL) and `BOOKING_SECRET` (the same string as `SECRET`) in Vercel and
   `.env.local`, then redeploy. Without them the chat offers email instead.

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
