'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/admin/projects', label: '🗂 Projects' },
  { href: '/admin/learnings', label: '📚 Learnings' },
  { href: '/admin/interview-prep', label: '🎯 Interview Prep' },
  { href: '/admin/topics', label: '📝 Topics' },
]

const CATS = ['web3', 'enterprise', 'fintech', 'healthtech', 'other']
const STATUSES = ['in-progress', 'completed', 'archived']

const EMPTY: Record<string, unknown> = {
  id: '', type: '', name: '', description: '', tags: '', category: 'enterprise',
  github: '', demo: '', screenshot: '', featured: false, status: 'completed',
}

type Project = {
  id: string; type: string; name: string; description: string
  tags: string[] | string; category: string; github: string; demo: string
  screenshot: string; featured: boolean; status: string
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  async function signOut() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }
  return (
    <>
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,.09)', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111', letterSpacing: '-.01em' }}>Portfolio Admin</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 11, color: '#999', fontFamily: 'monospace' }}>portfolio-divakarupadhyay.vercel.app</span>
          <button onClick={signOut} style={{ background: 'transparent', border: '1px solid rgba(0,0,0,.12)', color: '#666', padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
        </div>
      </div>
      <nav style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,.08)', padding: '0 28px', display: 'flex', gap: 2 }}>
        {NAV.map(n => (
          <Link key={n.href} href={n.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '12px 14px', fontSize: 12, fontWeight: path.startsWith(n.href) ? 600 : 500, color: path.startsWith(n.href) ? '#c09030' : '#777', textDecoration: 'none', borderBottom: path.startsWith(n.href) ? '2px solid #c09030' : '2px solid transparent' }}>
            {n.label}
          </Link>
        ))}
      </nav>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 28px' }}>
        {children}
      </div>
    </>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const data = await fetch('/api/admin/projects').then(r => r.json()).catch(() => [])
    setProjects(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? projects : filter === 'active'
    ? projects.filter(p => p.status !== 'archived')
    : projects.filter(p => p.status === 'archived')

  function openAdd() {
    setForm({ ...EMPTY })
    setModal(true)
  }

  function openEdit(p: Project) {
    setForm({ ...p, tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || '') })
    setModal(true)
  }

  async function save() {
    setSaving(true)
    const body = { ...form, tags: String(form.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean), featured: !!form.featured }
    const editing = projects.some(p => p.id === form.id)
    if (editing) {
      await fetch(`/api/admin/projects/${form.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/admin/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setSaving(false)
    setModal(false)
    load()
  }

  async function del(id: string) {
    if (!confirm('Delete this project?')) return
    await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
    load()
  }

  async function toggleFeatured(p: Project) {
    await fetch(`/api/admin/projects/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featured: !p.featured }) })
    load()
  }

  const inp = (style = {}) => ({ width: '100%', padding: '9px 12px', background: '#fafafa', border: '1px solid rgba(0,0,0,.14)', borderRadius: 7, color: '#111', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, ...style })

  return (
    <AdminShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.08em' }}>Projects</span>
          <span style={{ fontSize: 11, color: '#bbb' }}>{projects.length} total</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'active', 'archived'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: filter === f ? '#c09030' : 'rgba(0,0,0,.13)', background: filter === f ? '#fff8e6' : '#fff', color: filter === f ? '#c09030' : '#555', fontFamily: 'inherit' }}>{f}</button>
          ))}
          <button onClick={openAdd} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#c09030', color: '#fff', fontFamily: 'inherit' }}>+ Add Project</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64, gap: 12, flexDirection: 'column' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(192,144,48,.15)', borderTopColor: '#c09030', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#ccc', textTransform: 'uppercase', letterSpacing: '.1em' }}>Loading</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#bbb', fontSize: 13 }}>No projects found</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: '#fff', border: '1px solid rgba(0,0,0,.09)', borderRadius: 10, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,.04)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#c09030', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{p.type}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{p.name}</div>
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  {p.featured && <span style={{ background: '#fff8e6', color: '#c09030', border: '1px solid #f0d98a', borderRadius: 4, fontSize: 10, fontWeight: 700, padding: '2px 6px' }}>★ FEAT</span>}
                  <span style={{ background: p.status === 'in-progress' ? '#eff6ff' : p.status === 'archived' ? '#f9fafb' : '#f0fdf4', color: p.status === 'in-progress' ? '#2563eb' : p.status === 'archived' ? '#9ca3af' : '#16a34a', border: '1px solid', borderColor: p.status === 'in-progress' ? '#bfdbfe' : p.status === 'archived' ? '#e5e7eb' : '#bbf7d0', borderRadius: 4, fontSize: 10, fontWeight: 600, padding: '2px 6px' }}>{p.status}</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5, margin: 0 }}>{String(p.description || '').slice(0, 100)}{String(p.description || '').length > 100 ? '…' : ''}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(Array.isArray(p.tags) ? p.tags : String(p.tags || '').split(',')).slice(0, 4).map((t: string) => (
                  <span key={t} style={{ background: '#f5f5f5', color: '#555', borderRadius: 4, fontSize: 10, padding: '2px 6px', border: '1px solid rgba(0,0,0,.08)' }}>{String(t).trim()}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button onClick={() => openEdit(p)} style={{ flex: 1, padding: '6px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(0,0,0,.13)', borderRadius: 6, background: '#fff', color: '#444', fontFamily: 'inherit' }}>Edit</button>
                <button onClick={() => toggleFeatured(p)} style={{ padding: '6px 10px', fontSize: 11, cursor: 'pointer', border: '1px solid rgba(0,0,0,.13)', borderRadius: 6, background: '#fff', color: p.featured ? '#c09030' : '#999', fontFamily: 'inherit' }}>★</button>
                <button onClick={() => del(p.id)} style={{ padding: '6px 10px', fontSize: 11, cursor: 'pointer', border: '1px solid rgba(220,38,38,.2)', borderRadius: 6, background: '#fff', color: '#dc2626', fontFamily: 'inherit' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '28px 28px 24px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: 0 }}>{projects.some(p => p.id === form.id) ? 'Edit' : 'Add'} Project</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#999' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[['id', 'ID (slug)'], ['type', 'Type'], ['name', 'Name'], ['category', 'Category'], ['github', 'GitHub URL'], ['demo', 'Demo URL'], ['screenshot', 'Screenshot path'], ['status', 'Status']].map(([k, lbl]) => (
                <div key={k} style={{ gridColumn: ['name', 'screenshot'].includes(k) ? 'span 2' : undefined }}>
                  <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>{lbl}</label>
                  {k === 'category' ? (
                    <select value={String(form[k] || '')} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={inp()}>
                      {CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  ) : k === 'status' ? (
                    <select value={String(form[k] || '')} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={inp()}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input value={String(form[k] || '')} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={inp()} />
                  )}
                </div>
              ))}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Tags (comma-separated)</label>
                <input value={String(form.tags || '')} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} style={inp()} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Description</label>
                <textarea value={String(form.description || '')} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inp(), resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="feat" checked={!!form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} style={{ accentColor: '#c09030', width: 14, height: 14, cursor: 'pointer' }} />
                <label htmlFor="feat" style={{ fontSize: 13, color: '#555', cursor: 'pointer' }}>Featured project</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding: '8px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(0,0,0,.15)', background: '#fff', color: '#444', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#c09030', color: '#fff', fontFamily: 'inherit' }}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
