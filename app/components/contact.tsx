import { SectionHeading } from './section-heading'
import { socials } from '../lib/data'

const links = [
  { label: 'Email', href: `mailto:${socials.email}` },
  { label: 'GitHub', href: socials.github },
  { label: 'LinkedIn', href: socials.linkedin },
  { label: 'X / Twitter', href: socials.twitter },
]

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-24 py-16">
      <div className="wrap">
        <SectionHeading eyebrow="Contact" title="Let's build something" />
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-surface p-8 sm:p-10">
          <p className="max-w-md text-foreground/90">
            Hiring, collaborating, or just want to talk shop about agents and
            computer vision? My inbox is open — I usually reply within a day.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {links.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-white/10"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
