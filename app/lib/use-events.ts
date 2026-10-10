'use client'

import { useEffect, useState } from 'react'
import type { EventsPayload } from './calendar'

// One shared request per visit: the Events pill only appears once the calendar
// is connected and has something to show, and the Events answer reuses it.
let pending: Promise<EventsPayload | null> | null = null

export function loadEvents(): Promise<EventsPayload | null> {
  pending ??= fetch('/api/events')
    .then((r) => (r.ok ? (r.json() as Promise<EventsPayload>) : null))
    .catch(() => null)
  return pending
}

export function useEvents() {
  const [data, setData] = useState<EventsPayload | null | undefined>(undefined)
  useEffect(() => {
    let live = true
    loadEvents().then((d) => live && setData(d))
    return () => {
      live = false
    }
  }, [])
  return data
}

export const hasEvents = (d: EventsPayload | null | undefined) => !!d && (d.upcoming.length > 0 || d.recent.length > 0)
