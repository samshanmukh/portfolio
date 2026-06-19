import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const DIR = path.join(process.cwd(), 'content/blog')

export type PostMeta = { slug: string; title: string; date: string; excerpt: string }
export type Post = PostMeta & { content: string }

export function getPosts(): PostMeta[] {
  if (!fs.existsSync(DIR)) return []
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const slug = f.replace(/\.md$/, '')
      const { data } = matter(fs.readFileSync(path.join(DIR, f), 'utf8'))
      return {
        slug,
        title: data.title || slug,
        date: data.date || '',
        excerpt: data.excerpt || '',
      }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getPost(slug: string): Post | null {
  const p = path.join(DIR, `${slug}.md`)
  if (!fs.existsSync(p)) return null
  const { data, content } = matter(fs.readFileSync(p, 'utf8'))
  return {
    slug,
    title: data.title || slug,
    date: data.date || '',
    excerpt: data.excerpt || '',
    content,
  }
}
