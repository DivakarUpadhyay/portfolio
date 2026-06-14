'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { TopicMeta } from '@/lib/supabase'

const PAGE_SIZE = 12

function excerpt(content: string) {
  return (content ?? '')
    .replace(/#{1,6}\s+[^\n]*/g, '')
    .replace(/[*_`>\-\[\]!#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140)
}

export default function PoolTable({ topics }: { topics: TopicMeta[] }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return topics
    return topics.filter(t =>
      t.title.toLowerCase().includes(q) ||
      excerpt(t.content).toLowerCase().includes(q)
    )
  }, [query, topics])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE
  const slice = filtered.slice(start, start + PAGE_SIZE)

  const handleSearch = (q: string) => {
    setQuery(q)
    setPage(1)
  }

  const goTo = (n: number) => {
    setPage(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="pool-table-section">
      <div className="pool-table-toolbar">
        <span className="pool-table-meta">
          {query ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query}"` : `${topics.length} topics`}
        </span>
        <div className="pool-search-wrap">
          <svg className="pool-search-icon" viewBox="0 0 20 20" fill="none">
            <circle cx="8.5" cy="8.5" r="5.5" stroke="#999" strokeWidth="1.5"/>
            <path d="M13 13l3.5 3.5" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            className="pool-search"
            type="text"
            placeholder="Search topics..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
          />
          {query && (
            <button className="pool-search-clear" onClick={() => handleSearch('')} aria-label="Clear">×</button>
          )}
        </div>
      </div>

      <div className="pool-table-wrap">
        <table className="pool-table">
          <thead>
            <tr>
              <th className="pool-th pool-th-num">#</th>
              <th className="pool-th">Topic</th>
              <th className="pool-th pool-th-date">Published</th>
              <th className="pool-th pool-th-action"></th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={4} className="pool-no-results">No topics match your search.</td>
              </tr>
            ) : slice.map((topic, i) => {
              const date = new Date(topic.created_at)
              const dateStr = isNaN(date.getTime())
                ? '—'
                : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
              const ex = excerpt(topic.content)
              return (
                <tr key={topic.slug} className="pool-row">
                  <td className="pool-td pool-td-num">{String(start + i + 1).padStart(2, '0')}</td>
                  <td className="pool-td pool-td-title">
                    <Link href={`/pool/${topic.slug}`} className="pool-topic-link">
                      {topic.title}
                    </Link>
                    {ex && (
                      <p className="pool-excerpt">
                        {ex}{ex.length === 140 ? '…' : ''}
                      </p>
                    )}
                  </td>
                  <td className="pool-td pool-td-date">{dateStr}</td>
                  <td className="pool-td pool-td-action">
                    <Link href={`/pool/${topic.slug}`} className="pool-read-btn">Read →</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pool-pagination">
          <button className="pool-page-btn" onClick={() => goTo(Math.max(1, page - 1))} disabled={page === 1}>
            ← Prev
          </button>
          <div className="pool-page-nums">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={`pool-page-num${n === page ? ' active' : ''}`}
                onClick={() => goTo(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <button className="pool-page-btn" onClick={() => goTo(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
