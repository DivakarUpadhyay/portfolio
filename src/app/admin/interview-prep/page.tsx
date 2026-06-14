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
const DEFAULT_CATS = ['HR/Behavioral','Technical .NET','Technical JS','System Design','Database','Web3','General']
const DIFFS = ['easy', 'medium', 'hard']
const STATUSES = ['not-practiced', 'practiced', 'confident']

type QItem = { id: string; question: string; category: string; answer: string; difficulty: string; status: string; tags: string[] }

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

export default function InterviewPrepPage() {
  const [items, setItems] = useState<QItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCat, setActiveCat] = useState('all')
  const [activeDiff, setActiveDiff] = useState('all')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({ id: '', question: '', category: 'General', answer: '', difficulty: 'medium', status: 'not-practiced', tags: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const data = await fetch('/api/admin/interview-prep').then(r => r.json()).catch(() => [])
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const cats = useMemo(() => [...new Set(items.map(i => i.category).filter(Boolean))], [items])
  const filtered = useMemo(() => items.filter(i =>
    (activeCat === 'all' || i.category === activeCat) &&
    (activeDiff === 'all' || i.difficulty === activeDiff)
  ), [items, activeCat, activeDiff])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function openAdd() {
    setForm({ id: '', question: '', category: cats[0] || 'General', answer: '', difficulty: 'medium', status: 'not-practiced', tags: '' })
    setModal(true)
  }
  function openEdit(i: QItem) {
    setForm({ ...i, tags: Array.isArray(i.tags) ? i.tags.join(', ') : (i.tags || '') })
    setModal(true)
  }
  async function save() {
    setSaving(true)
    const body = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }
    const editing = items.some(i => i.id === form.id)
    if (editing) await fetch(`/api/admin/interview-prep/${form.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    else await fetch('/api/admin/interview-prep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false); setModal(false); load()
  }
  async function del(id: string) {
    if (!confirm('Delete this question?')) return
    await fetch(`/api/admin/interview-prep/${id}`, { method: 'DELETE' })
    load()
  }

  const diffColor: Record<string, string> = { easy: '#16a34a', medium: '#c09030', hard: '#dc2626' }
  const stColor: Record<string, [string, string]> = { confident: ['#f0fdf4', '#16a34a'], practiced: ['#eff6ff', '#2563eb'], 'not-practiced': ['#fafafa', '#9ca3af'] }

  return (
    <AdminShell>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes rowIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.08em' }}>Interview Prep · {filtered.length} questions</span>
        <button onClick={openAdd} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#c09030', color: '#fff', fontFamily: 'inherit' }}>+ Add Question</button>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {['all', ...cats].map(c => (
          <button key={c} onClick={() => { setActiveCat(c); setPage(1) }} style={{ padding: '4px 11px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: activeCat === c ? '#c09030' : 'rgba(0,0,0,.12)', background: activeCat === c ? '#fff8e6' : '#fff', color: activeCat === c ? '#c09030' : '#666', fontFamily: 'inherit' }}>{c}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {['all', ...DIFFS].map(d => (
          <button key={d} onClick={() => { setActiveDiff(d); setPage(1) }} style={{ padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: activeDiff === d ? (diffColor[d] || '#c09030') : 'rgba(0,0,0,.1)', background: activeDiff === d ? (d === 'all' ? '#fff8e6' : `${diffColor[d]}18`) : '#fff', color: activeDiff === d ? (diffColor[d] || '#c09030') : '#888', fontFamily: 'inherit' }}>{d}</button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.08)', borderRadius: 10, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 64, gap: 12 }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(192,144,48,.15)', borderTopColor: '#c09030', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#ccc', textTransform: 'uppercase', letterSpacing: '.1em' }}>Loading</span>
          </div>
        ) : slice.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#bbb', fontSize: 13 }}>No questions found</div>
        ) : (
          <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid rgba(0,0,0,.07)' }}>
                {['#', 'Question', 'Category', 'Difficulty', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.07em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((item, idx) => {
                const [sbg, scol] = stColor[item.status] || ['#fafafa', '#999']
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(0,0,0,.05)', animation: `rowIn .18s ease both`, animationDelay: `${idx * 0.025}s` }}>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: '#bbb', fontFamily: 'monospace' }}>{String((safePage - 1) * PAGE_SIZE + idx + 1).padStart(2, '0')}</td>
                    <td style={{ padding: '12px 14px', maxWidth: 380 }}><span style={{ fontSize: 13, color: '#111' }}>{item.question}</span></td>
                    <td style={{ padding: '12px 14px' }}><span style={{ fontSize: 11, color: '#666', background: '#f5f5f5', borderRadius: 4, padding: '2px 7px', border: '1px solid rgba(0,0,0,.08)', whiteSpace: 'nowrap' }}>{item.category}</span></td>
                    <td style={{ padding: '12px 14px' }}><span style={{ fontSize: 11, fontWeight: 700, color: diffColor[item.difficulty] || '#666' }}>{item.difficulty}</span></td>
                    <td style={{ padding: '12px 14px' }}><span style={{ fontSize: 11, fontWeight: 600, color: scol, background: sbg, borderRadius: 4, padding: '2px 7px', border: `1px solid ${scol}33`, whiteSpace: 'nowrap' }}>{item.status}</span></td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(item)} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(0,0,0,.13)', borderRadius: 5, background: '#fff', color: '#444', fontFamily: 'inherit' }}>Edit</button>
                        <button onClick={() => del(item.id)} style={{ padding: '4px 10px', fontSize: 11, cursor: 'pointer', border: '1px solid rgba(220,38,38,.2)', borderRadius: 5, background: '#fff', color: '#dc2626', fontFamily: 'inherit' }}>✕</button>
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
          <div style={{ background: '#fff', borderRadius: 12, padding: '28px 28px 24px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: 0 }}>{items.some(i => i.id === form.id) ? 'Edit' : 'Add'} Question</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#999' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Question</label>
                <textarea value={form.question || ''} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} rows={2} style={{ ...inp(), resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[['category', 'Category', [...new Set([...DEFAULT_CATS, ...cats])]], ['difficulty', 'Difficulty', DIFFS], ['status', 'Status', STATUSES]].map(([k, lbl, opts]) => (
                  <div key={k as string}>
                    <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>{lbl as string}</label>
                    <select value={form[k as string] || ''} onChange={e => setForm(f => ({ ...f, [k as string]: e.target.value }))} style={inp()}>
                      {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Tags (comma-separated)</label>
                <input value={form.tags || ''} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} style={inp()} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Answer / Notes</label>
                <textarea value={form.answer || ''} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} rows={5} style={{ ...inp(), resize: 'vertical' }} />
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
