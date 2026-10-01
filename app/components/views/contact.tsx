'use client'

import { FileText, Mail, MapPin } from 'lucide-react'
import type { ComponentType } from 'react'
import { profile, socials } from '../../lib/data'
import { GithubIcon, LinkedinIcon, XIcon } from '../brand-icons'
import { SocialLinks } from '../social-links'

type Item = {
  icon: ComponentType<{ className?: string }>
  title: string
  value: string
  href: string
  color: string
  cta: string
}

const items: Item[] = [
  { icon: Mail, title: 'Email', value: socials.email, href: `mailto:${socials.email}`, color: 'text-[#EA4335]', cta: 'Send an email' },
  { icon: LinkedinIcon, title: 'LinkedIn', value: socials.linkedin.replace('https://www.', ''), href: socials.linkedin, color: 'text-[#0A66C2]', cta: 'Open LinkedIn' },
  { icon: GithubIcon, title: 'GitHub', value: socials.github.replace('https://', ''), href: socials.github, color: 'text-foreground', cta: 'Open GitHub' },
  { icon: XIcon, title: 'X / Twitter', value: socials.twitter.replace('https://', ''), href: socials.twitter, color: 'text-foreground', cta: 'Open X' },
  { icon: FileText, title: 'Résumé', value: 'PDF', href: socials.resume, color: 'text-[#16A34A]', cta: 'View résumé' },
  {
    icon: MapPin,
    title: 'Location',
    value: profile.location,
    href: `https://www.google.com/maps/search/${encodeURIComponent(profile.location)}`,
    color: 'text-purple-600',
    cta: 'View on map',
  },
]

// "How can I reach you?" — contact cards.
export function Contact() {
  return (
    <div className="space-y-6 pt-6 pb-4">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold md:text-3xl">Let&apos;s build something</h2>
        <p className="mx-auto max-w-lg text-muted">
          Hiring, collaborating, or just want to talk shop about agents and computer vision? My
          inbox is open — I usually reply within a day.
        </p>
        <SocialLinks className="justify-center pt-2" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((c) => (
          <div key={c.title} className="rounded-xl border border-border p-5 transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-accent p-2 ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{c.title}</h3>
            </div>
            <p className="mt-3 mb-3 truncate font-medium text-muted">{c.value}</p>
            <a
              href={c.href}
              target={c.href.startsWith('http') || c.href.endsWith('.pdf') ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="block w-full rounded-md border border-border py-1.5 text-center text-sm font-medium transition-colors hover:bg-accent"
            >
              {c.cta}
            </a>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-accent p-6 text-center">
        <h3 className="mb-2 font-semibold">What I&apos;m looking for</h3>
        <p className="text-sm text-muted">{profile.lookingFor}</p>
      </div>
    </div>
  )
}
