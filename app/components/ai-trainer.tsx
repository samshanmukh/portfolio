'use client'

import { useEffect, useRef, useState } from 'react'
import { SectionHeading } from './section-heading'

// ── AI Personal Trainer ──────────────────────────────────────────────────────
//  Sees you:  MediaPipe pose → counts squats + checks depth (RepRight)
//  Talks with you: xAI Grok Realtime voice (grok-voice-think-fast-1.0) — real
//  Grok voice, full-duplex (you can talk back). (VoiceCoach)
//  One camera+mic stream powers both.

type Status = 'idle' | 'loading' | 'active' | 'denied' | 'error'
type P = { x: number; y: number }

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const POSE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

const SAMPLE_RATE = 24000
const VOICE_MODEL = 'grok-voice-think-fast-1.0'
const VOICE = 'Eve'
const INSTRUCTIONS = `You are Sam's AI gym coach watching the user work out through a camera. Be energetic, warm, and a little funny. Keep replies SHORT and punchy (1–2 sentences), like a real coach between sets. When you get a "[live from the camera]" note about their reps, react with hype and a quick form/effort cue. Otherwise chat naturally and answer questions. Open with a quick hype line. Never be rude.`

function angle(a: P, b: P, c: P) {
  const abx = a.x - b.x,
    aby = a.y - b.y,
    cbx = c.x - b.x,
    cby = c.y - b.y
  const dot = abx * cbx + aby * cby
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby) || 1
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI
}
function toBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength)
  const CHUNK = 0x2000
  const parts: string[] = []
  for (let i = 0; i < bytes.length; i += CHUNK)
    parts.push(String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK))))
  return btoa(parts.join(''))
}
function toFloat32(b64: string): Float32Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const int16 = new Int16Array(bytes.buffer)
  const f = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) f[i] = int16[i] / 32768
  return f
}

export function AiTrainer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visionRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lmRef = useRef<any>(null)
  const rafRef = useRef(0)
  const streamRef = useRef<MediaStream | null>(null)
  const lastT = useRef(-1)
  const phase = useRef<'up' | 'down'>('up')
  const minAngle = useRef(180)
  const repsRef = useRef(0)
  const fbRef = useRef('')

  const wsRef = useRef<WebSocket | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const micSrcRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const nextPlayRef = useRef(0)
  const sourcesRef = useRef<AudioBufferSourceNode[]>([])
  const voiceReadyRef = useRef(false)
  const closingRef = useRef(false)

  const [status, setStatus] = useState<Status>('idle')
  const [reps, setReps] = useState(0)
  const [feedback, setFeedback] = useState('Stand side-on so your whole body is in frame')
  const [voice, setVoice] = useState<'off' | 'connecting' | 'live' | 'error'>('off')
  const [speaking, setSpeaking] = useState(false)
  const [youSaid, setYouSaid] = useState('')
  const [note, setNote] = useState('loading model…')

  const setFb = (t: string) => {
    if (fbRef.current !== t) {
      fbRef.current = t
      setFeedback(t)
    }
  }

  const interrupt = () => {
    for (const s of sourcesRef.current) {
      try {
        s.stop()
      } catch {}
    }
    sourcesRef.current = []
    nextPlayRef.current = 0
    setSpeaking(false)
  }
  const play = (b64: string) => {
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
  }

  const commentOnReps = (n: number, deep: boolean) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN || !voiceReadyRef.current) return
    ws.send(
      JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `[live from the camera] I just hit ${n} squats; my last rep was ${
                deep ? 'nice and deep' : 'a bit shallow'
              }. One short hype line.`,
            },
          ],
        },
      })
    )
    ws.send(JSON.stringify({ type: 'response.create' }))
  }

  const stop = () => {
    closingRef.current = true
    cancelAnimationFrame(rafRef.current)
    workletRef.current?.disconnect()
    micSrcRef.current?.disconnect()
    interrupt()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    try {
      lmRef.current?.close?.()
    } catch {}
    ctxRef.current?.close()
    wsRef.current?.close()
    streamRef.current = null
    lmRef.current = null
    ctxRef.current = null
    wsRef.current = null
    workletRef.current = null
    micSrcRef.current = null
    voiceReadyRef.current = false
    setStatus('idle')
    setVoice('off')
    setSpeaking(false)
  }
  useEffect(() => () => stop(), [])

  const loop = () => {
    rafRef.current = requestAnimationFrame(loop)
    const video = videoRef.current
    const canvas = canvasRef.current
    const lm = lmRef.current
    const vision = visionRef.current
    if (!video || !canvas || !lm || !vision || video.readyState < 2) return
    if (video.currentTime === lastT.current) return
    lastT.current = video.currentTime
    let res
    try {
      res = lm.detectForVideo(video, performance.now())
    } catch {
      return
    }
    const w = video.videoWidth,
      h = video.videoHeight
    if (canvas.width !== w) {
      canvas.width = w
      canvas.height = h
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)
    const pose = res?.landmarks?.[0]
    if (!pose) {
      setFb('No person detected — step into frame')
      return
    }
    try {
      const du = new vision.DrawingUtils(ctx)
      du.drawConnectors(pose, vision.PoseLandmarker.POSE_CONNECTIONS, {
        color: 'rgba(185,137,90,0.85)',
        lineWidth: 3,
      })
      du.drawLandmarks(pose, { radius: 3, color: '#dcbb8e' })
    } catch {}
    const vis = (i: number) => pose[i].visibility ?? 0
    const lScore = (vis(23) + vis(25) + vis(27)) / 3
    const rScore = (vis(24) + vis(26) + vis(28)) / 3
    if (Math.max(lScore, rScore) < 0.5) {
      setFb('Turn side-on so your legs are visible')
      return
    }
    const sc = (i: number): P => ({ x: pose[i].x * w, y: pose[i].y * h })
    const knee = lScore >= rScore ? angle(sc(23), sc(25), sc(27)) : angle(sc(24), sc(26), sc(28))
    if (phase.current === 'up') {
      if (knee < 100) {
        phase.current = 'down'
        minAngle.current = knee
        setFb('Down — now drive up! ⬆')
      } else setFb(knee > 160 ? 'Ready — squat down ⬇' : 'Keep lowering…')
    } else {
      minAngle.current = Math.min(minAngle.current, knee)
      if (knee > 155) {
        phase.current = 'up'
        const deep = minAngle.current < 95
        const n = repsRef.current + 1
        repsRef.current = n
        setReps(n)
        setFb(deep ? `💪 Rep ${n} — deep!` : `Rep ${n} — go a bit deeper`)
        commentOnReps(n, deep)
        minAngle.current = 180
      }
    }
  }

  const startVoice = async (stream: MediaStream) => {
    setVoice('connecting')
    try {
      const ctx = new AudioContext({ sampleRate: SAMPLE_RATE })
      if (ctx.state === 'suspended') await ctx.resume()
      ctxRef.current = ctx
      const tokRes = await fetch('/api/grok-voice-token', { method: 'POST' })
      const tok = await tokRes.json()
      if (!tokRes.ok || !tok.token) throw new Error('no token')
      const ws = new WebSocket(`wss://api.x.ai/v1/realtime?model=${VOICE_MODEL}`, [
        `xai-client-secret.${tok.token}`,
      ])
      wsRef.current = ws

      const attachMic = async () => {
        await ctx.audioWorklet.addModule('/pcm-processor-worklet.js')
        const source = ctx.createMediaStreamSource(stream)
        micSrcRef.current = source
        const worklet = new AudioWorkletNode(ctx, 'pcm-processor')
        workletRef.current = worklet
        worklet.port.onmessage = (e: MessageEvent<Int16Array>) => {
          if (ws.readyState === WebSocket.OPEN)
            ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: toBase64(e.data) }))
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
      ws.onmessage = async ({ data }) => {
        let m: Record<string, unknown>
        try {
          m = JSON.parse(data as string)
        } catch {
          return
        }
        switch (m.type) {
          case 'session.updated':
            if (!voiceReadyRef.current) {
              voiceReadyRef.current = true
              await attachMic()
              setVoice('live')
              ws.send(JSON.stringify({ type: 'response.create' }))
            }
            break
          case 'input_audio_buffer.speech_started':
            interrupt()
            break
          case 'response.output_audio.delta':
            play(m.delta as string)
            break
          case 'conversation.item.input_audio_transcription.completed':
            setYouSaid((m.transcript as string) ?? '')
            break
          case 'error':
            console.error('[grok-voice]', m.error)
            break
        }
      }
      ws.onerror = () => {
        if (!closingRef.current) setVoice('error')
      }
    } catch (e) {
      console.error('[grok-voice] start failed', e)
      setVoice('error')
    }
  }

  const start = async () => {
    setStatus('loading')
    setReps(0)
    repsRef.current = 0
    phase.current = 'up'
    minAngle.current = 180
    closingRef.current = false
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-media')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()

      setNote('loading pose model…')
      const vision = await import('@mediapipe/tasks-vision')
      visionRef.current = vision
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM)
      lmRef.current = await vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: POSE_MODEL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
      })
      setStatus('active')
      rafRef.current = requestAnimationFrame(loop)
      startVoice(stream)
    } catch (e) {
      const name = (e as Error)?.name
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') setStatus('denied')
      else {
        console.error('[ai-trainer]', e)
        setStatus('error')
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }

  return (
    <section id="trainer" className="scroll-mt-24 py-16">
      <div className="wrap">
        <SectionHeading
          eyebrow="Live demo · computer vision + real-time voice"
          title="AI personal trainer — it watches your form and coaches you in Grok's voice"
        />

        <div className="grid items-stretch gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* camera stage */}
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
            <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-contain" />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100 object-contain" />

            {status === 'active' && (
              <>
                <div className="absolute left-3 top-3 rounded-xl border border-white/15 bg-black/60 px-4 py-2 backdrop-blur">
                  <div className="font-mono text-4xl font-bold text-primary tabular-nums">{reps}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted">reps</div>
                </div>
                <div className="absolute right-3 top-3 flex items-center gap-2 rounded-lg border border-white/15 bg-black/60 px-3 py-1.5 font-mono text-xs text-foreground backdrop-blur">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      voice === 'live' ? 'bg-[#dcbb8e]' : voice === 'error' ? 'bg-red-400' : 'bg-muted'
                    } ${speaking ? 'animate-pulse' : ''}`}
                  />
                  {voice === 'connecting'
                    ? 'coach connecting…'
                    : voice === 'live'
                      ? speaking
                        ? 'coach speaking'
                        : 'coach listening'
                      : voice === 'error'
                        ? 'voice offline'
                        : 'coach'}
                </div>
              </>
            )}

            {status !== 'active' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                {status === 'loading' ? (
                  <p className="font-mono text-sm text-primary">{note}</p>
                ) : status === 'denied' ? (
                  <p className="max-w-xs text-sm text-muted">
                    Camera/mic permission was blocked. Allow it and try again — video stays on your device.
                  </p>
                ) : status === 'error' ? (
                  <p className="max-w-xs text-sm text-muted">
                    Couldn&apos;t start here (needs a modern desktop browser).{' '}
                    <a href="https://github.com/samshanmukh/RepRight" target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
                      RepRight
                    </a>
                  </p>
                ) : (
                  <p className="max-w-sm text-sm text-muted">
                    Turn on your camera + mic, stand side-on, and squat — it counts your reps, checks depth, and{' '}
                    <span className="text-foreground">coaches you out loud in Grok&apos;s real voice</span>. Talk back anytime.
                  </p>
                )}
                {status !== 'loading' && (
                  <button onClick={start} className="rounded-lg bg-gradient-to-r from-primary to-[#dcbb8e] px-5 py-2.5 text-sm font-semibold text-[#1c130a] transition-opacity hover:opacity-90">
                    {status === 'idle' ? '▶ Start training' : 'Try again'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* coaching panel */}
          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-surface p-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">form check</p>
              <p className="mt-1 text-lg text-foreground">{status === 'active' ? feedback : '—'}</p>
            </div>
            {status === 'active' && (
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted">you said</p>
                <p className="mt-1 min-h-[1.25rem] text-sm text-foreground/80">{youSaid || '… just talk to your coach'}</p>
              </div>
            )}
            <ul className="space-y-1.5 text-sm text-muted">
              <li>
                › <span className="text-foreground">Sees you</span> — pose estimation counts reps + depth (my{' '}
                <span className="text-foreground">RepRight</span>)
              </li>
              <li>
                › <span className="text-foreground">Talks with you</span> — real-time{' '}
                <span className="text-foreground">Grok voice</span> ({VOICE_MODEL}), my{' '}
                <span className="text-foreground">VoiceCoach</span>
              </li>
            </ul>
            {status === 'active' && (
              <button onClick={stop} className="mt-auto rounded-lg border border-white/10 px-4 py-2 text-sm text-foreground transition-colors hover:bg-white/5">
                ◼ Stop
              </button>
            )}
            <p className="text-xs text-muted/80">
              🎧 Use headphones. Camera runs on-device; mic audio streams to xAI to power the live voice.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
