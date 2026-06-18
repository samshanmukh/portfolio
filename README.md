# Portfolio

A clean, fast personal portfolio built from scratch with **Next.js (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

## Sections

- **Hero / bio** — intro with name, tagline, and tech stack
- **Projects** — grid of selected work
- **Blog** — recent writing
- **Contact** — email and social links

## Getting started

```bash
pnpm install   # or: npm install
pnpm dev       # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Customize

| What | Where |
| --- | --- |
| Name, bio, stack | `app/components/hero.tsx` |
| Projects | `app/components/projects.tsx` |
| Blog posts | `app/components/blog.tsx` |
| Social links | `app/components/contact.tsx` |
| Colors / theme | `app/globals.css` |
| Page metadata | `app/layout.tsx` |

## Deploy

Deploy on [Vercel](https://vercel.com/new) — zero config for Next.js.
