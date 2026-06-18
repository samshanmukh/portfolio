export function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string
  title: string
}) {
  return (
    <div className="mb-10">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-px w-6 bg-primary/60" />
        <span className="font-mono text-xs uppercase tracking-widest text-primary">
          {eyebrow}
        </span>
      </div>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
    </div>
  )
}
