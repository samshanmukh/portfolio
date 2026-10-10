'use client'

import { motion } from 'framer-motion'
import { CalendarCheck, CalendarDays, Coffee, Mail, Phone, Video } from 'lucide-react'
import { type ComponentType, useEffect, useMemo, useState } from 'react'
import type { MeetingType, Slots } from '../../lib/booking'
import { socials } from '../../lib/data'
import type { ChatMsg } from '../../lib/hosted-llm'

const WAYS: { type: MeetingType; label: string; icon: ComponentType<{ className?: string }>; color: string }[] = [
  { type: 'video', label: 'Video', icon: Video, color: 'text-[#34A853]' },
  { type: 'phone', label: 'Phone', icon: Phone, color: 'text-[#4285F4]' },
  { type: 'inPerson', label: 'In person', icon: Coffee, color: 'text-[#B45309] dark:text-[#F59E0B]' },
]

const SUMMARY: Record<MeetingType, string> = { video: 'Video call', phone: 'Phone call', inPerson: 'In person' }
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
// the visitor's own time zone
const dayKey = (iso: string) => new Date(iso).toLocaleDateString('en-CA')
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

type State =
  | { kind: 'loading' }
  | { kind: 'off' }
  | { kind: 'ready'; data: Slots }
  | { kind: 'done'; start: string; email: string; meet: string | null }

const chip = (on: boolean) =>
  `glass tap relative shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-opacity ${on ? 'font-semibold outline-2 outline-offset-1 outline-foreground/50 outline' : 'opacity-80 hover:opacity-100'}`
const field = 'glass-field w-full rounded-2xl border px-3.5 py-2.5 text-sm outline-none placeholder:text-muted'

// "Can we meet?": the visitor picks video, phone or in person, a free slot on Sam's calendar
// (shown in their own time zone), adds their name and email (and a number or place), confirms,
// and the meeting is booked onto Sam's calendar with a note on what they asked in the chat.
// The chat never confirms a time or place itself. Without booking set up, it offers email.
export function Book({ chat = [] }: { chat?: ChatMsg[] }) {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [type, setType] = useState<MeetingType>('video')
  const [day, setDay] = useState('')
  const [start, setStart] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [place, setPlace] = useState('')
  const [about, setAbout] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const load = () =>
    fetch('/api/book', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setState(d?.enabled && Array.isArray(d.slots) && d.slots.length ? { kind: 'ready', data: d } : { kind: 'off' }))
      .catch(() => setState({ kind: 'off' }))
  useEffect(() => {
    load()
  }, [])

  const slots = state.kind === 'ready' ? state.data.slots : []
  const days = useMemo(() => [...new Map(slots.map((s) => [dayKey(s), s])).entries()], [slots])
  const activeDay = day || days[0]?.[0] || ''
  const times = slots.filter((s) => dayKey(s) === activeDay)

  const valid =
    !!start &&
    name.trim().length > 0 &&
    EMAIL.test(email.trim()) &&
    (type !== 'phone' || phone.replace(/\D/g, '').length >= 7) &&
    (type !== 'inPerson' || place.trim().length > 0)

  const submit = async () => {
    if (!valid || sending) return
    setSending(true)
    setError('')
    try {
      const r = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, start, name, email, phone, place, about, chat }),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok && d?.ok) {
        setState({ kind: 'done', start: d.start || start, email: email.trim(), meet: d.meet })
      } else if (d?.error === 'slot-taken') {
        setError('That slot was just taken. Pick another one.')
        setStart('')
        load()
      } else if (d?.error === 'rate-limited') {
        setError(`That's a lot of bookings for one day. Email me at ${socials.email} instead.`)
      } else {
        setError(`Couldn't book that. Try again, or email me at ${socials.email}.`)
      }
    } catch {
      setError(`Couldn't book that. Try again, or email me at ${socials.email}.`)
    }
    setSending(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="glass w-full max-w-md rounded-3xl p-4"
    >
      {state.kind === 'done' ? (
        <div className="flex items-start gap-3">
          <div className="glass flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
            <CalendarCheck className="h-5 w-5 text-[#34A853]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold">You&apos;re booked!</h3>
            <p className="text-sm text-muted">
              {dayLabel(state.start)} at {timeLabel(state.start)}. The calendar invite is on its way to{' '}
              <span className="break-words text-foreground">{state.email}</span>.
            </p>
            {state.meet && (
              <a href={state.meet} target="_blank" rel="noopener noreferrer" className="glass tap relative mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
                <Video className="h-4 w-4 text-[#34A853]" /> Meet link
              </a>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="glass flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
              {state.kind === 'off' ? <Mail className="h-5 w-5 text-[#EA4335]" /> : <CalendarDays className="h-5 w-5 text-[#4285F4]" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold">{state.kind === 'off' ? 'Set up a time' : 'Book a time with me'}</h3>
              <p className="text-xs text-muted">
                {state.kind === 'off'
                  ? "Email me and we'll find a slot."
                  : state.kind === 'loading'
                    ? 'Checking my calendar…'
                    : 'Times are in your time zone.'}
              </p>
            </div>
          </div>

          {state.kind === 'off' && (
            <a
              href={`mailto:${socials.email}?subject=${encodeURIComponent("Let's meet")}`}
              className="glass tap relative mt-3 block w-full rounded-full py-2.5 text-center text-sm font-medium"
            >
              Email me
            </a>
          )}

          {state.kind === 'ready' && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {WAYS.map((w) => (
                  <button key={w.type} type="button" onClick={() => setType(w.type)} className={`${chip(type === w.type)} flex items-center justify-center gap-1.5 py-2`}>
                    <w.icon className={`h-4 w-4 ${w.color}`} />
                    {w.label}
                  </button>
                ))}
              </div>

              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1">
                {days.map(([key, first]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setDay(key)
                      setStart('')
                    }}
                    className={chip(key === activeDay)}
                  >
                    {dayLabel(first)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {times.map((s) => (
                  <button key={s} type="button" onClick={() => setStart(s)} className={chip(s === start)}>
                    {timeLabel(s)}
                  </button>
                ))}
              </div>

              {start && (
                <motion.form
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={(e) => {
                    e.preventDefault()
                    submit()
                  }}
                  className="space-y-2 pt-1"
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input className={field} placeholder="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
                    <input className={field} placeholder="Your email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} />
                  </div>
                  {type === 'phone' && (
                    <input className={field} placeholder="Phone number I should call" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
                  )}
                  {type === 'inPerson' && (
                    <input className={field} placeholder="Where should we meet? (café, office…)" value={place} onChange={(e) => setPlace(e.target.value)} maxLength={160} />
                  )}
                  <input className={field} placeholder="What do you want to chat about? (optional)" value={about} onChange={(e) => setAbout(e.target.value)} maxLength={500} />
                  <p className="px-1 text-xs text-muted">
                    {SUMMARY[type]}, {dayLabel(start)} at {timeLabel(start)}
                  </p>
                  {error && <p className="px-1 text-xs text-[#DC2626] dark:text-[#F87171]">{error}</p>}
                  <button type="submit" disabled={!valid || sending} className="glass tap relative w-full cursor-pointer rounded-full py-2.5 text-sm font-semibold disabled:cursor-default disabled:opacity-50">
                    {sending ? 'Booking…' : 'Confirm booking'}
                  </button>
                </motion.form>
              )}
              {!start && error && <p className="px-1 text-xs text-[#DC2626] dark:text-[#F87171]">{error}</p>}
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
