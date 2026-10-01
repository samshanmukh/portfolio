'use client'

import { motion } from 'framer-motion'
import { ExternalLink, GitCommitHorizontal, GitFork, Globe, Star, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { projects as staticProjects, socials } from '../../lib/data'
import type { LiveProject, ProjectsPayload } from '../../lib/project-stats'
import { GithubIcon } from '../brand-icons'

// GitHub's language colours for the ones Sam actually uses (grey otherwise).
const langColors: Record<string, string> = {
  Python: '#3572A5',
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Dart: '#00B4AB',
  'Jupyter Notebook': '#DA5B0B',
  HTML: '#e34c26',
  CSS: '#663399',
  Shell: '#89e051',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  'C++': '#f34b7d',
  C: '#555555',
  Go: '#00ADD8',
  Rust: '#dea584',
  Dockerfile: '#384d54',
}
const langColor = (name: string) => langColors[name] ?? '#a1a1aa'

function ago(iso: string): string {
  const secs = (Date.now() - new Date(iso).getTime()) / 1000
  if (secs < 3600) return `${Math.max(1, Math.floor(secs / 60))}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  const days = Math.floor(secs / 86400)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n))

function LanguageBar({ languages }: { languages: { name: string; pct: number }[] }) {
  if (!languages.length) return null
  return (
    <div className="space-y-1.5">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-accent">
        {languages.map((l) => (
          <span key={l.name} style={{ width: `${l.pct}%`, background: langColor(l.name) }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
        {languages.map((l) => (
          <span key={l.name} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: langColor(l.name) }} />
            {l.name} <span className="opacity-70">{l.pct}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Stat({ icon: Icon, value, label }: { icon: typeof Star; value: string; label: string }) {
  return (
    <span className="flex items-center gap-1" title={label}>
      <Icon className="h-3.5 w-3.5" />
      <span className="font-medium text-foreground">{value}</span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  )
}

function Stats({ p }: { p: LiveProject }) {
  const s = p.stats
  if (!s) return null
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
      {s.commits !== null && <Stat icon={GitCommitHorizontal} value={fmt(s.commits)} label={s.commits === 1 ? 'commit' : 'commits'} />}
      {s.releases !== null && <Stat icon={Tag} value={fmt(s.releases)} label={s.releases === 1 ? 'release' : 'releases'} />}
      <Stat icon={Star} value={fmt(s.stars)} label={s.stars === 1 ? 'star' : 'stars'} />
      {s.forks > 0 && <Stat icon={GitFork} value={fmt(s.forks)} label={s.forks === 1 ? 'fork' : 'forks'} />}
      <span>updated {ago(s.pushedAt)}</span>
    </div>
  )
}

function Chips({ p }: { p: LiveProject }) {
  const chips = Array.from(new Set([...p.tags, ...(p.stats?.topics ?? [])])).slice(0, 6)
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((t) => (
        <span key={t} className="glass rounded-full px-2 py-0.5 text-[11px] font-medium text-foreground/80">
          {t}
        </span>
      ))}
    </div>
  )
}

function Links({ p }: { p: LiveProject }) {
  const demo = p.demo ?? p.stats?.homepage ?? undefined
  const btn =
    'glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium'
  return (
    <div className="flex flex-wrap gap-2">
      <a href={p.stats?.url ?? p.href} target="_blank" rel="noopener noreferrer" className={btn}>
        <GithubIcon className="h-3.5 w-3.5" /> Code
      </a>
      {demo && (
        <a href={demo} target="_blank" rel="noopener noreferrer" className={btn}>
          <Globe className="h-3.5 w-3.5" /> Live
        </a>
      )}
      {p.stats?.latestRelease && (
        <a href={p.stats.latestRelease.url} target="_blank" rel="noopener noreferrer" className={btn}>
          <Tag className="h-3.5 w-3.5" /> {p.stats.latestRelease.tag}
        </a>
      )}
    </div>
  )
}

// The project Sam pushed to most recently, with its latest commit.
function Current({ p }: { p: LiveProject }) {
  const s = p.stats
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 md:p-7"
    >
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-green-600 uppercase dark:text-green-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        Currently building
      </div>
      <h3 className="mt-2 text-2xl font-bold md:text-3xl">{p.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted md:text-base">{p.blurb}</p>
      {p.metric && <p className="mt-2 text-xs font-semibold text-primary">↑ {p.metric}</p>}

      {s && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Commits', value: s.commits !== null ? fmt(s.commits) : '—' },
            { label: 'Releases', value: s.releases !== null ? fmt(s.releases) : '—' },
            { label: 'Stars', value: fmt(s.stars) },
            { label: 'Last push', value: ago(s.pushedAt) },
          ].map((x) => (
            <div key={x.label} className="rounded-2xl border border-border bg-background px-3 py-2.5">
              <div className="text-lg font-bold md:text-xl">{x.value}</div>
              <div className="text-[11px] text-muted">{x.label}</div>
            </div>
          ))}
        </div>
      )}

      {s?.lastCommit && (
        <a
          href={s.lastCommit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs transition-opacity hover:opacity-80"
        >
          <GitCommitHorizontal className="h-4 w-4 shrink-0 text-muted" />
          <span className="truncate font-mono">{s.lastCommit.message}</span>
          <span className="ml-auto shrink-0 text-muted">{ago(s.lastCommit.date)}</span>
        </a>
      )}

      <div className="mt-4 space-y-4">
        {s && <LanguageBar languages={s.languages} />}
        <Chips p={p} />
        <Links p={p} />
      </div>
    </motion.div>
  )
}

function Card({ p, i }: { p: LiveProject; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.06 * i } }}
      className="flex flex-col gap-3 rounded-2xl border border-border p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">{p.name}</h3>
        <a
          href={p.stats?.url ?? p.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${p.name} on GitHub`}
          className="mt-1 text-muted transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <p className="text-sm leading-relaxed text-muted">{p.blurb}</p>
      {p.metric && <p className="text-xs font-semibold text-primary">↑ {p.metric}</p>}
      <Stats p={p} />
      {p.stats && <LanguageBar languages={p.stats.languages} />}
      <div className="mt-auto space-y-3 pt-1">
        <Chips p={p} />
        <Links p={p} />
      </div>
    </motion.div>
  )
}

// "What have you built?" — newest work first, with live GitHub stats (commits, releases,
// languages, last push). Falls back to the static list if GitHub can't be reached.
export function Projects() {
  const [data, setData] = useState<ProjectsPayload | null>(null)

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d: ProjectsPayload) => setData(d))
      .catch(() => setData({ live: false, current: null, projects: staticProjects.map((p) => ({ ...p, stats: null })) }))
  }, [])

  return (
    <div className="w-full space-y-5 pt-6 pb-4">
      <div>
        <h2 className="text-xl font-bold md:text-3xl">My Projects</h2>
        {data?.live && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            live from{' '}
            <a href={socials.github} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              github.com/samshanmukh
            </a>
            · updates hourly
          </p>
        )}
      </div>

      {!data && (
        <div className="space-y-3">
          <div className="h-64 animate-pulse rounded-3xl bg-accent" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-accent" />
            ))}
          </div>
        </div>
      )}

      {data?.current && <Current p={data.current} />}

      {data && (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.projects.map((p, i) => (
            <Card key={p.href} p={p} i={i} />
          ))}
        </div>
      )}

      <a
        href={socials.github}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm text-primary underline-offset-4 hover:underline"
      >
        70+ more repositories on GitHub ↗
      </a>
    </div>
  )
}
