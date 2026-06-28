import { NextRequest, NextResponse } from 'next/server'
import { SB_URL, SB_WRITE_HDR, PREFER_UPSERT } from '@/lib/sb-admin'

const EP = `${SB_URL}/rest/v1/demo_projects`

async function patchRow(id: string, body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const url = `${EP}?id=eq.${id}`
  const headers = { ...SB_WRITE_HDR, Prefer: PREFER_UPSERT }
  let payload = { ...body }

  for (let attempt = 0; attempt < 10; attempt++) {
    const r = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(payload) })
    if (r.ok || r.status === 204) return { ok: true }
    const text = await r.text()
    const missing = text.match(/Could not find the '(.+?)' column/)
    if (missing) {
      const col = missing[1]
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete payload[col]
      continue
    }
    return { ok: false, error: text }
  }
  return { ok: false, error: 'Too many missing columns' }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const result = await patchRow(id, body)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await fetch(`${EP}?id=eq.${id}`, { method: 'DELETE', headers: SB_WRITE_HDR })
  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 500 })
  return NextResponse.json({ ok: true })
}
