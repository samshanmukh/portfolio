export type Repo = {
  name: string
  html_url: string
  description: string | null
  language: string | null
  pushed_at: string
  fork: boolean
  stargazers_count: number
}

// Most recently pushed, non-fork repos. Cached for an hour by Next's fetch cache.
export async function getRecentRepos(): Promise<Repo[] | null> {
  try {
    const res = await fetch(
      'https://api.github.com/users/samshanmukh/repos?sort=pushed&direction=desc&per_page=12',
      {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        },
        next: { revalidate: 3600 },
      }
    )
    if (!res.ok) return null
    const repos: Repo[] = await res.json()
    return repos.filter((r) => !r.fork).slice(0, 4)
  } catch {
    return null
  }
}
