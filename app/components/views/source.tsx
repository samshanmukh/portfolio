'use client'

import { Bot } from 'lucide-react'
import { socials } from '../../lib/data'
import { GithubIcon } from '../brand-icons'

const stack = ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'WebLLM (on-device)', 'Vercel']

// "How was this site built?"
export function Source() {
  return (
    <div className="mx-auto w-full pt-6 pb-4 text-center">
      <h2 className="text-3xl font-semibold md:text-4xl">Hand-coded from scratch</h2>
      <div className="mt-6 flex items-center justify-center rounded-xl bg-accent p-8">
        <Bot className="h-20 w-20" />
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {stack.map((s) => (
          <span key={s} className="glass rounded-full px-3 py-1 text-sm">
            {s}
          </span>
        ))}
      </div>
      <a
        href={socials.sourceRepo}
        target="_blank"
        rel="noopener noreferrer"
        className="glass mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
      >
        <GithubIcon className="h-4 w-4" /> View source
      </a>
    </div>
  )
}
