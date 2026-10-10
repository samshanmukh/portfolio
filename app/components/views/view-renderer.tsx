'use client'

import type { View } from '../../lib/agent'
import type { ChatMsg } from '../../lib/hosted-llm'
import type { PostMeta } from '../../lib/posts'
import { AiTrainer } from '../ai-trainer'
import { Blog } from './blog'
import { Book } from './book'
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

// Renders the rich card for an agent answer (the reference's tool renderer).
export function ViewRenderer({
  view,
  posts,
  onAsk,
  chat,
}: {
  view: View
  posts: PostMeta[]
  onAsk: (q: string) => void
  // the conversation so far, for cards that use it (booking notes what was asked)
  chat?: ChatMsg[]
}) {
  switch (view) {
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
    case 'book':
      return <Book chat={chat} />
  }
}
