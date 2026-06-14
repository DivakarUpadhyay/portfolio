import { NextRequest, NextResponse } from 'next/server'

const SB_URL = 'https://rvyqwprkfzusjqblggvh.supabase.co'
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eXF3cHJrZnp1c2pxYmxnZ3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTIzODIsImV4cCI6MjA5Njk4ODM4Mn0.EcZ9UvjW_dlCASav1sNuclS4bPX8fRpDjrEhPLINQpg'
const SB_HDR = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
}

const ALLOWED_TABLES = ['learnings', 'interview_prep'] as const
type AllowedTable = typeof ALLOWED_TABLES[number]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { table, id, status } = body as { table: string; id: string; status: string }

    if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
      return NextResponse.json({ ok: false, error: 'Invalid table' }, { status: 400 })
    }
    if (!id || !status) {
      return NextResponse.json({ ok: false, error: 'id and status are required' }, { status: 400 })
    }

    const r = await fetch(
      `${SB_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
      { method: 'PATCH', headers: SB_HDR, body: JSON.stringify({ status }) }
    )

    if (!r.ok) {
      const errText = await r.text()
      return NextResponse.json({ ok: false, error: errText }, { status: r.status })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
