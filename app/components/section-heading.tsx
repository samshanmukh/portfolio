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
    <div className="mb-10 max-w-2xl">
      <div className="mb-3 flex items-center gap-2.5">
        {chapter && (
          <span className="font-mono text-xs font-medium tabular-nums text-primary/90">
            {chapter}
          </span>
        )}
        <span className="h-px w-6 bg-primary/50" />
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </span>
      </div>
      <h2 className="font-display text-3xl leading-[1.1] text-foreground sm:text-4xl">
        {title}
      </h2>
      {lead && (
        <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
          {lead}
        </p>
      )}
    </div>
  )
}
