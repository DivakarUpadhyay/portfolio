import { NextRequest, NextResponse } from 'next/server'
import { SB_URL, SB_HDR, SB_WRITE_HDR, PREFER_UPSERT } from '@/lib/sb-admin'

const EP = `${SB_URL}/rest/v1/demo_projects`

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Send row to Supabase, auto-dropping any column that doesn't exist yet (PGRST204).
async function upsertRow(row: Record<string, unknown>, method: 'POST' | 'PATCH', url: string): Promise<{ ok: boolean; error?: string }> {
  const headers = { ...SB_WRITE_HDR, Prefer: PREFER_UPSERT }
  let payload = { ...row }

  for (let attempt = 0; attempt < 10; attempt++) {
    const r = await fetch(url, { method, headers, body: JSON.stringify(payload) })
    if (r.ok || r.status === 204) return { ok: true }
    const text = await r.text()
    // PGRST204 = column not found in schema cache — drop it and retry
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

export async function GET() {
  const r = await fetch(`${EP}?select=*&order=id`, { headers: SB_HDR, cache: 'no-store' })
  return NextResponse.json(await r.json())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.id && body.name) body.id = slugify(String(body.name))
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const result = await upsertRow(body, 'POST', EP)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
