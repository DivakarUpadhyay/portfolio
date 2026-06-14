import { NextRequest, NextResponse } from 'next/server'
import { SB_URL, SB_HDR, PREFER_UPSERT } from '@/lib/sb-admin'

const EP = `${SB_URL}/rest/v1/demo_projects`

export async function GET() {
  const r = await fetch(`${EP}?select=*&order=id`, { headers: SB_HDR, cache: 'no-store' })
  return NextResponse.json(await r.json())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const r = await fetch(EP, {
    method: 'POST',
    headers: { ...SB_HDR, Prefer: PREFER_UPSERT },
    body: JSON.stringify(body),
  })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 500 })
  return NextResponse.json({ ok: true })
}
