import { GithubIcon } from './brand-icons'
import { socials } from '../lib/data'

// Top-right "view source" pill — proof the site is hand-coded.
export function SourceButton() {
  return (
    <a
      href={socials.sourceRepo}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 items-center gap-2 rounded-full border border-border bg-white/30 px-3.5 text-sm font-medium backdrop-blur-lg transition-colors hover:bg-accent dark:bg-neutral-900/60"
    >
      <GithubIcon className="h-4 w-4" />
      <span>Source</span>
    </a>
  )
}
