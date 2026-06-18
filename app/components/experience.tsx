import { Prompt } from './prompt'
import { experience, education, certifications, languages } from '../lib/data'

export function Experience() {
  return (
    <section id="experience" className="scroll-mt-24 py-16">
      <div className="wrap">
        <Prompt command="git log --oneline --all" comment="experience & education" />

        <ol className="relative border-l border-white/10 pl-6">
          {experience.map((e, i) => (
            <li key={i} className="mb-8 last:mb-0">
              <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold text-foreground">
                  {e.role}{' '}
                  <span className="font-normal text-muted">· {e.company}</span>
                </h3>
                <span className="font-mono text-xs text-muted">{e.period}</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/75">
                {e.note}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-primary">
              Education
            </h3>
            <ul className="space-y-2">
              {education.map((ed, i) => (
                <li key={i} className="text-sm text-foreground/80">
                  <span className="font-medium">{ed.school}</span>
                  <span className="block text-muted">{ed.detail}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">
              <span className="font-mono uppercase tracking-widest text-primary">
                Languages ·{' '}
              </span>
              {languages.join(' · ')}
            </p>
          </div>

          <div>
            <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-primary">
              Certifications
            </h3>
            <ul className="space-y-1.5">
              {certifications.map((c, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm text-foreground/80"
                >
                  <span className="text-primary">›</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
