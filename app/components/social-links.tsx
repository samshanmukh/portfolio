import { FileText, Mail } from 'lucide-react'
import type { ComponentType } from 'react'
import { socials } from '../lib/data'
import { GithubIcon, LinkedinIcon, XIcon } from './brand-icons'

type Link = { label: string; href: string; icon: ComponentType<{ className?: string }> }

export const socialLinks: Link[] = [
  { label: 'LinkedIn', href: socials.linkedin, icon: LinkedinIcon },
  { label: 'GitHub', href: socials.github, icon: GithubIcon },
  { label: 'X / Twitter', href: socials.twitter, icon: XIcon },
  { label: 'Email', href: `mailto:${socials.email}`, icon: Mail },
  { label: 'Résumé', href: socials.resume, icon: FileText },
]

// Row of clickable social icons (home page, chat header, contact answer).
export function SocialLinks({ size = 'md', className = '' }: { size?: 'sm' | 'md'; className?: string }) {
  const box = size === 'sm' ? 'h-7 w-7 md:h-9 md:w-9' : 'h-11 w-11'
  const icon = size === 'sm' ? 'h-3.5 w-3.5 md:h-4 md:w-4' : 'h-5 w-5'
  return (
    <div className={`flex items-center gap-1 md:gap-2 ${className}`}>
      {socialLinks.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target={href.startsWith('mailto:') ? undefined : '_blank'}
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className={`flex ${box} items-center justify-center rounded-full border border-border bg-white/30 backdrop-blur-lg transition hover:scale-105 hover:bg-accent dark:bg-neutral-900/60`}
        >
          <Icon className={icon} />
        </a>
      ))}
    </div>
  )
}
