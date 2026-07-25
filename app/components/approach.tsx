import { SectionHeading } from './section-heading'

// Chapter 01 — the thesis. States the forward-deployed operating model up front
// so every chapter that follows reads as evidence for it.
const beats = [
  {
    step: '01',
    label: 'Embed',
    title: 'I go where the problem is.',
    body: 'Drop in with the team, learn the domain and the messy real data, and figure out what actually needs to ship — not what looks clean in a notebook.',
  },
  {
    step: '02',
    label: 'Ship',
    title: 'I put it in production.',
    body: 'LLM agents, RAG, and computer-vision pipelines built to run for real users on real infrastructure, with the rough edges handled.',
  },
  {
    step: '03',
    label: 'Iterate',
    title: 'I own what happens next.',
    body: 'Watch it in the wild, fix what breaks, tighten the loop. Launch is the start of the work, not the finish line.',
  },
]

export function Approach() {
  return (
    <section id="approach" className="scroll-mt-24 py-24 sm:py-28">
      <div className="wrap">
        <SectionHeading
          chapter="01"
          eyebrow="How I work"
          title="I don’t hand models off. I move in and ship them."
          lead="Forward deployed means the whole loop is mine — from the first messy dataset to the thing running in production."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {beats.map((b) => (
            <div
              key={b.label}
              className="rounded-2xl border border-white/10 bg-surface p-6"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs tabular-nums text-primary/80">
                  {b.step}
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
                  {b.label}
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl text-foreground">
                {b.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{b.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
