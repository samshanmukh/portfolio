import { NextResponse } from 'next/server'
import { getEvents } from '../../lib/calendar'

export const revalidate = 900

export async function GET() {
  return NextResponse.json(await getEvents())
}
