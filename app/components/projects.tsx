import { SectionHeading } from './section-heading'
import { projects, socials } from '../lib/data'

export function Projects() {
  const featured = projects.filter((p) => p.featured)
  const rest = projects.filter((p) => !p.featured)

  return (
    <section id="projects" className="scroll-mt-24 py-24 sm:py-28">
      <div className="wrap">
        <SectionHeading
          chapter="02"
          eyebrow="Selected work"
          title="A few things I took all the way to production."
          lead="Each one started as someone’s messy real-world problem. Here’s the problem, the move I made, and what changed once it shipped."
        />

        {/* featured — full case studies (problem → move → outcome) */}
        <div className="space-y-4">
          {featured.map((p) => (
            <article
              key={p.name}
              className="group rounded-2xl border border-white/10 bg-surface p-6 transition-colors hover:border-primary/40 sm:p-8"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h3 className="font-display text-2xl text-foreground">
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-primary"
                  >
                    {p.name}
                  </a>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-foreground/70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                {(
                  [
                    ['Problem', p.problem],
                    ['Move', p.move],
                    ['Outcome', p.outcome],
                  ] as const
                ).map(
                  ([label, text]) =>
                    text && (
                      <div key={label}>
                        <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                          {label}
                        </dt>
                        <dd className="mt-1.5 text-sm leading-relaxed text-foreground/80">
                          {text}
                        </dd>
                      </div>
                    )
                )}
              </dl>

              <div className="mt-5 flex items-center gap-4 font-mono text-xs">
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
              </div>
            </article>
          ))}
        </div>

        {/* rest — compact cards */}
        {rest.length > 0 && (
          <>
            <p className="mb-3 mt-10 font-mono text-xs uppercase tracking-[0.2em] text-muted">
              More builds
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {rest.map((p) => (
                <div
                  key={p.name}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-surface p-6 transition-colors hover:border-primary/40"
                >
                  <h3 className="font-medium text-foreground">
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-primary"
                    >
                      {p.name}
                    </a>
                  </h3>
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
          </>
        )}

        <p className="mt-8 text-sm text-muted">
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
