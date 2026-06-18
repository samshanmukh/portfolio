import { SectionHeading } from './section-heading'
import { skills } from '../lib/data'

export function About() {
  return (
    <section id="about" className="scroll-mt-24 py-16">
      <div className="wrap">
        <SectionHeading eyebrow="Toolkit" title="What I work with" />
        <div className="grid gap-4 sm:grid-cols-3">
          {skills.map((s) => (
            <div
              key={s.group}
              className="rounded-2xl border border-white/10 bg-surface p-5"
            >
              <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-primary">
                {s.group}
              </h3>
              <ul className="flex flex-wrap gap-1.5">
                {s.items.map((i) => (
                  <li
                    key={i}
                    className="rounded-md bg-white/5 px-2 py-1 text-xs text-foreground/80"
                  >
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
