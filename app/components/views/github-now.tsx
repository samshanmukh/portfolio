'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { socials } from '../../lib/data'
import type { Repo } from '../../lib/github'

function ago(iso: string): string {
  const secs = (Date.now() - new Date(iso).getTime()) / 1000
  const days = Math.floor(secs / 86400)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

// "What are you building lately?" — live from GitHub (cached hourly by /api/github-now).
export function GithubNow() {
  const [repos, setRepos] = useState<Repo[] | null | undefined>(undefined)

  useEffect(() => {
    fetch('/api/github-now')
      .then((r) => r.json())
      .then((d) => setRepos(d.repos ?? null))
      .catch(() => setRepos(null))
  }, [])

  return (
    <div className="w-full pt-6 pb-4">
      <h2 className="text-3xl font-bold md:text-4xl">What I&apos;m building lately</h2>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
        live from{' '}
        <a href={socials.github} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          github.com/samshanmukh
        </a>
        · auto-updates hourly
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {repos === undefined &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-accent" />
          ))}
        {repos === null && (
          <p className="text-sm text-muted sm:col-span-2">
            GitHub isn&apos;t answering right now —{' '}
            <a href={socials.github} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              see my profile ↗
            </a>
          </p>
        )}
        {repos?.map((r, i) => (
          <motion.a
            key={r.name}
            href={r.html_url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.06 * i } }}
            className="group rounded-xl bg-accent p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-medium group-hover:text-primary">{r.name}</span>
              <span className="shrink-0 text-[11px] text-muted">pushed {ago(r.pushed_at)}</span>
            </div>
            {r.description && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{r.description}</p>}
            <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
              {r.language && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {r.language}
                </span>
              )}
              {r.stargazers_count > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3" /> {r.stargazers_count}
                </span>
              )}
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  )
}
