import { SectionHeading } from './section-heading'

const socials = [
  { label: 'Email', href: 'mailto:sam@runcoach.com' },
  { label: 'GitHub', href: 'https://github.com/samshanmukh' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  { label: 'X', href: 'https://x.com/' },
]

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading eyebrow="Contact" title="Let's build something" />
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 p-8">
          <p className="max-w-md text-neutral-300">
            Have an idea, a role, or just want to say hi? My inbox is always
            open — I&apos;ll try to get back to you within a day or two.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 transition-colors hover:bg-white/10 hover:text-white"
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
