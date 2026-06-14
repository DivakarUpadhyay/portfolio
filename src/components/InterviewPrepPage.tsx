'use client'

import { useState, useCallback } from 'react'
import type { InterviewItem } from '@/app/interview-preparation/page'

interface Props {
  items: InterviewItem[]
}

const ALL_CATS = ['All', 'HR/Behavioral', 'Technical .NET', 'Technical JS', 'System Design', 'Database', 'Web3', 'General']
const ALL_DIFFS = ['All', 'Easy', 'Medium', 'Hard']
const ALL_STATUSES = ['All', 'Todo', 'In Progress', 'Done']

function diffBadge(d: string) {
  if (d === 'Easy') return <span className="diff-badge diff-badge--easy">🟢 Easy</span>
  if (d === 'Hard') return <span className="diff-badge diff-badge--hard">🔴 Hard</span>
  return <span className="diff-badge diff-badge--medium">🟡 Medium</span>
}

function IPrepCard({ item, onStatusChange }: { item: InterviewItem; onStatusChange: (id: string, status: string) => void }) {
  const [answerOpen, setAnswerOpen] = useState(false)
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
        body: JSON.stringify({ table: 'interview_prep', id: item.id, status: next }),
      })
      onStatusChange(item.id, next)
    } finally {
      setUpdating(false)
    }
  }, [done, item.id, onStatusChange])

  return (
    <div className={`iprep-card${done ? ' iprep-card--done' : ''}`}>
      <div className="iprep-card-top">
        <button
          className={`learn-check${done ? ' learn-check--done' : ''}`}
          onClick={handleCheck}
          disabled={updating}
          aria-label={done ? 'Mark as not done' : 'Mark as done'}
        >
          {done ? '✓' : ''}
        </button>
        <div className="iprep-card-body">
          <div className="iprep-meta">
            {diffBadge(item.difficulty)}
            <span className={`learn-status-badge status-${localStatus.toLowerCase().replace(' ', '-')}`}>
              {localStatus}
            </span>
          </div>
          <p className={`iprep-question${done ? ' iprep-question--done' : ''}`}>{item.question}</p>
          {item.answer && (
            <div className="iprep-answer-wrap">
              <button className="learn-notes-toggle" onClick={() => setAnswerOpen(v => !v)}>
                {answerOpen ? '▲ Hide answer' : '▼ Show answer / notes'}
              </button>
              {answerOpen && <div className="iprep-answer">{item.answer}</div>}
            </div>
          )}
          {item.tags && item.tags.length > 0 && (
            <div className="learn-tags" style={{ marginTop: '8px' }}>
              {item.tags.map((t, i) => <span key={i} className="learn-tag">{t}</span>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InterviewPrepPage({ items: initialItems }: Props) {
  const [items, setItems] = useState<InterviewItem[]>(initialItems)
  const [catFilter, setCatFilter] = useState('All')
  const [diffFilter, setDiffFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const handleStatusChange = useCallback((id: string, status: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, status: status as InterviewItem['status'] } : it))
  }, [])

  const filtered = items.filter(it => {
    const catOk = catFilter === 'All' || it.category === catFilter
    const diffOk = diffFilter === 'All' || it.difficulty === diffFilter
    const statusOk = statusFilter === 'All' || it.status === statusFilter
    return catOk && diffOk && statusOk
  })

  const doneCount = items.filter(it => it.status === 'Done').length
  const total = items.length
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  const grouped: Record<string, InterviewItem[]> = {}
  for (const it of filtered) {
    const cat = it.category || 'General'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(it)
  }

  return (
    <div className="iprep-page">
      <div className="learn-header">
        <div className="section-label">Preparation</div>
        <h1 className="section-title">Interview <em>Preparation</em></h1>
        <p className="learn-sub">Curated questions and prepared answers for technical and behavioral interviews.</p>
        <div className="learn-progress">
          <div className="learn-progress-info">
            <span>{doneCount} of {total} reviewed</span>
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
          {ALL_DIFFS.map(d => (
            <button
              key={d}
              className={`pj-btn${diffFilter === d ? ' active' : ''}`}
              onClick={() => setDiffFilter(d)}
            >
              {d}
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
        <div className="learn-empty">No questions match the selected filters.</div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="learn-group">
            <div className="learn-group-header">
              <span className="learn-group-name">{cat}</span>
              <span className="learn-group-count">{catItems.filter(i => i.status === 'Done').length}/{catItems.length}</span>
            </div>
            <div className="learn-cards">
              {catItems.map(it => (
                <IPrepCard key={it.id} item={it} onStatusChange={handleStatusChange} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
