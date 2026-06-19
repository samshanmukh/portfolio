'use client'

import { useCallback, useRef, useState } from 'react'
import { SectionHeading } from './section-heading'

// Real-time voice coach powered by xAI Grok Realtime (grok-voice-think-fast-1.0).
// Browser ↔ WebSocket streams PCM16 @ 24kHz; the key stays server-side (token).

const SAMPLE_RATE = 24000
const VOICE_MODEL = 'grok-voice-think-fast-1.0'
const VOICE = 'Eve'
const INSTRUCTIONS = `You are Sam's AI gym coach — energetic, warm, and a little funny. Keep replies SHORT and punchy (1–2 sentences), like a real coach between sets. Give practical cues on form, effort, rest, and breathing. Open by hyping the user up in one line, then have a natural back-and-forth. Never be rude.`

type Status = 'idle' | 'connecting' | 'live' | 'error'

function toBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength)
  const CHUNK = 0x2000
  const parts: string[] = []
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK))))
  }
  return btoa(parts.join(''))
}
function toFloat32(base64: string): Float32Array {
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const int16 = new Int16Array(bytes.buffer)
  const f = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) f[i] = int16[i] / 32768
  return f
}

export function VoiceCoach() {
  const wsRef = useRef<WebSocket | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const srcRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const nextPlayRef = useRef(0)
  const sourcesRef = useRef<AudioBufferSourceNode[]>([])
  const closingRef = useRef(false)

  const [status, setStatus] = useState<Status>('idle')
  const [speaking, setSpeaking] = useState(false)
  const [youSaid, setYouSaid] = useState('')
  const [err, setErr] = useState('')

  const interrupt = useCallback(() => {
    for (const s of sourcesRef.current) {
      try {
        s.stop()
      } catch {}
    }
    sourcesRef.current = []
    nextPlayRef.current = 0
    setSpeaking(false)
  }, [])

  const play = useCallback((b64: string) => {
    const ctx = ctxRef.current
    if (!ctx) return
    const f = toFloat32(b64)
    const buf = ctx.createBuffer(1, f.length, SAMPLE_RATE)
    buf.getChannelData(0).set(f)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    const start = Math.max(ctx.currentTime, nextPlayRef.current)
    src.start(start)
    nextPlayRef.current = start + buf.duration
    setSpeaking(true)
    sourcesRef.current.push(src)
    src.onended = () => {
      sourcesRef.current = sourcesRef.current.filter((s) => s !== src)
      if (sourcesRef.current.length === 0) setSpeaking(false)
    }
  }, [])

  const stop = useCallback(() => {
    closingRef.current = true
    workletRef.current?.disconnect()
    srcRef.current?.disconnect()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    interrupt()
    ctxRef.current?.close()
    wsRef.current?.close()
    workletRef.current = null
    srcRef.current = null
    streamRef.current = null
    ctxRef.current = null
    wsRef.current = null
    setStatus('idle')
    setSpeaking(false)
  }, [interrupt])

  const start = useCallback(async () => {
    setErr('')
    setYouSaid('')
    closingRef.current = false
    setStatus('connecting')
    try {
      const ctx = new AudioContext({ sampleRate: SAMPLE_RATE })
      if (ctx.state === 'suspended') await ctx.resume()
      ctxRef.current = ctx

      const tokRes = await fetch('/api/grok-voice-token', { method: 'POST' })
      const tok = await tokRes.json()
      if (!tokRes.ok || !tok.token) throw new Error(tok.error || 'Could not start voice (no token)')

      const ws = new WebSocket(
        `wss://api.x.ai/v1/realtime?model=${VOICE_MODEL}`,
        [`xai-client-secret.${tok.token}`]
      )
      wsRef.current = ws

      const startMic = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: SAMPLE_RATE },
        })
        streamRef.current = stream
        await ctx.audioWorklet.addModule('/pcm-processor-worklet.js')
        const source = ctx.createMediaStreamSource(stream)
        srcRef.current = source
        const worklet = new AudioWorkletNode(ctx, 'pcm-processor')
        workletRef.current = worklet
        worklet.port.onmessage = (e: MessageEvent<Int16Array>) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: toBase64(e.data) }))
          }
        }
        source.connect(worklet)
      }

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'session.update',
            session: {
              voice: VOICE,
              instructions: INSTRUCTIONS,
              turn_detection: { type: 'server_vad' },
              input_audio_transcription: { model: 'grok-2-audio' },
              audio: {
                input: { format: { type: 'audio/pcm', rate: SAMPLE_RATE } },
                output: { format: { type: 'audio/pcm', rate: SAMPLE_RATE } },
              },
            },
          })
        )
      }

      let ready = false
      ws.onmessage = async ({ data }) => {
        let msg: Record<string, unknown>
        try {
          msg = JSON.parse(data as string)
        } catch {
          return
        }
        switch (msg.type) {
          case 'session.updated': {
            if (!ready) {
              ready = true
              await startMic()
              setStatus('live')
              // coach greets first
              ws.send(JSON.stringify({ type: 'response.create' }))
            }
            break
          }
          case 'input_audio_buffer.speech_started':
            interrupt() // barge-in: user started talking
            break
          case 'response.output_audio.delta':
            play(msg.delta as string)
            break
          case 'conversation.item.input_audio_transcription.delta':
            setYouSaid((p) => p + ((msg.delta as string) ?? ''))
            break
          case 'conversation.item.input_audio_transcription.completed':
            setYouSaid((msg.transcript as string) ?? '')
            break
          case 'error':
            console.error('[grok-voice]', msg.error)
            setErr((msg.error as { message?: string })?.message || 'Grok Voice error')
            break
        }
      }
      ws.onerror = () => {
        if (!closingRef.current) {
          setErr('Connection to Grok Voice failed.')
          setStatus('error')
        }
      }
      ws.onclose = () => {
        if (!closingRef.current) setStatus('idle')
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : 'failed to start'
      setErr(m.includes('NotAllowed') ? 'Microphone permission denied.' : m)
      setStatus('error')
      stop()
    }
  }, [interrupt, play, stop])

  return (
    <section id="voice" className="scroll-mt-24 py-16">
      <div className="wrap">
        <SectionHeading
          eyebrow="Live demo · real-time voice"
          title="Talk to my AI coach — in Grok's voice"
        />
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-white/10 bg-surface p-8">
            <div className="relative flex h-40 w-40 items-center justify-center">
              <div
                className={`absolute rounded-full bg-primary/20 transition-transform duration-200 ${
                  speaking ? 'scale-110' : status === 'live' ? 'scale-90' : 'scale-75'
                }`}
                style={{ width: '100%', height: '100%' }}
              />
              <button
                onClick={status === 'idle' || status === 'error' ? start : stop}
                disabled={status === 'connecting'}
                aria-label={status === 'live' ? 'Stop' : 'Start voice coach'}
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#dcbb8e] text-3xl text-[#1c130a] shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
              >
                {status === 'live' ? '◼' : '🎙'}
              </button>
            </div>
            <p className="font-mono text-xs text-muted">
              {status === 'connecting'
                ? 'connecting to Grok…'
                : status === 'live'
                  ? speaking
                    ? 'coach speaking…'
                    : 'listening — just talk'
                  : status === 'error'
                    ? 'tap to retry'
                    : 'tap to start'}
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-surface p-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">you said</p>
              <p className="mt-1 min-h-[1.5rem] text-foreground/80">{youSaid || '—'}</p>
            </div>
            {err && <p className="text-sm text-red-400/90">{err}</p>}
            <ul className="space-y-1.5 text-sm text-muted">
              <li>› Real-time speech-to-speech via xAI Grok Realtime ({VOICE_MODEL})</li>
              <li>
                › The voice you hear is{' '}
                <span className="text-foreground">actual Grok voice</span> — my{' '}
                <a
                  href="https://github.com/samshanmukh/voicecoach-grok"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  VoiceCoach
                </a>{' '}
                project
              </li>
            </ul>
            <p className="text-xs text-muted/80">
              🎧 Use headphones for best results. Your mic audio streams to xAI to power the live
              coach (this one isn&apos;t on-device).
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
