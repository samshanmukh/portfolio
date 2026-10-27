'use client'

import { Check, Copy, Download, ExternalLink, LoaderCircle, Pause, Play, RefreshCw, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { BOTMOJI_ROLES, BOTMOJI_STATES, botmojiInspirations, botmojiPrompt, createBotmojiConfig, profileUrlWithScheme, type BotmojiConfig, type BotmojiProfile, type BotmojiRole } from '../../lib/botmoji'
import { BOTMOJI_ARTWORK_NAMES, botmojiArtwork } from '../../lib/botmoji-artwork'
import { exportBotmojiGif } from '../../lib/botmoji-render'
import { BotmojiPreview } from '../botmoji-preview'

const field = 'w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-50'
const button = 'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-50'

const demoBotmojis = [
  { name: 'Ari', headline: 'Product designer building accessible interfaces' },
  { name: 'Kai', headline: 'Software engineer building AI and data tools' },
  { name: 'Jules', headline: 'Product manager working on sustainable energy' },
].map((person, i) => createBotmojiConfig({ ...person, role: (['designer', 'engineer', 'product'] as const)[i], source: 'pasted' }))

export function Botmoji({ initialUrl }: { initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl || '')
  const [pasted, setPasted] = useState(false)
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [profile, setProfile] = useState<BotmojiProfile | null>(null)
  const [config, setConfig] = useState<BotmojiConfig | null>(null)
  const [busy, setBusy] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState(false)
  const [copyFallback, setCopyFallback] = useState('')
  const [state, setState] = useState<number | undefined>()
  const [showPrompt, setShowPrompt] = useState(false)
  const autoStarted = useRef(false)
  const mounted = useRef(true)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; if (copyTimer.current) clearTimeout(copyTimer.current) }
  }, [])

  async function create(profileUrl = url) {
    const completedUrl = profileUrlWithScheme(profileUrl)
    setUrl(completedUrl)
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/botmoji/profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: completedUrl, name, text: pasted ? text : '' }), signal: AbortSignal.timeout(18_000),
      })
      const data = await response.json()
      if (!mounted.current) return
      if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      if (data.needsText) {
        setPasted(true)
        setNotice(data.message)
      } else if (data.profile) {
        const p = data.profile as BotmojiProfile
        setProfile(p)
        setConfig(createBotmojiConfig(p))
        setState(undefined)
        setPaused(false)
        setCopied(false)
      }
    } catch (err) {
      if (mounted.current) setError(err instanceof Error && err.name !== 'TimeoutError' ? err.message : 'That took a little too long. Try again, or paste your headline instead.')
    } finally { if (mounted.current) setBusy(false) }
  }

  useEffect(() => {
    if (initialUrl && !autoStarted.current) { autoStarted.current = true; void create(initialUrl) }
    // Only a new card's incoming URL starts a lookup automatically.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl])

  async function copy(value: string) {
    setError('')
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setCopyFallback('')
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopyFallback(value)
      setNotice('Clipboard access is unavailable. Select and copy the text below.')
    }
  }

  async function download() {
    if (!config) return
    setExporting(true)
    setExportProgress(0)
    setError('')
    try {
      const blob = await exportBotmojiGif(config, (percent) => { if (mounted.current) setExportProgress(percent) })
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `${config.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50) || 'my'}-botmoji.gif`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000)
    } catch { setError('The GIF could not export. Please try again.') }
    finally { setExporting(false) }
  }

  const submit = (event: FormEvent) => { event.preventDefault(); void create() }
  const role = config ? BOTMOJI_ROLES[config.role] : null
  return (
    <section aria-label="Bot moji creator" className="overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5"><span className="rounded-full bg-primary/10 p-2 text-primary"><Sparkles size={17} /></span><div><h2 className="text-sm font-semibold">A little more you.</h2><p className="text-xs text-muted">Your work. Your personality. Your bot moji.</p></div></div>
        {config && <button type="button" className="cursor-pointer text-xs text-muted underline underline-offset-4 hover:text-foreground" onClick={() => { setConfig(null); setProfile(null); setError(''); setNotice(''); setCopyFallback('') }}>Start over</button>}
      </div>
      {!config ? (
        <form onSubmit={submit} className="space-y-4 p-5">
          <div className="flex h-28 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-black/70 dark:bg-black/25">
            {demoBotmojis.map((demo) => <div key={demo.name} className="h-28 w-28"><BotmojiPreview config={demo} state={0} compact /></div>)}
          </div>
          <div><h3 className="font-medium">First, a little about you.</h3><p className="mt-1 text-sm leading-relaxed text-muted">Share your LinkedIn or GitHub profile. I’ll turn your public headline, skills, and work into a unique fluffy character, with personal fur colors and expressions.</p></div>
          <label className="block text-xs font-medium">Profile URL<input type="text" inputMode="url" autoComplete="url" placeholder="linkedin.com/in/your-name" value={url} onChange={(e) => setUrl(e.target.value)} onBlur={() => setUrl((value) => profileUrlWithScheme(value))} disabled={busy} maxLength={300} className={`${field} mt-2`} /></label>
          <button type="button" onClick={() => { setPasted(!pasted); setNotice('') }} aria-expanded={pasted} disabled={busy} className="cursor-pointer text-xs text-primary underline underline-offset-4">{pasted ? 'Use just my profile link' : 'Or tell me about yourself instead'}</button>
          {pasted && <div className="space-y-3"><label className="block text-xs font-medium">Your name<input className={`${field} mt-2`} value={name} onChange={(e) => setName(e.target.value)} maxLength={70} placeholder="Alex" autoComplete="given-name" required disabled={busy} /></label><label className="block text-xs font-medium">Headline or bio<textarea className={`${field} mt-2 min-h-24 resize-y`} placeholder="Product designer who loves thoughtful interfaces, typography, and making complex things feel simple." value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} required disabled={busy} /></label></div>}
          <button disabled={busy || (!url.trim() && !text.trim())} type="submit" className={`${button} w-full border-transparent bg-foreground text-background hover:bg-foreground/85`}>
            {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}{busy ? (pasted ? 'Personalizing your bot moji…' : 'Reading your public profile…') : 'Make my bot moji'}
          </button>
          <p className="text-[11px] leading-relaxed text-muted">No sign-in needed. LinkedIn may block profile imports even for public profiles. You can paste your headline instead. Your profile details aren’t saved.</p>
        </form>
      ) : (
        <div className="p-4 sm:p-5">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div><BotmojiPreview config={config} state={state} paused={paused} onError={setError} /><div className="mt-2 flex flex-wrap justify-center gap-1" aria-label="Expression"><button type="button" onClick={() => { setState(undefined); setPaused(false) }} aria-pressed={state === undefined} className={`cursor-pointer rounded-full px-2.5 py-1.5 text-[11px] ${state === undefined ? 'bg-foreground text-background' : 'bg-accent text-muted'}`}>Loop</button>{BOTMOJI_STATES.map((label, i) => <button type="button" key={label} onClick={() => { setState(i); setPaused(false) }} aria-pressed={state === i} className={`cursor-pointer rounded-full px-2.5 py-1.5 text-[11px] ${state === i ? 'bg-foreground text-background' : 'bg-accent text-muted'}`}>{label}</button>)}</div><div className="mt-3 flex items-center justify-center gap-2"><button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? 'Play bot moji animation' : 'Pause bot moji animation'} aria-pressed={paused} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted hover:bg-accent">{paused ? <Play size={12} /> : <Pause size={12} />}{paused ? 'Play' : 'Pause'}</button><span className="text-[10px] text-muted">Tap your bot to jump and spin.</span></div></div>

            <div className="space-y-4">
              <div><p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">Made for your world</p><h3 className="mt-1 text-xl font-semibold">Meet your little sidekick.</h3><p className="mt-2 text-xs leading-relaxed text-muted">{profile?.source === 'pasted' ? 'Inspired by the headline you shared.' : `Inspired by your public ${profile?.source === 'linkedin' ? 'LinkedIn' : 'GitHub'} profile.`} Your work inspires the fur palette and plush shape. The soft fur, glossy eyes, and expressions come from our plush character artwork.</p></div>
              <div className="flex flex-wrap gap-1.5">{role?.traits.map((trait) => <span key={trait} className="rounded-full border border-border px-2.5 py-1 text-[10px] text-muted">{trait}</span>)}</div>
              <label className="block text-xs font-medium">Name<input className={`${field} mt-1.5 py-2`} maxLength={32} value={config.name} onChange={(e) => setConfig({ ...config, name: e.target.value })} onBlur={() => { if (!config.name.trim()) setConfig({ ...config, name: 'Your' }) }} /></label>
              <label className="block text-xs font-medium">Your world<select className={`${field} mt-1.5 py-2`} value={config.role} onChange={(e) => { if (profile) setConfig({ ...createBotmojiConfig(profile, config.variation, e.target.value as BotmojiRole), name: config.name }) }}>{Object.entries(BOTMOJI_ROLES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label>
              <label className="block text-xs font-medium">Plush character<select className={`${field} mt-1.5 py-2`} value={botmojiArtwork(config.role, config.design.seed, config.design.artwork)} onChange={(e) => setConfig({ ...config, design: { ...config.design, artwork: Number(e.target.value) } })}>{BOTMOJI_ARTWORK_NAMES.map((label,i) => <option key={label} value={i}>{label}</option>)}</select></label>
              <button type="button" className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted hover:text-foreground" onClick={() => { if (profile) setConfig({ ...createBotmojiConfig(profile, config.variation + 1, config.role), name: config.name }) }}><RefreshCw size={12} />Remix my design</button>
            </div>
          </div>
          {profile?.headline && <div className="mt-4 rounded-xl border border-border bg-background px-3 py-3"><p className="text-[10px] font-medium uppercase tracking-wider text-muted">What inspired your design</p><p className="mt-1 line-clamp-2 text-xs leading-relaxed">{profile.headline}</p><ul className="mt-3 space-y-1.5">{botmojiInspirations(profile, config.role).map((inspiration) => <li key={inspiration.from} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted"><Sparkles size={12} className="mt-0.5 shrink-0 text-primary" /><span><span className="font-medium text-foreground">{inspiration.from}</span> → {inspiration.detail}</span></li>)}</ul>{profile.profileUrl && <a href={profile.profileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary">View profile<ExternalLink size={10} /></a>}</div>}
          <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            <button type="button" className={`${button} border-transparent bg-foreground text-background hover:bg-foreground/85`} disabled={exporting || !config.name.trim()} onClick={download}>{exporting ? <LoaderCircle className="animate-spin" size={15} /> : <Download size={15} />}{exporting ? `Exporting ${exportProgress}%` : 'Download GIF'}</button>
            <button type="button" className={button} onClick={() => copy(botmojiPrompt(config, profile?.headline || ''))}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied!' : 'Copy prompt'}</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-4"><button type="button" onClick={() => setShowPrompt(!showPrompt)} aria-expanded={showPrompt} className="cursor-pointer text-xs text-muted underline underline-offset-4">{showPrompt ? 'Hide' : 'Preview'} generation prompt</button></div>
          {showPrompt && <p className="mt-2 rounded-xl bg-background p-3 text-xs leading-relaxed text-muted">{botmojiPrompt(config, profile?.headline || '')}</p>}
        </div>
      )}
      {notice && <p role="status" className="mx-5 mb-4 text-xs leading-relaxed text-muted">{notice}</p>}
      {copied && <p role="status" className="sr-only">Prompt copied to clipboard</p>}
      {error && <p role="alert" className="mx-5 mb-4 rounded-xl bg-red-500/10 p-3 text-xs leading-relaxed text-red-600 dark:text-red-400">{error}</p>}
      {copyFallback && <textarea aria-label="Select and copy this text" readOnly value={copyFallback} onFocus={(e) => e.target.select()} className="mx-5 mb-5 min-h-32 w-[calc(100%-2.5rem)] rounded-xl border border-border bg-background p-3 text-xs" />}
    </section>
  )
}
