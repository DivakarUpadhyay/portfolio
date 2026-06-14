'use client'
import { useState } from 'react'
import { useReveal } from '@/hooks/useReveal'

interface DemoProject {
  id: string; name: string; description: string
  tags: string[]; category: string
  github: string; demo: string; screenshot: string
  active?: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  web:      'Web',
  mobile:   'Mobile',
  api:      'API / Backend',
  cli:      'CLI / Tool',
  web3:     'Web3',
  ml:       'ML / AI',
  other:    'Other',
}

function DemoCard({ p, onZoom }: { p: DemoProject; onZoom: (src: string) => void }) {
  const { ref } = useReveal()
  return (
    <div ref={ref} className="pj-card reveal">
      <div
        className="pj-shot"
        onMouseEnter={() => p.screenshot && onZoom(p.screenshot)}
      >
        {p.screenshot
          /* eslint-disable-next-line @next/next/no-img-element */
          ? <img src={p.screenshot} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .5s' }} />
          : (
            <div className="pj-placeholder">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity=".4">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p>Add Screenshot</p>
            </div>
          )
        }
        {p.screenshot && (
          <div className="pj-overlay">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
            Zoom
          </div>
        )}
        {p.category && CATEGORY_LABELS[p.category] && (
          <div className="pj-cat-badge">{CATEGORY_LABELS[p.category]}</div>
        )}
      </div>

      <div className="pj-body">
        <div className="pj-name">{p.name}</div>
        <div className="pj-desc">{p.description}</div>

        <div className="pj-tags">
          {p.tags.map(t => <span className="pj-tag" key={t}>{t}</span>)}
        </div>

        <div className="pj-links">
          {p.github
            ? (
              <a href={p.github} target="_blank" rel="noopener" className="pj-link">
                <GitHubIcon /> GitHub
              </a>
            )
            : <span className="pj-link-ph"><GitHubIcon /> GitHub</span>
          }
          {p.demo
            ? (
              <a href={p.demo} target="_blank" rel="noopener" className="pj-link demo">
                <ExternalIcon /> Live Demo
              </a>
            )
            : <span className="pj-link-ph"><ExternalIcon /> Live Demo</span>
          }
        </div>
      </div>
    </div>
  )
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="lb-overlay" onClick={onClose} onMouseLeave={onClose}>
      <div className="lb-inner" onClick={e => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Screenshot" className="lb-img" />
        <button className="lb-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

function GitHubIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

const ALL_CATS = ['all', ...Object.keys(CATEGORY_LABELS)]

export default function DemoProjects({ items }: { items: DemoProject[] }) {
  const [filter, setFilter]   = useState('all')
  const [lightbox, setLightbox] = useState<string | null>(null)
  const { ref: headRef } = useReveal()

  const activeItems = items.filter(p => p.active !== false)
  if (!activeItems || activeItems.length === 0) return null

  const usedCats = new Set(activeItems.map(p => p.category))
  const filters  = ALL_CATS.filter(c => c === 'all' || usedCats.has(c))
  const shown    = filter === 'all' ? activeItems : activeItems.filter(p => p.category === filter)

  return (
    <section id="demo-projects" className="section">
      <div className="section-inner">
        <div className="section-head reveal" ref={headRef}>
          <div className="section-label">Personal Work</div>
          <h2 className="section-title">Demo <em>projects</em><br />&amp; experiments</h2>
        </div>

        {filters.length > 2 && (
          <div className="pj-filter">
            {filters.map(c => (
              <button
                key={c}
                className={`pj-btn${filter === c ? ' active' : ''}`}
                onClick={() => setFilter(c)}
              >
                {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        )}

        <div className="pj-grid">
          {shown.map(p => (
            <DemoCard key={p.id} p={p} onZoom={setLightbox} />
          ))}
        </div>
      </div>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </section>
  )
}
