'use client'

import { useEffect, useRef, useState } from 'react'
import { SectionHeading } from './section-heading'

type Status = 'idle' | 'loading' | 'active' | 'denied' | 'error'

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

// angle (degrees) at point b formed by a-b-c
function angle(a: P, b: P, c: P) {
  const abx = a.x - b.x
  const aby = a.y - b.y
  const cbx = c.x - b.x
  const cby = c.y - b.y
  const dot = abx * cbx + aby * cby
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby) || 1
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI
}
type P = { x: number; y: number }

export function RepCounter() {
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
  const fbRef = useRef('')

  const [status, setStatus] = useState<Status>('idle')
  const [reps, setReps] = useState(0)
  const [feedback, setFeedback] = useState('Stand back so your whole body is in frame')
  const [note, setNote] = useState('loading model…')

  const setFb = (t: string) => {
    if (fbRef.current !== t) {
      fbRef.current = t
      setFeedback(t)
    }
  }

  const stop = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    try {
      lmRef.current?.close?.()
    } catch {}
    lmRef.current = null
    setStatus('idle')
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

    // knee angle from the more-visible leg
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

    // squat rep state machine
    if (phase.current === 'up') {
      if (knee < 100) {
        phase.current = 'down'
        minAngle.current = knee
        setFb('Down — now drive up! ⬆')
      } else {
        setFb(knee > 160 ? 'Ready — squat down ⬇' : 'Keep lowering…')
      }
    } else {
      minAngle.current = Math.min(minAngle.current, knee)
      if (knee > 155) {
        phase.current = 'up'
        const deep = minAngle.current < 95
        setReps((r) => r + 1)
        setFb(deep ? '💪 Deep rep — nice!' : 'Rep! Try to go a bit deeper')
        minAngle.current = 180
      }
    }
  }

  const start = async () => {
    setStatus('loading')
    setReps(0)
    phase.current = 'up'
    minAngle.current = 180
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-camera-api')
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
      rafRef.current = requestAnimationFrame(loop)
    } catch (e) {
      const name = (e as Error)?.name
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') setStatus('denied')
      else {
        console.error('[rep-counter]', e)
        setStatus('error')
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }

  return (
    <section id="demo" className="scroll-mt-24 py-16">
      <div className="wrap">
        <SectionHeading
          eyebrow="Live demo · runs in your browser"
          title="Try my computer vision — squat rep counter"
        />

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
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
              <div className="absolute left-3 top-3 rounded-xl border border-white/15 bg-black/60 px-4 py-2 backdrop-blur">
                <div className="font-mono text-4xl font-bold text-primary tabular-nums">{reps}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted">reps</div>
              </div>
            )}

            {status !== 'active' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                {status === 'loading' ? (
                  <p className="font-mono text-sm text-primary">{note}</p>
                ) : status === 'denied' ? (
                  <p className="max-w-xs text-sm text-muted">
                    Camera permission was blocked. Allow it in your browser and try again — the
                    video never leaves your device.
                  </p>
                ) : status === 'error' ? (
                  <p className="max-w-xs text-sm text-muted">
                    Couldn&apos;t start the model here (needs a modern desktop browser with WebGL).
                    See the real app →{' '}
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
                  <>
                    <p className="max-w-sm text-sm text-muted">
                      Turn on your camera, stand side-on, and do a few squats — a pose model counts
                      your reps and checks depth, live.
                    </p>
                  </>
                )}
                {status !== 'loading' && (
                  <button
                    onClick={start}
                    className="rounded-lg bg-gradient-to-r from-primary to-[#dcbb8e] px-5 py-2.5 text-sm font-semibold text-[#1c130a] transition-opacity hover:opacity-90"
                  >
                    {status === 'idle' ? '▶ Start camera' : 'Try again'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* side panel */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-surface p-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">coach feedback</p>
              <p className="mt-2 text-lg text-foreground">{status === 'active' ? feedback : '—'}</p>
            </div>
            <ul className="space-y-1.5 text-sm text-muted">
              <li>› Pose estimation with MediaPipe (33 body landmarks)</li>
              <li>› Knee-angle tracking → rep count + depth check</li>
              <li>› Same idea as my <span className="text-foreground">RepRight</span> app</li>
            </ul>
            <p className="text-xs text-muted/80">
              🔒 100% on-device — your camera feed never leaves your browser, nothing is recorded.
            </p>
            {status === 'active' && (
              <button
                onClick={stop}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-foreground transition-colors hover:bg-white/5"
              >
                ◼ Stop camera
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
