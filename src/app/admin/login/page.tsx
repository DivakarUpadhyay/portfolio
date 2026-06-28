'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        router.push('/admin/projects')
        router.refresh()
      } else {
        setError('Invalid username or password')
      }
    } catch {
      setError('Network error — try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f6f8' }}>
      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 14, padding: '40px 36px', width: '100%', maxWidth: 380, boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 34, height: 34, background: '#c09030', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📁</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Portfolio Admin</div>
            <div style={{ fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>portfolio-divakarupadhyay.vercel.app</div>
          </div>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 5 }}>Sign in</h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Enter your credentials to manage your portfolio</p>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid rgba(220,38,38,.2)', borderRadius: 7, padding: '9px 13px', fontSize: 12, color: '#dc2626', marginBottom: 16 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Username</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              required autoComplete="username"
              style={{ width: '100%', padding: '10px 13px', background: '#fafafa', border: '1px solid rgba(0,0,0,.14)', borderRadius: 7, color: '#111', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password"
              style={{ width: '100%', padding: '10px 13px', background: '#fafafa', border: '1px solid rgba(0,0,0,.14)', borderRadius: 7, color: '#111', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: 11, background: loading ? '#a87828' : '#c09030', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#999', marginTop: 18 }}>Admin access only</div>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,.07)' }}>
          <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Mobile App</div>
          <a
            href="https://github.com/DivakarUpadhyay/portfolio/releases/latest/download/lms-interactive.apk"
            download="LMS-Interactive.apk"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              borderRadius: 10, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,.08)',
            }}
          >
            <div style={{ fontSize: 22, lineHeight: 1 }}>📱</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>LMS Interactive</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginTop: 1 }}>Android APK · Debug build</div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,.12)', padding: '3px 8px', borderRadius: 5 }}>↓ APK</div>
          </a>
        </div>
      </div>
    </div>
  )
}
