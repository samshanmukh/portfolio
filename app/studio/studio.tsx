'use client'

import { Box, Download, Loader2, Shuffle, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { AvatarConfig, AvatarHandle, FacialHair, Glasses, HairStyle, Mood } from '../components/avatar3d/scene'
import { useTypingGaze } from '../components/looking-memoji'
import { LiveAvatar } from '../components/live-avatar'
import { ThemeToggle } from '../components/theme-toggle'
import { buildAvatarHtml, saveFile } from './download'

// same values as DEFAULT_AVATAR in the scene (kept here so three.js stays lazy)
const SAM: AvatarConfig = {
  skin: '#d99a73',
  hair: '#120d0b',
  hairStyle: 'quiff',
  eyes: '#3a2316',
  facialHair: 'stubble',
  glasses: 'none',
}

const SKINS = ['#f6d3b8', '#ecbc98', '#d99a73', '#c68458', '#a86a43', '#8a5232', '#6b3c22', '#4a2816']
const HAIRS = ['#120d0b', '#3b2417', '#6a4127', '#a0662f', '#c9a063', '#e6cf9a', '#9c9c9c', '#b8432f']
const EYES = ['#3a2316', '#6b4423', '#3f6e8c', '#4f7a3e', '#7a7f86', '#1d1d1d']
const STYLES: HairStyle[] = ['quiff', 'crop', 'curly', 'long', 'buzz', 'bald']
const FACIAL: FacialHair[] = ['none', 'stubble', 'moustache', 'beard']
const GLASSES: Glasses[] = ['none', 'round', 'square']

const STORE = 'avatar-studio'
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)]
const label = (s: string) => s[0].toUpperCase() + s.slice(1)

export function Studio() {
  const [config, setConfig] = useState<AvatarConfig>(SAM)
  const [mood, setMood] = useState<Mood>('idle')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState<'html' | 'glb' | null>(null)
  const [error, setError] = useState('')
  const gaze = useTypingGaze()
  const avatar = useRef<AvatarHandle | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // remember the visitor's avatar between visits
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE)
      if (saved) setConfig({ ...SAM, ...JSON.parse(saved) })
    } catch {}
    return () => timers.current.forEach(clearTimeout)
  }, [])
  const update = (patch: Partial<AvatarConfig>) =>
    setConfig((c) => {
      const next = { ...c, ...patch }
      try {
        localStorage.setItem(STORE, JSON.stringify(next))
      } catch {}
      return next
    })

  const play = (seq: [Mood, number][]) => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    let at = 0
    for (const [m, ms] of seq) {
      timers.current.push(setTimeout(() => setMood(m), at))
      at += ms
    }
    timers.current.push(setTimeout(() => setMood('idle'), at))
  }

  const send = () => {
    if (!text.trim()) return
    setText('')
    gaze.onBlur()
    play([
      ['wink', 700],
      ['thinking', 1000],
      ['grin', 2600],
    ])
  }

  const download = async (kind: 'html' | 'glb') => {
    setBusy(kind)
    setError('')
    try {
      if (kind === 'html') saveFile(await buildAvatarHtml(config), 'my-avatar.html', 'text/html')
      else if (avatar.current) saveFile(await avatar.current.exportGLB(), 'my-avatar.glb', 'model/gltf-binary')
      else throw new Error('the 3D preview has not loaded yet')
    } catch (e) {
      setError(`Download failed: ${e instanceof Error ? e.message : 'unknown error'}`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="min-h-dvh px-4 pt-6 pb-16 sm:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="tap relative text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
          ← back to portfolio
        </Link>
        <ThemeToggle />
      </div>

      <div className="mx-auto mt-6 max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Avatar Studio</h1>
        <p className="mt-2 max-w-xl text-muted">
          Make a live 3D avatar, then download it as one HTML file that runs in any browser. It follows your cursor,
          watches you type, winks when you send and grins back.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          {/* preview */}
          <section className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-white/30 p-5 backdrop-blur-lg sm:p-8 lg:sticky lg:top-6 dark:bg-neutral-900/50">
            <div className="aspect-square w-full max-w-[360px]">
              <LiveAvatar
                looking={gaze.looking}
                keystrokes={gaze.keystrokes}
                mood={mood}
                config={config}
                fallback={null}
                alt="Your avatar preview"
                sizes="360px"
                onReady={(h) => (avatar.current = h)}
              />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="w-full max-w-md"
            >
              <input
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  gaze.onType()
                }}
                onFocus={gaze.onFocus}
                onBlur={gaze.onBlur}
                placeholder="Type something and press Enter…"
                aria-label="Talk to your avatar"
                className="w-full rounded-full border border-neutral-200 bg-white/60 px-5 py-3 text-base outline-none focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800"
              />
            </form>
            <div className="flex flex-wrap justify-center gap-2">
              {(
                [
                  ['Wink', [['wink', 900]]],
                  ['Think', [['thinking', 1800]]],
                  ['Grin', [['grin', 2200]]],
                ] as [string, [Mood, number][]][]
              ).map(([name, seq]) => (
                <button key={name} type="button" onClick={() => play(seq)} className={chip(false)}>
                  {name}
                </button>
              ))}
            </div>
          </section>

          {/* controls */}
          <section className="flex flex-col gap-6">
            <Group title="Skin">
              <Swatches colors={SKINS} value={config.skin} onPick={(skin) => update({ skin })} />
            </Group>
            <Group title="Hair">
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <button key={s} type="button" onClick={() => update({ hairStyle: s })} className={chip(config.hairStyle === s)}>
                    {label(s)}
                  </button>
                ))}
              </div>
              <Swatches colors={HAIRS} value={config.hair} onPick={(hair) => update({ hair })} />
            </Group>
            <Group title="Eyes">
              <Swatches colors={EYES} value={config.eyes} onPick={(eyes) => update({ eyes })} />
            </Group>
            <Group title="Facial hair">
              <div className="flex flex-wrap gap-2">
                {FACIAL.map((f) => (
                  <button key={f} type="button" onClick={() => update({ facialHair: f })} className={chip(config.facialHair === f)}>
                    {label(f)}
                  </button>
                ))}
              </div>
            </Group>
            <Group title="Glasses">
              <div className="flex flex-wrap gap-2">
                {GLASSES.map((g) => (
                  <button key={g} type="button" onClick={() => update({ glasses: g })} className={chip(config.glasses === g)}>
                    {label(g)}
                  </button>
                ))}
              </div>
            </Group>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  update({
                    skin: pick(SKINS),
                    hair: pick(HAIRS),
                    hairStyle: pick(STYLES),
                    eyes: pick(EYES),
                    facialHair: pick(FACIAL),
                    glasses: Math.random() < 0.3 ? pick(GLASSES) : 'none',
                  })
                }
                className={`${chip(false)} inline-flex items-center gap-1.5`}
              >
                <Shuffle className="h-4 w-4" /> Surprise me
              </button>
              <button type="button" onClick={() => update(SAM)} className={`${chip(false)} inline-flex items-center gap-1.5`}>
                <UserRound className="h-4 w-4" /> Start from Sam
              </button>
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
              <button
                type="button"
                disabled={!!busy}
                onClick={() => download('html')}
                className="glass-primary inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium disabled:opacity-70"
              >
                {busy === 'html' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download live avatar (.html)
              </button>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => download('glb')}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-white/40 px-5 py-3 text-sm font-medium backdrop-blur-lg transition hover:bg-white/70 disabled:opacity-70 dark:bg-neutral-900/50 dark:hover:bg-neutral-800"
              >
                {busy === 'glb' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Box className="h-4 w-4" />}
                3D model (.glb)
              </button>
            </div>
            <p className="-mt-3 text-xs text-muted">
              The HTML file runs on its own: open it, or drop it on any web host. The .glb is a still model for Blender,
              game engines or AR viewers.
            </p>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </section>
        </div>
      </div>
    </main>
  )
}

const chip = (on: boolean) =>
  `tap relative cursor-pointer rounded-full border px-4 py-1.5 text-sm transition ${
    on
      ? 'border-[#0171E3] bg-[#0171E3]/10 font-medium text-[#0171E3] dark:text-[#4da3ff]'
      : 'border-border bg-white/40 backdrop-blur-lg hover:bg-white/70 dark:bg-neutral-900/50 dark:hover:bg-neutral-800'
  }`

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{title}</h2>
      {children}
    </div>
  )
}

function Swatches({ colors, value, onPick }: { colors: string[]; value: string; onPick: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          aria-pressed={value === c}
          onClick={() => onPick(c)}
          className={`h-9 w-9 cursor-pointer rounded-full border border-black/10 shadow-sm transition hover:scale-110 dark:border-white/15 ${
            value === c ? 'ring-2 ring-[#0171E3] ring-offset-2 ring-offset-background' : ''
          }`}
          style={{ background: c }}
        />
      ))}
    </div>
  )
}
