'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { PostMeta } from '../../lib/posts'

// "What have you written?" — posts from content/blog.
export function Blog({ posts }: { posts: PostMeta[] }) {
  return (
    <div className="w-full pt-6 pb-4">
      <h2 className="text-3xl font-bold md:text-4xl">Writing</h2>
      <p className="mt-2 text-muted">Notes on AI agents, ML, and building things.</p>
      <div className="mt-6 space-y-3">
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="group flex items-center justify-between gap-4 rounded-xl bg-accent px-5 py-4 transition-colors hover:bg-accent/70"
          >
            <div>
              <p className="font-medium group-hover:text-primary">{p.title}</p>
              <p className="mt-0.5 text-sm text-muted">{p.excerpt}</p>
              <p className="mt-1 text-xs text-muted">{p.date}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
        {posts.length === 0 && <p className="text-muted">No posts yet.</p>}
      </div>
      <Link href="/blog" className="tap relative mt-4 inline-block text-sm text-primary hover:underline">
        All writing →
      </Link>
    </div>
  )
}
