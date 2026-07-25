// Voice for the guided tour. Prefers Grok's realtime voice (xAI) — playback
// only, no mic — and falls back to the browser's speechSynthesis, then silence.
// Reuses the same ephemeral-token route + realtime patterns as the AI trainer.

const SAMPLE_RATE = 24000
const VOICE_MODEL = 'grok-voice-think-fast-1.0'
const VOICE = 'rex' // male voice (xAI: rex = confident/clear; leo = authoritative)

// Best-effort male voice for the speechSynthesis fallback.
function pickMaleVoice(): SpeechSynthesisVoice | null {
  const vs = window.speechSynthesis?.getVoices?.() ?? []
  return (
    vs.find((v) => /\bmale\b/i.test(v.name) && !/female/i.test(v.name)) ||
    vs.find((v) =>
      /(daniel|alex|fred|rishi|aaron|arthur|gordon|oliver|reed|google uk english male|microsoft (david|mark|guy))/i.test(
        v.name
      )
    ) ||
    null
  )
}
const INSTRUCTIONS =
  'You are a narrator voicing the user. Read each user message aloud VERBATIM as natural, warm speech — do not add, remove, rephrase, or reply to anything. Speak only the exact words given.'

export type VoiceMode = 'grok' | 'speech' | 'none'

function toFloat32(b64: string): Float32Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const int16 = new Int16Array(bytes.buffer)
  const f = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) f[i] = int16[i] / 32768
  return f
}

export class TourVoice {
  mode: VoiceMode = 'none'
  private ws: WebSocket | null = null
  private ctx: AudioContext | null = null
  private nextPlay = 0
  private ready = false
  private resolveSpeak: (() => void) | null = null
  private doneTimer: ReturnType<typeof setTimeout> | undefined

  // Call from a user gesture so the AudioContext is allowed to start.
  async init(): Promise<VoiceMode> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctx = window.AudioContext || (window as any).webkitAudioContext
      this.ctx = new Ctx({ sampleRate: SAMPLE_RATE })
      if (this.ctx!.state === 'suspended') await this.ctx!.resume()
      const res = await fetch('/api/grok-voice-token', { method: 'POST' })
      const tok = await res.json()
      if (!res.ok || !tok.token) throw new Error('no token')
      await this.connect(tok.token)
      this.mode = 'grok'
    } catch {
      try {
        this.ctx?.close()
      } catch {
        /* noop */
      }
      this.ctx = null
      this.mode =
        typeof window !== 'undefined' && 'speechSynthesis' in window ? 'speech' : 'none'
    }
    return this.mode
  }

  private connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`wss://api.x.ai/v1/realtime?model=${VOICE_MODEL}`, [
        `xai-client-secret.${token}`,
      ])
      this.ws = ws
      ws.onerror = () => reject(new Error('ws error'))
      ws.onclose = () => {
        if (!this.ready) reject(new Error('ws closed'))
      }
      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'session.update',
            session: {
              voice: VOICE,
              instructions: INSTRUCTIONS,
              audio: { output: { format: { type: 'audio/pcm', rate: SAMPLE_RATE } } },
            },
          })
        )
      }
      ws.onmessage = ({ data }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let m: any
        try {
          m = JSON.parse(data as string)
        } catch {
          return
        }
        switch (m.type) {
          case 'session.updated':
            if (!this.ready) {
              this.ready = true
              resolve()
            }
            break
          case 'response.output_audio.delta':
            this.play(m.delta as string)
            break
          case 'response.done':
          case 'response.output_audio.done':
            this.drainThenResolve()
            break
        }
      }
    })
  }

  private play(b64: string) {
    const ctx = this.ctx
    if (!ctx) return
    const f = toFloat32(b64)
    const buf = ctx.createBuffer(1, f.length, SAMPLE_RATE)
    buf.getChannelData(0).set(f)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    const start = Math.max(ctx.currentTime, this.nextPlay)
    src.start(start)
    this.nextPlay = start + buf.duration
  }

  // Resolve the current speak() once the queued audio has actually played out.
  private drainThenResolve() {
    if (!this.resolveSpeak || !this.ctx) return
    const wait = Math.max(0, (this.nextPlay - this.ctx.currentTime) * 1000) + 200
    clearTimeout(this.doneTimer)
    this.doneTimer = setTimeout(() => {
      const r = this.resolveSpeak
      this.resolveSpeak = null
      r?.()
    }, wait)
  }

  speak(text: string): Promise<void> {
    if (this.mode === 'grok' && this.ws?.readyState === WebSocket.OPEN && this.ctx) {
      return new Promise((resolve) => {
        this.resolveSpeak = resolve
        this.nextPlay = this.ctx!.currentTime
        this.ws!.send(
          JSON.stringify({
            type: 'conversation.item.create',
            item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] },
          })
        )
        this.ws!.send(JSON.stringify({ type: 'response.create' }))
        // safety: never hang if 'done' is missed
        clearTimeout(this.doneTimer)
        this.doneTimer = setTimeout(() => {
          const r = this.resolveSpeak
          this.resolveSpeak = null
          r?.()
        }, 20000)
      })
    }
    if (this.mode === 'speech' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return new Promise((resolve) => {
        try {
          window.speechSynthesis.cancel()
          const u = new SpeechSynthesisUtterance(text)
          u.rate = 1
          const male = pickMaleVoice()
          if (male) u.voice = male
          else u.pitch = 0.85 // nudge masculine when no male voice is installed
          let done = false
          const finish = () => {
            if (done) return
            done = true
            resolve()
          }
          u.onend = finish
          u.onerror = finish
          window.speechSynthesis.speak(u)
          setTimeout(finish, Math.max(4000, text.length * 95))
        } catch {
          resolve()
        }
      })
    }
    return Promise.resolve()
  }

  stop() {
    clearTimeout(this.doneTimer)
    this.resolveSpeak = null
    try {
      window.speechSynthesis?.cancel()
    } catch {
      /* noop */
    }
    try {
      this.ws?.close()
    } catch {
      /* noop */
    }
    try {
      this.ctx?.close()
    } catch {
      /* noop */
    }
    this.ws = null
    this.ctx = null
    this.ready = false
    this.mode = 'none'
  }
}
