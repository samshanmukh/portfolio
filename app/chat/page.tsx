import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Chat } from '../components/chat/chat'
import { getPosts } from '../lib/posts'

export const metadata: Metadata = {
  title: 'Chat',
  alternates: { canonical: '/chat' },
}

export default function ChatPage() {
  const posts = getPosts()
  return (
    <Suspense fallback={<div className="p-8 text-muted">Loading chat…</div>}>
      <Chat posts={posts} />
    </Suspense>
  )
}
