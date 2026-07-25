import { SectionHeading } from './section-heading'
import { testimonials } from '../lib/data'

export function Testimonials() {
  return (
    <section id="testimonials" className="scroll-mt-24 py-24 sm:py-28">
      <div className="wrap">
        <SectionHeading
          chapter="05"
          eyebrow="What teams say"
          title="The people I embedded with."
          lead="Recommendations from the engineers and leaders I shipped alongside."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-2xl border border-white/10 bg-surface p-6"
            >
              <span className="font-serif text-3xl leading-none text-primary">“</span>
              <blockquote className="mt-1 flex-1 text-sm leading-relaxed text-foreground/85">
                {t.quote}
              </blockquote>
              <figcaption className="mt-4 border-t border-white/10 pt-3">
                <div className="text-sm font-medium text-foreground">{t.name}</div>
                <div className="text-xs text-muted">{t.title}</div>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          Recommendations from LinkedIn · more on{' '}
          <a
            href="https://www.linkedin.com/in/shanmukhsain"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            my profile ↗
          </a>
        </p>
      </div>
    </section>
  )
}
