import { NextRequest, NextResponse } from 'next/server'
import { SB_URL, SB_KEY } from '@/lib/sb-admin'

const BUCKET = 'learning-files'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const allowed = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg']
  if (!allowed.includes(ext)) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })

  const filename = `screenshots/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const buffer = await file.arrayBuffer()

  const r = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${filename}`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': file.type || 'image/png',
      'x-upsert': 'true',
    },
    body: buffer,
  })

  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 500 })

  const url = `${SB_URL}/storage/v1/object/public/${BUCKET}/${filename}`
  return NextResponse.json({ url })
}
