export function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string
  title: string
}) {
  return (
    <div className="mb-10">
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-indigo-400">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
    </div>
  )
}
