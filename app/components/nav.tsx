import { socials } from '../lib/data'

const links = [
  { href: '#projects', label: 'works' },
  { href: '#experience', label: 'experience' },
  { href: '#gym', label: 'off-screen' },
  { href: '#contact', label: 'contact' },
]

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-lg">
      <nav className="wrap flex items-center justify-between py-3 text-sm">
        <a href="#" className="text-foreground">
          <span className="text-primary">sam@portfolio</span>
          <span className="text-muted">:~$</span>
        </a>
        <ul className="hidden items-center gap-4 text-muted sm:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                ./{l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={socials.sourceRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              src
            </a>
          </li>
          <li>
            <a
              href={socials.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              resume.pdf
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}
