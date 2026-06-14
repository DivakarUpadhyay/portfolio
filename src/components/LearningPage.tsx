'use client'

import { useState, useCallback } from 'react'
import type { LearningItem } from '@/app/learning/page'

interface Props {
  items: LearningItem[]
}

const ALL_CATS = ['All', '.NET/C#', 'JavaScript', 'DSA', 'System Design', 'SQL/DB', 'Web3', 'DevOps', 'Other']
const ALL_STATUSES = ['All', 'Todo', 'In Progress', 'Done']

function fileIcon(name: string) {
  const ext = (name || '').split('.').pop()?.toLowerCase() ?? ''
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️'
  if (ext === 'pdf') return '📄'
  if (['xlsx', 'xls'].includes(ext)) return '📊'
  if (['docx', 'doc'].includes(ext)) return '📝'
  if (ext === 'csv') return '📋'
  return '📎'
}

function priorityBadge(p: string) {
  if (p === 'High') return <span className="learn-priority high">🔴 High</span>
  if (p === 'Low') return <span className="learn-priority low">🟢 Low</span>
  return <span className="learn-priority medium">🟡 Medium</span>
}

function LearningCard({ item, onStatusChange }: { item: LearningItem; onStatusChange: (id: string, status: string) => void }) {
  const [notesOpen, setNotesOpen] = useState(false)
  const [localStatus, setLocalStatus] = useState(item.status)
  const [updating, setUpdating] = useState(false)
  const done = localStatus === 'Done'

  const handleCheck = useCallback(async () => {
    const next = done ? 'Todo' : 'Done'
    setLocalStatus(next)
    setUpdating(true)
    try {
      await fetch('/api/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'learnings', id: item.id, status: next }),
      })
      onStatusChange(item.id, next)
    } finally {
      setUpdating(false)
    }
  }, [done, item.id, onStatusChange])

  return (
    <div className={`learn-card${done ? ' learn-card--done' : ''}`}>
      <div className="learn-card-top">
        <button
          className={`learn-check${done ? ' learn-check--done' : ''}`}
          onClick={handleCheck}
          disabled={updating}
          aria-label={done ? 'Mark as not done' : 'Mark as done'}
        >
          {done ? '✓' : ''}
        </button>
        <div className="learn-card-info">
          <div className="learn-title-row">
            <span className={`learn-title${done ? ' learn-title--done' : ''}`}>{item.title}</span>
            {priorityBadge(item.priority)}
          </div>
          {item.description && (
            <p className="learn-desc">{item.description}</p>
          )}
          {item.notes && (
            <div className="learn-notes-wrap">
              <button className="learn-notes-toggle" onClick={() => setNotesOpen(v => !v)}>
                {notesOpen ? '▲ Hide notes' : '▼ Show notes'}
              </button>
              {notesOpen && <div className="learn-notes">{item.notes}</div>}
            </div>
          )}
          {item.files && item.files.length > 0 && (
            <div className="learn-files">
              {item.files.map((f, i) => (
                <a key={i} className="file-dl-link" href={f.url} target="_blank" rel="noopener noreferrer">
                  {fileIcon(f.name)} {f.name}
                </a>
              ))}
            </div>
          )}
          {item.tags && item.tags.length > 0 && (
            <div className="learn-tags">
              {item.tags.map((t, i) => <span key={i} className="learn-tag">{t}</span>)}
            </div>
          )}
        </div>
        <span className={`learn-status-badge status-${localStatus.toLowerCase().replace(' ', '-')}`}>
          {localStatus}
        </span>
      </div>
    </div>
  )
}

export default function LearningPage({ items: initialItems }: Props) {
  const [items, setItems] = useState<LearningItem[]>(initialItems)
  const [catFilter, setCatFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const handleStatusChange = useCallback((id: string, status: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, status: status as LearningItem['status'] } : it))
  }, [])

  const filtered = items.filter(it => {
    const catOk = catFilter === 'All' || it.category === catFilter
    const statusOk = statusFilter === 'All' || it.status === statusFilter
    return catOk && statusOk
  })

  const doneCount = items.filter(it => it.status === 'Done').length
  const total = items.length
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  // Group by category (only categories with visible items)
  const grouped: Record<string, LearningItem[]> = {}
  for (const it of filtered) {
    const cat = it.category || 'Other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(it)
  }

  return (
    <div className="learn-page">
      <div className="learn-header">
        <div className="section-label">Learning</div>
        <h1 className="section-title">My Learning <em>Journey</em></h1>
        <p className="learn-sub">Tracking technologies, concepts and skills I&rsquo;m actively studying.</p>
        <div className="learn-progress">
          <div className="learn-progress-info">
            <span>{doneCount} of {total} completed</span>
            <span>{pct}%</span>
          </div>
          <div className="learn-progress-bar">
            <div className="learn-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="learn-filter-wrap">
        <div className="learn-filter">
          {ALL_CATS.map(c => (
            <button
              key={c}
              className={`pj-btn${catFilter === c ? ' active' : ''}`}
              onClick={() => setCatFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="learn-filter" style={{ marginTop: '8px' }}>
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              className={`pj-btn${statusFilter === s ? ' active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="learn-empty">No items match the selected filters.</div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="learn-group">
            <div className="learn-group-header">
              <span className="learn-group-name">{cat}</span>
              <span className="learn-group-count">{catItems.filter(i => i.status === 'Done').length}/{catItems.length}</span>
            </div>
            <div className="learn-cards">
              {catItems.map(it => (
                <LearningCard key={it.id} item={it} onStatusChange={handleStatusChange} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
