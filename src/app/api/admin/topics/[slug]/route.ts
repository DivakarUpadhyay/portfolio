import { NextRequest, NextResponse } from 'next/server'
import { SB_URL, SB_HDR, PREFER_UPSERT } from '@/lib/sb-admin'

const EP = `${SB_URL}/rest/v1/portfolio_data`

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const topic = await req.json()
  const r = await fetch(EP, {
    method: 'POST',
    headers: { ...SB_HDR, Prefer: PREFER_UPSERT },
    body: JSON.stringify({ key: `topic_${slug}`, value: topic }),
  })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const r = await fetch(`${EP}?key=eq.topic_${encodeURIComponent(slug)}`, { method: 'DELETE', headers: SB_HDR })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 500 })
  return NextResponse.json({ ok: true })
}
