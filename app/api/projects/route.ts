import { NextResponse } from 'next/server'
import { getLiveProjects } from '../../lib/project-stats'

export const revalidate = 3600

export async function GET() {
  return NextResponse.json(await getLiveProjects())
}
