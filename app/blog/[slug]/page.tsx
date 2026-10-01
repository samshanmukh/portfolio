import Link from 'next/link'
import type { Metadata } from 'next'
import { marked } from 'marked'
import { notFound } from 'next/navigation'
import { getPost, getPosts } from '../../lib/posts'
import { ThemeToggle } from '../../components/theme-toggle'

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return { title: 'Not found' }
  return { title: post.title, description: post.excerpt }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()
  const html = marked.parse(post.content) as string

  return (
    <main className="pt-8 pb-20">
      <div className="wrap">
        <div className="flex items-center justify-between">
          <Link href="/blog" className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
            ← all writing
          </Link>
          <ThemeToggle />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
        <p className="mt-2 text-sm text-muted">{post.date}</p>
        <article className="prose-blog mt-8 max-w-2xl" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </main>
  )
}
