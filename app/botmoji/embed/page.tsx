'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { BotmojiPreview } from '../../components/botmoji-preview'
import { BOTMOJI_ROLES, createBotmojiConfig, parseBotmojiDesign, type BotmojiConfig, type BotmojiRole } from '../../lib/botmoji'

function EmbeddedBotmoji() {
  const params = useSearchParams()
  const rawRole = params.get('role') || 'other'
  const role: BotmojiRole = Object.hasOwn(BOTMOJI_ROLES, rawRole) ? rawRole as BotmojiRole : 'other'
  const name = (params.get('name') || 'Your').slice(0, 32)
  const rawVariation = Number(params.get('variation') ?? 0)
  const variation = Number.isInteger(rawVariation) && rawVariation >= 0 && rawVariation < 10_000 ? rawVariation : 0
  const fallback = createBotmojiConfig({ name, role, headline: '', source: 'pasted' }, variation)
  const config: BotmojiConfig = { ...fallback, design: parseBotmojiDesign(params.get('design')) ?? fallback.design }
  return <main className="flex min-h-dvh items-center justify-center bg-transparent p-2"><style>{'html, body { background: transparent !important; }'}</style><div className="w-full max-w-sm"><BotmojiPreview config={config} /><a href="/chat?query=Make%20my%20bot%20moji" target="_blank" rel="noopener noreferrer" className="mt-1 block text-center text-[10px] text-zinc-400">Make your own bot moji ↗</a></div></main>
}

export default function BotmojiEmbedPage() {
  return <Suspense fallback={<div className="min-h-dvh bg-transparent" />}><EmbeddedBotmoji /></Suspense>
}
