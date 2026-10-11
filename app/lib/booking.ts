// Server side of in-chat booking: talks to the Google Apps Script (scripts/booking-calendar.gs)
// that runs under Sam's Google account and reads and writes Sam's calendar. Server only: the
// script URL and secret never reach the browser.

export type MeetingType = 'video' | 'phone' | 'inPerson'
export type Slots = { slots: string[]; minutes: number; timeZone: string }

const SCRIPT_URL = process.env.BOOKING_SCRIPT_URL
const SECRET = process.env.BOOKING_SECRET

export const bookingEnabled = () => !!(SCRIPT_URL && SECRET)

async function call<T>(body: Record<string, unknown>): Promise<T> {
  if (!SCRIPT_URL || !SECRET) throw new Error('booking-off')
  // Apps Script answers a POST with a redirect to the result, which fetch follows
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...body, secret: SECRET }),
    redirect: 'follow',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`booking-${res.status}`)
  // a sign-in page instead of JSON means the deployment isn't open to "Anyone"
  const data = await res.json().catch(() => ({ error: 'not-json (deploy the script with access: Anyone)' }))
  if (data?.error) throw new Error(String(data.error))
  return data as T
}

// open slots change only when Sam's calendar does, so a minute of caching is plenty
let cached: { at: number; data: Slots } | null = null
export async function getSlots(fresh = false): Promise<Slots> {
  if (!fresh && cached && Date.now() - cached.at < 60_000) return cached.data
  const data = await call<Slots>({ action: 'slots' })
  cached = { at: Date.now(), data }
  return data
}

export async function createBooking(b: {
  type: MeetingType
  start: string
  name: string
  email: string
  phone?: string
  place?: string
  description: string
}): Promise<{ ok: true; id?: string; start: string; meet: string | null }> {
  const r = await call<{ ok: true; id?: string; start: string; meet: string | null }>({ action: 'book', ...b })
  cached = null
  return r
}

// a street address for the place the visitor named, or null when Maps can't find it
export async function findPlace(q: string): Promise<string | null> {
  const r = await call<{ address: string | null }>({ action: 'place', q })
  return r.address || null
}

// takes a meeting booked from the chat off Sam's calendar (the script checks the email matches)
export async function cancelBooking(id: string, email: string): Promise<void> {
  await call<{ ok: true }>({ action: 'cancel', id, email })
  cached = null
}
