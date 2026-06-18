import { socials } from '../lib/data'

const links = [
  { href: '#projects', label: 'Work' },
  { href: '#experience', label: 'Experience' },
  { href: '#gym', label: 'Off-screen' },
  { href: '#contact', label: 'Contact' },
]

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/70 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <a href="#" className="font-mono text-sm font-semibold tracking-tight">
          <span className="text-gradient">~/sam</span>
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
              href={socials.resume}
              className="ml-2 rounded-md border border-white/10 px-3 py-1.5 text-foreground transition-colors hover:border-white/25"
            >
              Résumé
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}
