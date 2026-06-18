const links = [
  { href: '#projects', label: 'Projects' },
  { href: '#blog', label: 'Writing' },
  { href: '#contact', label: 'Contact' },
]

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-background/70 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <a href="#" className="text-sm font-semibold tracking-tight">
          <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
            sam.
          </span>
        </a>
        <ul className="flex items-center gap-1 text-sm text-neutral-400">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-md px-3 py-1.5 transition-colors hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
