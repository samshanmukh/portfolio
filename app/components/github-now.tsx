import { SectionHeading } from './section-heading'
import { socials } from '../lib/data'

type Repo = {
  name: string
  html_url: string
  description: string | null
  language: string | null
  pushed_at: string
  fork: boolean
  stargazers_count: number
}

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

async function getRecentRepos(): Promise<Repo[] | null> {
  try {
    const res = await fetch(
      'https://api.github.com/users/samshanmukh/repos?sort=pushed&direction=desc&per_page=12',
      {
        headers: { Accept: 'application/vnd.github+json' },
        next: { revalidate: 3600 }, // refresh hourly
      }
    )
    if (!res.ok) return null
    const repos: Repo[] = await res.json()
    return repos.filter((r) => !r.fork).slice(0, 4)
  } catch {
    return null
  }
}

export async function GithubNow() {
  const repos = await getRecentRepos()
  if (!repos || repos.length === 0) return null

  return (
    <section id="now" className="scroll-mt-24 py-16">
      <div className="wrap">
        <SectionHeading eyebrow="Now · live from GitHub" title="What I'm building lately" />
        <div className="grid gap-3 sm:grid-cols-2">
          {repos.map((r) => (
            <a
              key={r.name}
              href={r.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-white/10 bg-surface p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-medium text-foreground group-hover:text-primary">
                  {r.name}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-muted">
                  pushed {ago(r.pushed_at)}
                </span>
              </div>
              {r.description && (
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
                  {r.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-3 font-mono text-[11px] text-muted/80">
                {r.language && (
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary/70" />
                    {r.language}
                  </span>
                )}
                {r.stargazers_count > 0 && <span>★ {r.stargazers_count}</span>}
              </div>
            </a>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#dcbb8e]" />
            auto-updates hourly from{' '}
            <a
              href={socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              github.com/samshanmukh
            </a>
          </span>
        </p>
      </div>
    </section>
  )
}
