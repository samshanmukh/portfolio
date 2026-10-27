'use client'

import type { View } from '../../lib/agent'
import type { PostMeta } from '../../lib/posts'
import dynamic from 'next/dynamic'
import { AiTrainer } from '../ai-trainer'
import { Blog } from './blog'
import { Contact } from './contact'
import { Education, Experience } from './experience'
import { Events } from './events'
import { GithubNow } from './github-now'
import { Gym } from './gym'
import { Presentation } from './presentation'
import { Projects } from './projects'
import { Resume } from './resume'
import { Skills } from './skills'
import { Source } from './source'
import { Status } from './status'
import { Testimonials } from './testimonials'

const Botmoji = dynamic(() => import('./botmoji').then((module) => module.Botmoji), {
  loading: () => <div role="status" className="rounded-3xl border border-border p-5 text-sm text-muted">Getting your bot moji studio ready…</div>,
})

// Renders the rich card for an agent answer (the reference's tool renderer).
export function ViewRenderer({
  view,
  posts,
  onAsk,
  profileUrl,
}: {
  view: View
  posts: PostMeta[]
  onAsk: (q: string) => void
  profileUrl?: string
}) {
  switch (view) {
    case 'botmoji':
      return <Botmoji initialUrl={profileUrl} />
    case 'me':
      return <Presentation />
    case 'projects':
      return <Projects />
    case 'now':
      return <GithubNow />
    case 'skills':
      return <Skills />
    case 'experience':
      return <Experience />
    case 'education':
      return <Education />
    case 'testimonials':
      return <Testimonials />
    case 'contact':
      return <Contact />
    case 'resume':
      return <Resume />
    case 'status':
      return <Status onAsk={onAsk} />
    case 'gym':
      return <Gym onAsk={onAsk} />
    case 'trainer':
      return <AiTrainer />
    case 'source':
      return <Source />
    case 'blog':
      return <Blog posts={posts} />
    case 'events':
      return <Events />
  }
}
