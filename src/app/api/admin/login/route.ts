import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, getAdminCredentials } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  const creds = getAdminCredentials()
  if (username !== creds.user || password !== creds.pass) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  const token = await createSessionToken(username)
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 8 * 60 * 60,
  })
  return res
}
