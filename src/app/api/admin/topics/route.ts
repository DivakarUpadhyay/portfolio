import { NextRequest, NextResponse } from 'next/server'
import { SB_URL, SB_HDR, PREFER_UPSERT } from '@/lib/sb-admin'

const EP = `${SB_URL}/rest/v1/portfolio_data`

export async function GET() {
  const r = await fetch(`${EP}?key=like.topic_%25&select=value`, { headers: SB_HDR, cache: 'no-store' })
  if (!r.ok) return NextResponse.json([])
  const rows = await r.json() as { value: unknown }[]
  const topics = rows.map(row => row.value).filter(Boolean)
    .sort((a: unknown, b: unknown) => {
      const at = (a as { created_at?: string }).created_at
      const bt = (b as { created_at?: string }).created_at
      return new Date(bt || 0).getTime() - new Date(at || 0).getTime()
    })
  return NextResponse.json(topics)
}

export async function POST(req: NextRequest) {
  const topic = await req.json()
  if (!topic.slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })
  const r = await fetch(EP, {
    method: 'POST',
    headers: { ...SB_HDR, Prefer: PREFER_UPSERT },
    body: JSON.stringify({ key: `topic_${topic.slug}`, value: topic }),
  })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 500 })
  return NextResponse.json({ ok: true })
}
