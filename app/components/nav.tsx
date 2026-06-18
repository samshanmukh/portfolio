import Image from 'next/image'
import { profile, socials } from '../lib/data'

const links = [
  { href: '#projects', label: 'Work' },
  { href: '#experience', label: 'Experience' },
  { href: '#gym', label: 'Beyond' },
  { href: '#contact', label: 'Contact' },
]

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/70 backdrop-blur-lg">
      <nav className="wrap flex items-center justify-between py-3">
        <a href="#" className="flex items-center gap-2.5">
          <Image
            src={profile.logo}
            alt={profile.name}
            width={28}
            height={28}
            className="h-7 w-7 rounded-md border border-white/15 object-cover"
            unoptimized
          />
          <span className="text-sm font-semibold tracking-tight">
            {profile.shortName} <span className="text-muted">Karri</span>
          </span>
        </a>
        <ul className="hidden items-center gap-1 text-sm text-muted sm:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-md px-3 py-1.5 transition-colors hover:bg-white/5 hover:text-foreground"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={socials.sourceRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-3 py-1.5 transition-colors hover:bg-white/5 hover:text-foreground"
            >
              Source
            </a>
          </li>
          <li>
            <a
              href={socials.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 rounded-lg border border-white/10 px-3 py-1.5 text-foreground transition-colors hover:border-white/25"
            >
              Résumé
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}
