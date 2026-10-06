'use client'

import { motion } from 'framer-motion'
import { CalendarDays, Clock, ExternalLink, MapPin } from 'lucide-react'
import type { CalendarEvent } from '../../lib/calendar'
import { useEvents } from '../../lib/use-events'

// All-day events are stored as midnight UTC dates, so read them back in UTC.
const zoneOf = (e: CalendarEvent) => (e.allDay ? 'UTC' : e.timeZone)

const fmt = (iso: string, tz: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts }).format(new Date(iso))

function when(e: CalendarEvent): string {
  const tz = zoneOf(e)
  const day = fmt(e.start, tz, { weekday: 'short', month: 'short', day: 'numeric' })
  if (e.allDay) {
    // DTEND of an all-day event is the day after it ends
    const last = e.end ? new Date(new Date(e.end).getTime() - 86_400_000).toISOString() : e.start
    const lastDay = fmt(last, tz, { weekday: 'short', month: 'short', day: 'numeric' })
    return lastDay === day ? `${day} · All day` : `${day} to ${lastDay}`
  }
  const time = (iso: string) => fmt(iso, tz, { hour: 'numeric', minute: '2-digit' })
  const zone = fmt(e.start, tz, { timeZoneName: 'short' }).split(' ').pop()
  if (!e.end) return `${day} · ${time(e.start)} ${zone}`
  const endDay = fmt(e.end, tz, { weekday: 'short', month: 'short', day: 'numeric' })
  return endDay === day
    ? `${day} · ${time(e.start)} to ${time(e.end)} ${zone}`
    : `${day}, ${time(e.start)} to ${endDay}, ${time(e.end)} ${zone}`
}

function DateTile({ e }: { e: CalendarEvent }) {
  const tz = zoneOf(e)
  return (
    <div className="glass flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl">
      <span className="text-[10px] font-semibold tracking-wide text-muted uppercase">{fmt(e.start, tz, { month: 'short' })}</span>
      <span className="text-xl leading-none font-bold">{fmt(e.start, tz, { day: 'numeric' })}</span>
    </div>
  )
}

function Role({ e }: { e: CalendarEvent }) {
  return (
    <span className="glass rounded-full px-2 py-0.5 text-[11px] font-medium text-foreground/80">
      {e.role === 'hosting' ? 'Hosting' : 'Attending'}
    </span>
  )
}

function Card({ e, i }: { e: CalendarEvent; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.06 * i } }}
      className="flex flex-col gap-3 rounded-2xl border border-border p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <DateTile e={e} />
        <div className="min-w-0 flex-1">
          <div className="mb-1">
            <Role e={e} />
          </div>
          <h3 className="text-base leading-snug font-semibold md:text-lg">{e.title}</h3>
        </div>
      </div>
      <div className="space-y-1.5 text-xs text-muted">
        <p className="flex items-start gap-1.5">
          <Clock className="mt-px h-3.5 w-3.5 shrink-0" /> {when(e)}
        </p>
        {e.location && (
          <p className="flex items-start gap-1.5">
            <MapPin className="mt-px h-3.5 w-3.5 shrink-0" /> <span className="break-words">{e.location}</span>
          </p>
        )}
      </div>
      {e.url && (
        <div className="mt-auto pt-1">
          <a
            href={e.url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass tap relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Event page
          </a>
        </div>
      )}
    </motion.div>
  )
}

function Past({ e }: { e: CalendarEvent }) {
  const tz = zoneOf(e)
  const inner = (
    <>
      <span className="w-14 shrink-0 text-muted">{fmt(e.start, tz, { month: 'short', day: 'numeric' })}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{e.title}</span>
      <span className="shrink-0 text-muted">{e.role === 'hosting' ? 'Hosted' : 'Attended'}</span>
    </>
  )
  const cls = 'flex items-center gap-3 rounded-xl bg-accent px-3 py-2 text-xs'
  return e.url ? (
    <a href={e.url} target="_blank" rel="noopener noreferrer" className={`${cls} transition-opacity hover:opacity-80`}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

// "What events are you hosting or going to?" — from Sam's Google Calendar (/api/events).
export function Events() {
  const data = useEvents()

  return (
    <div className="w-full space-y-5 pt-6 pb-4">
      <div>
        <h2 className="text-xl font-bold md:text-3xl">Where I&apos;ll be</h2>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <CalendarDays className="h-3.5 w-3.5" /> events I&apos;m hosting or going to, synced from my calendar
        </p>
      </div>

      {data === undefined && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-accent" />
          ))}
        </div>
      )}

      {data !== undefined && !data?.upcoming.length && (
        <p className="text-sm text-muted">Nothing on the calendar right now. Ask me how to reach you and I&apos;ll let you know what&apos;s next.</p>
      )}

      {!!data?.upcoming.length && (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.upcoming.map((e, i) => (
            <Card key={e.id} e={e} i={i} />
          ))}
        </div>
      )}

      {!!data?.recent.length && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Recently</h3>
          {data.recent.map((e) => (
            <Past key={e.id} e={e} />
          ))}
        </div>
      )}
    </div>
  )
}
