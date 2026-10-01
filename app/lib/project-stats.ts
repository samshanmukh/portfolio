import { projects, socials, type Project } from './data'

// Live GitHub stats for the Projects answer: commits, releases, languages, last push…
// Cached for an hour by Next's fetch cache. Set GITHUB_TOKEN (any classic or fine-grained
// token with public read access) so the API's 60-requests/hour anonymous limit isn't hit.

const OWNER = 'samshanmukh'
const API = 'https://api.github.com'
const HOUR = 3600

export type RepoStats = {
  fullName: string
  url: string
  description: string | null
  homepage: string | null
  stars: number
  forks: number
  openIssues: number
  topics: string[]
  pushedAt: string
  createdAt: string
  languages: { name: string; pct: number }[]
  commits: number | null
  lastCommit: { message: string; date: string; url: string } | null
  releases: number | null
  latestRelease: { tag: string; date: string; url: string } | null
}

export type LiveProject = Project & { stats: RepoStats | null }

export type ProjectsPayload = {
  live: boolean // false when GitHub couldn't be reached (static data only)
  current: LiveProject | null // most recently pushed project
  projects: LiveProject[] // the rest, most recently active first
}

const headers = (): HeadersInit => ({
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
})

const get = (path: string) => fetch(`${API}${path}`, { headers: headers(), next: { revalidate: HOUR } })

// Total item count of a paginated list fetched with per_page=1: the "last" page number.
function totalFromLink(res: Response, pageLength: number): number {
  const last = res.headers.get('link')?.match(/[?&]page=(\d+)>; rel="last"/)
  return last ? Number(last[1]) : pageLength
}

const repoFromHref = (href: string) => href.match(/github\.com\/([^/]+)\/([^/#?]+)/)?.slice(1, 3).join('/') ?? null

async function getRepoStats(fullName: string): Promise<RepoStats | null> {
  try {
    const [repoRes, langRes, commitsRes, releasesRes] = await Promise.all([
      get(`/repos/${fullName}`),
      get(`/repos/${fullName}/languages`),
      get(`/repos/${fullName}/commits?per_page=1`),
      get(`/repos/${fullName}/releases?per_page=1`),
    ])
    if (!repoRes.ok) return null
    const repo = await repoRes.json()

    const langBytes: Record<string, number> = langRes.ok ? await langRes.json() : {}
    const total = Object.values(langBytes).reduce((a, b) => a + b, 0)
    const languages = Object.entries(langBytes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, bytes]) => ({ name, pct: total ? Math.round((bytes / total) * 1000) / 10 : 0 }))

    let commits: number | null = null
    let lastCommit: RepoStats['lastCommit'] = null
    if (commitsRes.ok) {
      const list = await commitsRes.json()
      commits = totalFromLink(commitsRes, list.length)
      const c = list[0]
      if (c) lastCommit = { message: c.commit.message.split('\n')[0], date: c.commit.committer?.date ?? c.commit.author?.date, url: c.html_url }
    } else if (commitsRes.status === 409) {
      commits = 0 // empty repository
    }

    let releases: number | null = null
    let latestRelease: RepoStats['latestRelease'] = null
    if (releasesRes.ok) {
      const list = await releasesRes.json()
      releases = totalFromLink(releasesRes, list.length)
      const r = list[0]
      if (r) latestRelease = { tag: r.tag_name, date: r.published_at ?? r.created_at, url: r.html_url }
    }

    return {
      fullName: repo.full_name,
      url: repo.html_url,
      description: repo.description,
      homepage: repo.homepage || null,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      topics: repo.topics ?? [],
      pushedAt: repo.pushed_at,
      createdAt: repo.created_at,
      languages,
      commits,
      lastCommit,
      releases,
      latestRelease,
    }
  } catch {
    return null
  }
}

// The newest thing Sam is pushing to that isn't already in the curated list (skips forks,
// this site's own repo and the profile README repo).
async function getNewestOtherRepo(known: Set<string>): Promise<string | null> {
  try {
    const res = await get(`/users/${OWNER}/repos?sort=pushed&direction=desc&per_page=10&type=owner`)
    if (!res.ok) return null
    const skip = new Set([repoFromHref(socials.sourceRepo)?.toLowerCase(), `${OWNER}/${OWNER}`.toLowerCase()])
    const repos: { full_name: string; fork: boolean; archived: boolean; private: boolean }[] = await res.json()
    const newest = repos.find((r) => !r.fork && !r.archived && !r.private && !skip.has(r.full_name.toLowerCase()))
    return newest && !known.has(newest.full_name.toLowerCase()) ? newest.full_name : null
  } catch {
    return null
  }
}

const prettify = (repo: string) =>
  repo
    .split('/')[1]
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

export async function getLiveProjects(): Promise<ProjectsPayload> {
  const known = new Set(projects.map((p) => repoFromHref(p.href)?.toLowerCase()).filter(Boolean) as string[])
  const [stats, newest] = await Promise.all([
    Promise.all(projects.map((p) => (repoFromHref(p.href) ? getRepoStats(repoFromHref(p.href)!) : null))),
    getNewestOtherRepo(known),
  ])

  const list: LiveProject[] = projects.map((p, i) => ({ ...p, stats: stats[i] }))

  // A brand-new repo that isn't in data.ts yet still shows up as the current project.
  if (newest) {
    const s = await getRepoStats(newest)
    if (s) {
      list.push({
        name: prettify(newest),
        blurb: s.description ?? 'Fresh repo, just getting started.',
        tags: s.topics.slice(0, 3),
        href: s.url,
        demo: s.homepage ?? undefined,
        stats: s,
      })
    }
  }

  const live = list.some((p) => p.stats)
  if (!live) return { live: false, current: null, projects: list }

  // Most recently pushed first; projects GitHub couldn't describe keep their data.ts order at the end.
  const sorted = [...list].sort((a, b) => {
    if (!a.stats || !b.stats) return a.stats ? -1 : b.stats ? 1 : 0
    return Date.parse(b.stats.pushedAt) - Date.parse(a.stats.pushedAt)
  })
  return { live: true, current: sorted[0], projects: sorted.slice(1) }
}
