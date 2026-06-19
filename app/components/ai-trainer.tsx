'use client'

import { useEffect, useRef, useState } from 'react'
import { SectionHeading } from './section-heading'

type Status = 'idle' | 'loading' | 'active' | 'denied' | 'error'
type P = { x: number; y: number }

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

function angle(a: P, b: P, c: P) {
  const abx = a.x - b.x
  const aby = a.y - b.y
  const cbx = c.x - b.x
  const cby = c.y - b.y
  const dot = abx * cbx + aby * cby
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby) || 1
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI
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
  const voiceRef = useRef(true)

  const [status, setStatus] = useState<Status>('idle')
  const [reps, setReps] = useState(0)
  const [feedback, setFeedback] = useState('Stand side-on so your whole body is in frame')
  const [coachLine, setCoachLine] = useState('Your AI coach will hype you up as you go 💪')
  const [voiceOn, setVoiceOn] = useState(true)
  const [note, setNote] = useState('loading model…')

  const setFb = (t: string) => {
    if (fbRef.current !== t) {
      fbRef.current = t
      setFeedback(t)
    }
  }

  const speak = (t: string) => {
    if (!voiceRef.current) return
    try {
      const s = window.speechSynthesis
      s.cancel()
      const u = new SpeechSynthesisUtterance(t)
      u.rate = 1.06
      u.pitch = 1.05
      s.speak(u)
    } catch {}
  }

  // Grok-powered motivational line (secure /api/coach route), with fallback.
  const grokHype = async (n: number, deep: boolean) => {
    let line = ''
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `I just hit ${n} squats. My depth has been ${
            deep ? 'good and deep' : 'a bit shallow'
          }. Give me one short hype line to keep going.`,
        }),
      })
      const data = await res.json()
      line = data?.reply || ''
    } catch {}
    if (!line)
      line = deep
        ? `${n} reps — beautiful depth. Keep that pace!`
        : `${n} reps! Sink a little lower and finish strong!`
    setCoachLine(line)
    speak(line)
  }

  const onRep = (n: number, deep: boolean) => {
    setFb(deep ? `💪 Rep ${n} — deep!` : `Rep ${n} — go a bit deeper`)
    if (n % 5 === 0) grokHype(n, deep)
    else speak(deep ? `${n}. Strong rep!` : `${n}. Go deeper.`)
  }

  const stop = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    try {
      lmRef.current?.close?.()
    } catch {}
    lmRef.current = null
    try {
      window.speechSynthesis?.cancel()
    } catch {}
    setStatus('idle')
  }

  useEffect(() => () => stop(), [])
  useEffect(() => {
    voiceRef.current = voiceOn
    if (!voiceOn) try { window.speechSynthesis?.cancel() } catch {}
  }, [voiceOn])

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
    const w = video.videoWidth
    const h = video.videoHeight
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
    const knee =
      lScore >= rScore ? angle(sc(23), sc(25), sc(27)) : angle(sc(24), sc(26), sc(28))

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
        onRep(n, deep)
        minAngle.current = 180
      }
    }
  }

  const start = async () => {
    setStatus('loading')
    setReps(0)
    repsRef.current = 0
    phase.current = 'up'
    minAngle.current = 180
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-camera')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
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
        baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
      })
      setStatus('active')
      speak("Let's go! Show me your squats.")
      rafRef.current = requestAnimationFrame(loop)
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
          eyebrow="Live demo · computer vision + voice, in your browser"
          title="AI personal trainer — it watches your form and coaches you out loud"
        />

        <div className="grid items-stretch gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* camera stage */}
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 h-full w-full -scale-x-100 object-contain"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full -scale-x-100 object-contain"
            />

            {status === 'active' && (
              <>
                <div className="absolute left-3 top-3 rounded-xl border border-white/15 bg-black/60 px-4 py-2 backdrop-blur">
                  <div className="font-mono text-4xl font-bold text-primary tabular-nums">{reps}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted">reps</div>
                </div>
                <button
                  onClick={() => setVoiceOn((v) => !v)}
                  className="absolute right-3 top-3 rounded-lg border border-white/15 bg-black/60 px-3 py-1.5 font-mono text-xs text-foreground backdrop-blur"
                >
                  {voiceOn ? '🔊 coach on' : '🔇 coach off'}
                </button>
              </>
            )}

            {status !== 'active' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                {status === 'loading' ? (
                  <p className="font-mono text-sm text-primary">{note}</p>
                ) : status === 'denied' ? (
                  <p className="max-w-xs text-sm text-muted">
                    Camera permission was blocked. Allow it and try again — the video never leaves
                    your device.
                  </p>
                ) : status === 'error' ? (
                  <p className="max-w-xs text-sm text-muted">
                    Couldn&apos;t start here (needs a modern desktop browser with WebGL). See the real
                    apps →{' '}
                    <a
                      href="https://github.com/samshanmukh/RepRight"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      RepRight
                    </a>
                  </p>
                ) : (
                  <p className="max-w-sm text-sm text-muted">
                    Turn on your camera, stand side-on, and squat — it counts your reps, checks depth,
                    and <span className="text-foreground">talks you through it</span> like a real
                    coach.
                  </p>
                )}
                {status !== 'loading' && (
                  <button
                    onClick={start}
                    className="rounded-lg bg-gradient-to-r from-primary to-[#dcbb8e] px-5 py-2.5 text-sm font-semibold text-[#1c130a] transition-opacity hover:opacity-90"
                  >
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
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-primary">
                🎙 coach says
              </p>
              <p className="mt-1 leading-relaxed text-foreground">{coachLine}</p>
            </div>
            <ul className="space-y-1.5 text-sm text-muted">
              <li>
                › <span className="text-foreground">Sees you</span> — pose estimation counts reps +
                checks depth (my <span className="text-foreground">RepRight</span>)
              </li>
              <li>
                › <span className="text-foreground">Talks to you</span> — voice coaching powered by
                Grok / xAI (my <span className="text-foreground">VoiceCoach</span>)
              </li>
            </ul>
            <p className="mt-auto text-xs text-muted/80">
              🔒 Camera + voice run in your browser; your video never leaves your device.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
