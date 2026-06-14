'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/admin/projects', label: '🗂 Projects' },
  { href: '/admin/learnings', label: '📚 Learnings' },
  { href: '/admin/interview-prep', label: '🎯 Interview Prep' },
  { href: '/admin/topics', label: '📝 Topics' },
]
const PAGE_SIZE = 10

type Topic = { title: string; slug: string; content: string; active: boolean; created_at: string }

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
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Portfolio Admin</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 11, color: '#999', fontFamily: 'monospace' }}>portfolio-divakarupadhyay.vercel.app</span>
          <button onClick={signOut} style={{ background: 'transparent', border: '1px solid rgba(0,0,0,.12)', color: '#666', padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
        </div>
      </div>
      <nav style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,.08)', padding: '0 28px', display: 'flex', gap: 2 }}>
        {NAV.map(n => (
          <Link key={n.href} href={n.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '12px 14px', fontSize: 12, fontWeight: path.startsWith(n.href) ? 600 : 500, color: path.startsWith(n.href) ? '#c09030' : '#777', textDecoration: 'none', borderBottom: path.startsWith(n.href) ? '2px solid #c09030' : '2px solid transparent' }}>{n.label}</Link>
        ))}
      </nav>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 28px' }}>{children}</div>
    </>
  )
}

const inp = (style = {}) => ({ width: '100%', padding: '9px 12px', background: '#fafafa', border: '1px solid rgba(0,0,0,.14)', borderRadius: 7, color: '#111', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, ...style })

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(false)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', slug: '', content: '', active: true })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const data = await fetch('/api/admin/topics').then(r => r.json()).catch(() => [])
    setTopics(Array.isArray(data) ? data : [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return topics
    return topics.filter(t => t.title.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q))
  }, [topics, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function openAdd() {
    setEditingSlug(null)
    setForm({ title: '', slug: '', content: '', active: true })
    setModal(true)
  }
  function openEdit(t: Topic) {
    setEditingSlug(t.slug)
    setForm({ title: t.title, slug: t.slug, content: t.content, active: t.active })
    setModal(true)
  }

  function autoSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function save() {
    if (!form.title.trim() || !form.slug.trim()) return
    setSaving(true)
    const topic: Topic = { ...form, created_at: editingSlug ? (topics.find(t => t.slug === editingSlug)?.created_at || new Date().toISOString()) : new Date().toISOString() }
    if (editingSlug && editingSlug !== form.slug) {
      await fetch(`/api/admin/topics/${editingSlug}`, { method: 'DELETE' })
    }
    if (editingSlug && editingSlug === form.slug) {
      await fetch(`/api/admin/topics/${form.slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(topic) })
    } else {
      await fetch('/api/admin/topics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(topic) })
    }
    setSaving(false); setModal(false); load()
  }

  async function del(slug: string) {
    if (!confirm('Delete this topic?')) return
    await fetch(`/api/admin/topics/${slug}`, { method: 'DELETE' })
    load()
  }

  async function toggleActive(t: Topic) {
    await fetch(`/api/admin/topics/${t.slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...t, active: !t.active }) })
    load()
  }

  return (
    <AdminShell>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes rowIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.08em' }}>Topics · {topics.length} total</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search topics…" style={{ padding: '7px 12px 7px 32px', borderRadius: 7, border: '1px solid rgba(0,0,0,.13)', fontSize: 12, outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#111', width: 200 }} />
            <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="5.5" stroke="#bbb" strokeWidth="1.5"/><path d="M13 13l3.5 3.5" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <button onClick={openAdd} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#c09030', color: '#fff', fontFamily: 'inherit' }}>+ Add Topic</button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.08)', borderRadius: 10, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 64, gap: 12 }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(192,144,48,.15)', borderTopColor: '#c09030', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#ccc', textTransform: 'uppercase', letterSpacing: '.1em' }}>Loading</span>
          </div>
        ) : slice.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#bbb', fontSize: 13 }}>No topics found</div>
        ) : (
          <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid rgba(0,0,0,.07)' }}>
                {['#', 'Title', 'Slug', 'Published', 'Active', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.07em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((t, idx) => {
                const date = new Date(t.created_at)
                const dateStr = isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                return (
                  <tr key={t.slug} style={{ borderBottom: '1px solid rgba(0,0,0,.05)', animation: `rowIn .18s ease both`, animationDelay: `${idx * 0.025}s` }}>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: '#bbb', fontFamily: 'monospace' }}>{String((safePage - 1) * PAGE_SIZE + idx + 1).padStart(2, '0')}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#111', fontSize: 13 }}>{t.title}</td>
                    <td style={{ padding: '12px 14px' }}><code style={{ fontSize: 11, color: '#8a6100', background: '#fff8e6', padding: '2px 7px', borderRadius: 4, border: '1px solid #f0d98a' }}>/pool/{t.slug}</code></td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#888' }}>{dateStr}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={() => toggleActive(t)} style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid', borderColor: t.active ? '#bbf7d0' : '#e5e7eb', background: t.active ? '#f0fdf4' : '#fafafa', color: t.active ? '#16a34a' : '#9ca3af', fontFamily: 'inherit' }}>
                        {t.active ? '● Active' : '○ Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(t)} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(0,0,0,.13)', borderRadius: 5, background: '#fff', color: '#444', fontFamily: 'inherit' }}>Edit</button>
                        <a href={`/pool/${t.slug}`} target="_blank" rel="noreferrer" style={{ padding: '4px 10px', fontSize: 11, cursor: 'pointer', border: '1px solid rgba(0,0,0,.13)', borderRadius: 5, background: '#fff', color: '#555', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>↗</a>
                        <button onClick={() => del(t.slug)} style={{ padding: '4px 10px', fontSize: 11, cursor: 'pointer', border: '1px solid rgba(220,38,38,.2)', borderRadius: 5, background: '#fff', color: '#dc2626', fontFamily: 'inherit' }}>✕</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, padding: '14px 0 2px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#aaa', marginRight: 4 }}>{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(0,0,0,.13)', background: '#fff', color: '#555', fontFamily: 'inherit', opacity: safePage === 1 ? .35 : 1 }}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => totalPages <= 7 || n <= 2 || n >= totalPages - 1 || Math.abs(n - safePage) <= 1).map((n, i, arr) => (
            <>
              {i > 0 && arr[i - 1] !== n - 1 && <span key={`e${n}`} style={{ fontSize: 11, color: '#aaa' }}>…</span>}
              <button key={n} onClick={() => setPage(n)} style={{ minWidth: 30, height: 30, borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: n === safePage ? '#c09030' : 'rgba(0,0,0,.12)', background: n === safePage ? '#c09030' : '#fff', color: n === safePage ? '#fff' : '#555', fontFamily: 'inherit' }}>{n}</button>
            </>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(0,0,0,.13)', background: '#fff', color: '#555', fontFamily: 'inherit', opacity: safePage === totalPages ? .35 : 1 }}>Next →</button>
        </div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '28px 28px 24px', width: '100%', maxWidth: 700, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: 0 }}>{editingSlug ? 'Edit' : 'Add'} Topic</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#999' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: editingSlug ? f.slug : autoSlug(e.target.value) }))} style={inp()} placeholder="Article title" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Slug</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} style={inp({ fontFamily: 'monospace', fontSize: 12 })} placeholder="url-friendly-slug" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="activeChk" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} style={{ accentColor: '#c09030', width: 14, height: 14, cursor: 'pointer' }} />
                <label htmlFor="activeChk" style={{ fontSize: 13, color: '#555', cursor: 'pointer' }}>Published (active)</label>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Content (Markdown)</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={16} style={{ ...inp({ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, resize: 'vertical' }) }} placeholder="Write your article in Markdown…" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding: '8px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(0,0,0,.15)', background: '#fff', color: '#444', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={save} disabled={saving || !form.title.trim() || !form.slug.trim()} style={{ padding: '8px 20px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#c09030', color: '#fff', fontFamily: 'inherit', opacity: !form.title.trim() || !form.slug.trim() ? .5 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
