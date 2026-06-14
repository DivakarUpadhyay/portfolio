import { NextRequest, NextResponse } from 'next/server'
import { SB_URL, SB_HDR } from '@/lib/sb-admin'

const EP = `${SB_URL}/rest/v1/learnings`

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const r = await fetch(`${EP}?id=eq.${id}`, { method: 'PATCH', headers: SB_HDR, body: JSON.stringify(body) })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await fetch(`${EP}?id=eq.${id}`, { method: 'DELETE', headers: SB_HDR })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 500 })
  return NextResponse.json({ ok: true })
}
