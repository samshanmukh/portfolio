import { SectionHeading } from './section-heading'
import { projects, socials } from '../lib/data'

export function Projects() {
  return (
    <section id="projects" className="scroll-mt-24 py-16">
      <div className="wrap">
        <SectionHeading eyebrow="Work" title="Selected projects" />
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <div
              key={p.name}
              className="group relative flex flex-col rounded-2xl border border-white/10 bg-surface p-6 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground">
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-primary"
                  >
                    {p.name}
                  </a>
                </h3>
                {p.featured && (
                  <span className="shrink-0 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
                    Featured
                  </span>
                )}
              </div>

              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{p.blurb}</p>

              {p.metric && (
                <p className="mt-3 text-xs font-medium text-primary">↑ {p.metric}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-foreground/70"
                  >
                    {t}
                  </span>
                ))}
                <span className="ml-auto flex items-center gap-3 font-mono text-xs">
                  {p.demo && (
                    <a
                      href={p.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      demo ↗
                    </a>
                  )}
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted underline-offset-4 hover:text-foreground hover:underline"
                  >
                    code ↗
                  </a>
                </span>
              </div>
            </div>
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
