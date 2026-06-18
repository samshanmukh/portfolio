export function SectionHeading({
  index,
  eyebrow,
  title,
}: {
  index: string
  eyebrow: string
  title: string
}) {
  return (
    <div className="mb-10">
      <div className="mb-2 flex items-center gap-3">
        <span className="font-mono text-xs text-muted">{index}</span>
        <span className="h-px w-8 bg-white/15" />
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          {eyebrow}
        </p>
      </div>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
    </div>
  )
}
