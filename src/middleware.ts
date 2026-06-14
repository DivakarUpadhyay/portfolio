import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/admin-auth'

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}

const PUBLIC = ['/admin/login', '/api/admin/login', '/api/admin/logout']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC.some(p => pathname === p)) return NextResponse.next()

  const token = req.cookies.get('admin_session')?.value
  const valid = token ? await verifySessionToken(token) : false

  if (!valid) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
