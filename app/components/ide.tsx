'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  profile,
  socials,
  projects,
  experience,
  skills,
  education,
  certifications,
  languages,
  gym,
} from '../lib/data'
import { PortfolioAgent } from './portfolio-agent'

// ── tiny syntax-token helpers (a code-editor look, not a real highlighter) ──
const cmt = (t: string) => <span className="text-muted/55">{t}</span>
const key = (t: string) => <span className="text-[#82aaff]">{t}</span>
const str = (t: string) => <span className="text-[#c3e88d]">{t}</span>
const kw = (t: string) => <span className="text-[#c792ea]">{t}</span>
const pun = (t: string) => <span className="text-muted/70">{t}</span>
const ext = (label: string, href: string) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary underline-offset-2 hover:underline"
  >
    {label}
  </a>
)

// ── file contents (generated from data.ts) ──────────────────────────────
function readmeLines(): ReactNode[] {
  return [
    <span key="h" className="font-display text-2xl font-medium text-foreground">
      # {profile.name}
    </span>,
    <span key="r" className="text-foreground/80">
      {profile.role} · {profile.location}
    </span>,
    '',
    <span key="b" className="text-foreground/80">
      {profile.headline}
    </span>,
    '',
    cmt('// look around — open a file in the sidebar:'),
    <span key="a">
      {pun('→')} about.md {pun('·')} projects.json {pun('·')} experience.ts{' '}
      {pun('·')} skills.json {pun('·')} contact.md
    </span>,
    '',
    cmt('// or talk to my agent in the terminal below:'),
    <span key="t">
      {pun('$')} ask {str('"what have you built?"')}
    </span>,
  ]
}

function aboutLines(): ReactNode[] {
  const sentences = profile.bio.split('. ').map((s, i, arr) => (i < arr.length - 1 ? s + '.' : s))
  return [
    cmt('<!-- about.md -->'),
    <span key="h" className="font-display text-xl text-foreground">
      ## Who I am
    </span>,
    '',
    ...sentences.map((s, i) => (
      <span key={i} className="text-foreground/80">
        {s}
      </span>
    )),
    '',
    <span key="look">
      {cmt('> ')}
      {profile.lookingFor}
    </span>,
  ]
}

function projectsLines(): ReactNode[] {
  const featured = projects.filter((p) => p.featured)
  const out: ReactNode[] = [pun('[')]
  featured.forEach((p, i) => {
    const comma = i < featured.length - 1 ? pun(',') : null
    out.push(
      <span>{pun('  {')}</span>,
      <span>
        {'    '}
        {key('"name"')}
        {pun(': ')}
        {ext(`"${p.name}"`, p.href)}
        {pun(',')}
      </span>,
      <span>
        {'    '}
        {key('"tags"')}
        {pun(': [')}
        {p.tags.map((t, j) => (
          <span key={t}>
            {str(`"${t}"`)}
            {j < p.tags.length - 1 ? pun(', ') : null}
          </span>
        ))}
        {pun('],')}
      </span>,
      ...(p.problem
        ? [
            <span>
              {'    '}
              {key('"problem"')}
              {pun(': ')}
              {str(`"${p.problem}"`)}
              {pun(',')}
            </span>,
          ]
        : []),
      ...(p.outcome
        ? [
            <span>
              {'    '}
              {key('"outcome"')}
              {pun(': ')}
              {str(`"${p.outcome}"`)}
            </span>,
          ]
        : []),
      <span>
        {pun('  }')}
        {comma}
      </span>
    )
  })
  out.push(pun(']'))
  out.push('')
  out.push(<span>{cmt('// + more at ')}{ext('github.com/samshanmukh', socials.github)}</span>)
  return out
}

function experienceLines(): ReactNode[] {
  const out: ReactNode[] = [
    <span>
      {kw('export const')} {key('experience')} {pun('= [')}
    </span>,
  ]
  experience.forEach((e, i) => {
    const comma = i < experience.length - 1 ? pun(',') : null
    out.push(
      <span>{pun('  {')}</span>,
      <span>
        {'    '}
        {key('role')}
        {pun(': ')}
        {str(`"${e.role}"`)}
        {pun(', ')}
        {key('company')}
        {pun(': ')}
        {str(`"${e.company}"`)}
        {pun(',')}
      </span>,
      <span>
        {'    '}
        {key('period')}
        {pun(': ')}
        {str(`"${e.period}"`)}
        {pun(',')}
      </span>,
      <span className="text-foreground/70">
        {'    '}
        {cmt(`// ${e.note}`)}
      </span>,
      <span>
        {pun('  }')}
        {comma}
      </span>
    )
  })
  out.push(pun(']'))
  out.push('')
  out.push(
    <span>
      {kw('const')} {key('education')} {pun('= ')}
      {str(education.map((e) => e.school).join(' · '))}
    </span>
  )
  out.push(
    <span>
      {kw('const')} {key('certs')} {pun('= ')}
      {cmt(`// ${certifications.length} AI/ML certifications`)}
    </span>
  )
  out.push(
    <span>
      {kw('const')} {key('languages')} {pun('= ')}
      {str(languages.join(', '))}
    </span>
  )
  return out
}

function skillsLines(): ReactNode[] {
  const out: ReactNode[] = [pun('{')]
  skills.forEach((g, i) => {
    out.push(
      <span>
        {'  '}
        {key(`"${g.group}"`)}
        {pun(': [')}
      </span>,
      <span>
        {'    '}
        {g.items.map((it, j) => (
          <span key={it}>
            {str(`"${it}"`)}
            {j < g.items.length - 1 ? pun(', ') : null}
          </span>
        ))}
      </span>,
      <span>
        {'  ]'}
        {i < skills.length - 1 ? pun(',') : null}
      </span>
    )
  })
  out.push(pun('}'))
  return out
}

function gymLines(): ReactNode[] {
  return [
    cmt('<!-- gym.md -->'),
    <span className="font-display text-xl text-foreground">## {gym.tagline}</span>,
    '',
    <span className="text-foreground/80">{gym.blurb}</span>,
    '',
    ...gym.stats.map((s) => (
      <span key={s.label}>
        {pun('- ')}
        {key(s.label)}
        {pun(': ')}
        {str(s.value)}
      </span>
    )),
  ]
}

function contactLines(): ReactNode[] {
  return [
    <span className="font-display text-xl text-foreground"># Let’s deploy something</span>,
    '',
    <span className="text-foreground/80">
      Hiring an FDE, collaborating, or want to talk shop about shipping AI to
      production? I reply within a day.
    </span>,
    '',
    <span>
      {key('email')}
      {pun(':    ')}
      {ext(socials.email, `mailto:${socials.email}`)}
    </span>,
    <span>
      {key('github')}
      {pun(':   ')}
      {ext(socials.github, socials.github)}
    </span>,
    <span>
      {key('linkedin')}
      {pun(': ')}
      {ext(socials.linkedin, socials.linkedin)}
    </span>,
    <span>
      {key('resume')}
      {pun(':   ')}
      {ext(socials.resume, socials.resume)}
    </span>,
  ]
}

type FileDef = {
  key: string
  name: string
  dot: string // file-type accent color
  lines: () => ReactNode[]
}

const FILES: FileDef[] = [
  { key: 'readme', name: 'README.md', dot: '#519aba', lines: readmeLines },
  { key: 'about', name: 'about.md', dot: '#519aba', lines: aboutLines },
  { key: 'projects', name: 'projects.json', dot: '#cbcb41', lines: projectsLines },
  { key: 'experience', name: 'experience.ts', dot: '#519aba', lines: experienceLines },
  { key: 'skills', name: 'skills.json', dot: '#cbcb41', lines: skillsLines },
  { key: 'gym', name: 'gym.md', dot: '#519aba', lines: gymLines },
  { key: 'contact', name: 'contact.md', dot: '#519aba', lines: contactLines },
]

// ── editor with a line-number gutter ─────────────────────────────────────
function Editor({ lines }: { lines: ReactNode[] }) {
  return (
    <div className="min-h-full font-mono text-[13px] leading-6">
      {lines.map((ln, i) => (
        <div key={i} className="flex hover:bg-white/[0.02]">
          <span className="w-12 shrink-0 select-none pr-4 text-right text-muted/35">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1 whitespace-pre-wrap break-words pr-4">
            {ln === '' ? ' ' : ln}
          </div>
        </div>
      ))}
    </div>
  )
}

function NowPlayingStatus() {
  const [t, setT] = useState<{ isPlaying: boolean; title?: string; artist?: string }>({
    isPlaying: false,
  })
  useEffect(() => {
    let on = true
    const load = async () => {
      try {
        const r = await fetch('/api/now-playing')
        if (r.ok && on) setT(await r.json())
      } catch {
        /* ignore */
      }
    }
    load()
    const id = setInterval(load, 30000)
    return () => {
      on = false
      clearInterval(id)
    }
  }, [])
  if (!t.isPlaying) return null
  return (
    <span className="hidden items-center gap-1 sm:inline-flex">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-on-primary/80" />♪{' '}
      {t.title} — {t.artist}
    </span>
  )
}

// ── the IDE ──────────────────────────────────────────────────────────────
export function Ide() {
  const [open, setOpen] = useState<string[]>(['readme', 'projects'])
  const [active, setActive] = useState('readme')
  const [sidebar, setSidebar] = useState(true)
  const [panel, setPanel] = useState(true)
  const [theme, setTheme] = useState<'mono' | 'gold'>('mono')
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTheme((localStorage.getItem('theme') as 'mono' | 'gold') || 'mono')
  }, [])
  const flipTheme = () => {
    const next = theme === 'mono' ? 'gold' : 'mono'
    setTheme(next)
    document.documentElement.dataset.theme = next === 'gold' ? 'gold' : ''
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* ignore */
    }
  }

  const openFile = (k: string) => {
    setOpen((prev) => (prev.includes(k) ? prev : [...prev, k]))
    setActive(k)
    if (window.innerWidth < 640) setSidebar(false)
    editorRef.current?.scrollTo({ top: 0 })
  }
  const closeTab = (k: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen((prev) => {
      const next = prev.filter((x) => x !== k)
      if (active === k) setActive(next[next.length - 1] ?? '')
      return next
    })
  }

  const activeFile = FILES.find((f) => f.key === active)

  return (
    <div className="fixed inset-0 z-0 flex flex-col bg-[#0b0b0d] text-foreground">
      {/* title bar */}
      <div className="flex h-9 shrink-0 items-center gap-3 border-b border-white/8 bg-[#0a0a0c] px-3 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <button
          onClick={() => setSidebar((v) => !v)}
          className="rounded px-1.5 py-0.5 transition-colors hover:bg-white/10 sm:hidden"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <span className="mx-auto truncate font-mono">
          {profile.name} — portfolio — VS Code
        </span>
      </div>

      {/* body */}
      <div className="flex min-h-0 flex-1">
        {/* activity bar */}
        <div className="hidden w-11 shrink-0 flex-col items-center gap-5 border-r border-white/8 bg-[#08080a] py-3 text-muted sm:flex">
          {['▢', '⌕', '⑂', '▷', '⊞'].map((g, i) => (
            <span
              key={i}
              className={`text-lg ${i === 0 ? 'text-foreground' : 'text-muted/50'}`}
            >
              {g}
            </span>
          ))}
        </div>

        {/* sidebar / explorer */}
        {sidebar && (
          <div className="w-56 shrink-0 overflow-y-auto border-r border-white/8 bg-[#0e0e11]">
            <div className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted/70">
              Explorer
            </div>
            <div className="px-2 pb-1 font-mono text-xs">
              <div className="flex items-center gap-1 px-2 py-1 text-foreground/80">
                <span className="text-muted/60">▾</span> sam-karri
              </div>
              {FILES.map((f) => (
                <button
                  key={f.key}
                  onClick={() => openFile(f.key)}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1 pl-6 text-left transition-colors hover:bg-white/[0.05] ${
                    active === f.key ? 'bg-white/[0.06] text-foreground' : 'text-foreground/70'
                  }`}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-[2px]"
                    style={{ background: f.dot }}
                  />
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* editor area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* tabs */}
          <div className="flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-white/8 bg-[#0a0a0c]">
            {open.map((k) => {
              const f = FILES.find((x) => x.key === k)
              if (!f) return null
              return (
                <button
                  key={k}
                  onClick={() => setActive(k)}
                  className={`group flex items-center gap-2 border-r border-white/8 px-3 font-mono text-xs ${
                    active === k
                      ? 'bg-[#0b0b0d] text-foreground'
                      : 'bg-[#0a0a0c] text-muted hover:text-foreground/80'
                  }`}
                >
                  <span className="h-2 w-2 rounded-[2px]" style={{ background: f.dot }} />
                  {f.name}
                  <span
                    onClick={(e) => closeTab(k, e)}
                    className="ml-1 rounded px-1 text-muted/50 opacity-0 hover:bg-white/10 hover:text-foreground group-hover:opacity-100"
                  >
                    ✕
                  </span>
                </button>
              )
            })}
          </div>

          {/* editor + terminal */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div ref={editorRef} className="min-h-0 flex-1 overflow-auto bg-[#0b0b0d] px-3 py-3">
              {activeFile ? (
                <Editor lines={activeFile.lines()} />
              ) : (
                <div className="flex h-full items-center justify-center font-mono text-sm text-muted">
                  Select a file from the explorer ←
                </div>
              )}
            </div>

            {panel && (
              <div className="flex h-[42%] min-h-[200px] shrink-0 flex-col border-t border-white/8 bg-[#0a0a0c]">
                <div className="flex h-8 shrink-0 items-center gap-4 border-b border-white/8 px-3 font-mono text-[11px] uppercase tracking-wider">
                  <span className="text-muted/50">Problems</span>
                  <span className="text-muted/50">Output</span>
                  <span className="border-b-2 border-primary pb-[7px] pt-2 text-foreground">
                    Agent
                  </span>
                  <button
                    onClick={() => setPanel(false)}
                    className="ml-auto text-muted/60 hover:text-foreground"
                    aria-label="Close panel"
                  >
                    ✕
                  </button>
                </div>
                <div className="min-h-0 flex-1 p-2">
                  <PortfolioAgent />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* status bar */}
      <div className="flex h-6 shrink-0 items-center gap-3 bg-primary px-3 font-mono text-[11px] text-on-primary">
        <span className="flex items-center gap-1">⎇ main</span>
        <span className="hidden sm:inline">FDE · {profile.location}</span>
        <div className="ml-auto flex items-center gap-3">
          <NowPlayingStatus />
          {!panel && (
            <button onClick={() => setPanel(true)} className="hover:underline">
              ▸ terminal
            </button>
          )}
          <button onClick={flipTheme} className="hover:underline" title="Switch palette">
            ◑ {theme === 'mono' ? 'mono' : 'gold'}
          </button>
          <a
            href={socials.sourceRepo}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            ★ star on GitHub
          </a>
        </div>
      </div>
    </div>
  )
}
