const DEFAULT_SECRET = 'portfolio-admin-x7k2-2025'

function getSecret(): string {
  return process.env.ADMIN_SECRET || DEFAULT_SECRET
}

export function getAdminCredentials() {
  return {
    user: process.env.ADMIN_USER || 'admin',
    pass: process.env.ADMIN_PASS || 'portfolio2025',
  }
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const buf = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function createSessionToken(user: string): Promise<string> {
  const secret = getSecret()
  const payload = JSON.stringify({ u: user, t: Date.now() })
  const sig = await hmacSign(payload, secret)
  return btoa(payload + ':' + sig)
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const secret = getSecret()
    const decoded = atob(token)
    const lastColon = decoded.lastIndexOf(':')
    const payload = decoded.slice(0, lastColon)
    const sig = decoded.slice(lastColon + 1)
    const { t } = JSON.parse(payload)
    if (!t || Date.now() - t > 8 * 60 * 60 * 1000) return false
    const expected = await hmacSign(payload, secret)
    return expected === sig
  } catch {
    return false
  }
}
