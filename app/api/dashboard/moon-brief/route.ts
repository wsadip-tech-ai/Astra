import { NextResponse } from 'next/server'

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || ''

export async function GET() {
  try {
    const resp = await fetch(`${FASTAPI_BASE_URL}/transits/moon-brief`, {
      headers: { 'X-Internal-Secret': INTERNAL_SECRET },
    })
    if (!resp.ok) return NextResponse.json({ error: 'unavailable' }, { status: 502 })
    return NextResponse.json(await resp.json())
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 502 })
  }
}
