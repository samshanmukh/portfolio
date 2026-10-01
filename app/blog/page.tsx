import Link from 'next/link'
import type { Metadata } from 'next'
import { getPosts } from '../lib/posts'
import { ThemeToggle } from '../components/theme-toggle'

export const metadata: Metadata = {
  title: 'Writing',
  description: 'Notes on AI agents, ML, and building things.',
}

export default function BlogIndex() {
  const posts = getPosts()
  return (
    <main className="pt-8 pb-20">
      <div className="wrap">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
            ← back to portfolio
          </Link>
          <ThemeToggle />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">Writing</h1>
        <p className="mt-2 text-muted">Notes on AI agents, ML, and building things.</p>

        <ul className="mt-10 space-y-3">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="group block rounded-xl bg-accent px-5 py-4 transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-medium text-foreground group-hover:text-primary">
                    {p.title}
                  </h2>
                  <span className="text-xs text-muted">{p.date}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{p.excerpt}</p>
              </Link>
            </li>
          ))}
          {posts.length === 0 && <li className="py-5 text-muted">No posts yet.</li>}
        </ul>
      </div>
    </main>
  )
}
