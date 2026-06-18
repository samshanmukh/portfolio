/** A terminal command line used as a section heading: `sam@portfolio:~$ <cmd>` */
export function Prompt({
  command,
  comment,
}: {
  command: string
  comment?: string
}) {
  return (
    <div className="mb-8">
      <div className="text-sm">
        <span className="text-primary">sam@portfolio</span>
        <span className="text-muted">:</span>
        <span className="text-foreground/60">~</span>
        <span className="text-muted">$ </span>
        <span className="text-foreground">{command}</span>
      </div>
      {comment && (
        <div className="mt-1.5 text-xs text-muted">
          <span className="text-muted/60"># </span>
          {comment}
        </div>
      )}
    </div>
  )
}
