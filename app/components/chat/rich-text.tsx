import { Fragment, type ReactNode } from 'react'

// Light markdown for smart mode replies: **bold**, "- " bullet lists, [label](url)
// links, and bare URLs shown as short clickable labels (closespan.com). Builds React
// nodes, never raw HTML, so model output can't inject markup.

const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+[^\s).,!?;:])/g

const shortUrl = (url: string) => {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    const path = u.pathname.replace(/\/$/, '')
    // github.com/samshanmukh/RepRight reads better as the repo name
    if (host === 'github.com' && path.split('/').length >= 3) return path.split('/').slice(-1)[0]
    return host + (path && path.length <= 20 ? path : '')
  } catch {
    return url
  }
}

function Link({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-foreground/30 underline-offset-2 hover:decoration-foreground">
      {children}
    </a>
  )
}

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1]) out.push(<strong key={m.index} className="font-semibold">{m[1]}</strong>)
    else if (m[2]) out.push(<Link key={m.index} href={m[3]}>{m[2]}</Link>)
    else out.push(<Link key={m.index} href={m[4]}>{shortUrl(m[4])}</Link>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

const BULLET = /^\s*[-*•]\s+/

export function RichText({ text }: { text: string }) {
  // "**Name** – blurb" reads better as "**Name**: blurb"
  const lines = text.replace(/\*\*(.+?)\*\*\s+[–-]\s+/g, '**$1**: ').replace(/\s+[–-]\s+(?=https?:)/g, ' · ')
    // the list has its own spacing, so drop blank lines around it
    .replace(/\n{2,}(?=\s*[-*•]\s)/g, '\n')
    .split('\n')
  const blocks: ReactNode[] = []
  let list: string[] = []
  const flush = () => {
    if (!list.length) return
    blocks.push(
      <ul key={`ul${blocks.length}`} className="my-1 list-disc space-y-1 pl-5">
        {list.map((l, i) => (
          <li key={i}>{inline(l)}</li>
        ))}
      </ul>
    )
    list = []
  }
  lines.forEach((line, i) => {
    if (BULLET.test(line)) return list.push(line.replace(BULLET, ''))
    if (list.length && !line.trim()) return
    flush()
    blocks.push(
      <Fragment key={i}>
        {inline(line)}
        {i < lines.length - 1 && '\n'}
      </Fragment>
    )
  })
  flush()
  return <>{blocks}</>
}
