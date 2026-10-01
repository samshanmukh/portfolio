# Portfolio

A clean, fast personal portfolio built from scratch with **Next.js (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

## How it works

A chat-first "AI-native" portfolio (UI/UX modeled on [ai-native-portfolio](https://github.com/samshanmukh/ai-native-portfolio)):

- **Landing (`/`)** — memoji, "Ask me anything" input, and quick questions (Me, Projects, Skills, Fun, Contact)
- **Chat (`/chat?query=…`)** — the portfolio agent answers in first person and renders a rich card for each topic
  (intro, projects carousel, skills, experience, education, testimonials, live GitHub activity, gym + AI trainer demo,
  résumé, contact, writing). Optional ⚡ smart mode runs a small LLM in the browser via WebLLM.
- **Blog (`/blog`)** — markdown posts from `content/blog`
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
| Memoji | `public/memoji.png` |
| Page metadata | `app/layout.tsx` |

## Deploy

Deploy on [Vercel](https://vercel.com/new) — zero config for Next.js.
