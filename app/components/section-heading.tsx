export function SectionHeading({
  chapter,
  eyebrow,
  title,
  lead,
}: {
  chapter?: string
  eyebrow: string
  title: string
  lead?: string
}) {
  return (
    <div className="mb-12 max-w-2xl sm:mb-16">
      <div className="mb-4 flex items-center gap-2.5">
        {chapter && (
          <span className="font-mono text-xs font-medium tabular-nums text-primary">
            {chapter}
          </span>
        )}
        <span className="h-px w-6 bg-primary/40" />
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
          {eyebrow}
        </span>
      </div>
      <h2 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl">
        {title}
      </h2>
      {lead && (
        <p className="mt-4 text-lg leading-relaxed text-muted">{lead}</p>
      )}
    </div>
  )
}
