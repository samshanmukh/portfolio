import { SectionHeading } from './section-heading'
import { projects, socials } from '../lib/data'

export function Projects() {
  return (
    <section id="projects" className="scroll-mt-24 py-16">
      <div className="wrap">
        <SectionHeading eyebrow="Work" title="Selected projects" />
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative flex flex-col rounded-2xl border border-white/10 bg-surface p-6 transition-colors hover:border-primary/40 hover:bg-white/[0.04] ${
                p.featured ? 'sm:col-span-1' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{p.name}</h3>
                {p.featured && (
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
                    Featured
                  </span>
                )}
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {p.blurb}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-foreground/70"
                  >
                    {t}
                  </span>
                ))}
                <span className="ml-auto text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                  ↗
                </span>
              </div>
            </a>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">
          <a
            href={socials.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            70+ more repositories on GitHub ↗
          </a>
        </p>
      </div>
    </section>
  )
}
