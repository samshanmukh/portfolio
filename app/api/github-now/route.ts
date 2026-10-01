import { NextResponse } from 'next/server'
import { getRecentRepos } from '../../lib/github'

export const revalidate = 3600

export async function GET() {
  const repos = await getRecentRepos()
  return NextResponse.json({ repos })
}
