import { Prompt } from './prompt'
import { gym } from '../lib/data'

export function Gym() {
  return (
    <section id="gym" className="scroll-mt-24 py-16">
      <div className="mx-auto max-w-4xl px-6">
        <Prompt command="./gym.sh --status" comment={gym.tagline} />

        <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-surface to-surface p-8 sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/20 blur-3xl"
          />
          <p className="relative max-w-xl text-lg leading-relaxed text-foreground/90">
            {gym.blurb}
          </p>

          <dl className="relative mt-8 grid gap-4 sm:grid-cols-3">
            {gym.stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-background/40 p-4"
              >
                <dt className="font-mono text-xs uppercase tracking-widest text-accent">
                  {s.label}
                </dt>
                <dd className="mt-1 text-lg font-semibold text-foreground">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="relative mt-6 font-mono text-sm text-muted">
            <span className="text-accent">{'// '}</span>
            yes, two of my projects are literally AI gym coaches.
          </p>
        </div>
      </div>
    </section>
  )
}
