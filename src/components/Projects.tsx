'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useReveal } from '@/hooks/useReveal'

interface CompanyProject {
  id: string; type: string; name: string; description: string
  tags: string[]; category: string; featured: boolean
  github?: string; demo?: string
  screenshot?: string
  screenshots?: string[]
  status?: string
}

function CarouselShot({ p }: { p: CompanyProject }) {
  const shots = p.screenshots && p.screenshots.length > 0 ? p.screenshots : []
  const [idx, setIdx] = useState(0)

  const next = (e: React.MouseEvent) => {
    e.preventDefault()
    setIdx(i => (i + 1) % shots.length)
  }
  const prev = (e: React.MouseEvent) => {
    e.preventDefault()
    setIdx(i => (i - 1 + shots.length) % shots.length)
  }

  return (
    <div className="pj-shot pj-carousel">
      {shots[idx]
        ? <Image src={shots[idx]} alt={`${p.name} screenshot ${idx + 1}`} fill style={{ objectFit: 'cover' }} />
        : (
          <div className="pj-placeholder">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity=".4">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p>Screenshot {idx + 1}</p>
          </div>
        )
      }

      {/* Prev / Next arrows */}
      {shots.length > 1 && (
        <>
          <button className="pj-carousel-btn pj-carousel-prev" onClick={prev} aria-label="Previous screenshot">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button className="pj-carousel-btn pj-carousel-next" onClick={next} aria-label="Next screenshot">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Dots */}
          <div className="pj-carousel-dots">
            {shots.map((_, i) => (
              <button
                key={i}
                className={`pj-carousel-dot${i === idx ? ' active' : ''}`}
                onClick={e => { e.preventDefault(); setIdx(i); }}
                aria-label={`Screenshot ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Counter badge */}
      {shots.length > 1 && (
        <div className="pj-carousel-count">{idx + 1} / {shots.length}</div>
      )}

      {p.featured && <div className="pj-feat-badge">Featured</div>}
      <div className="pj-contrib-badge">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
        </svg>
        Contributed
      </div>
    </div>
  )
}

function WorkCard({ p, onZoom }: { p: CompanyProject; onZoom: (src: string) => void }) {
  const { ref } = useReveal()
  const isMulti = p.screenshots && p.screenshots.length > 1

  return (
    <div ref={ref} className="pj-card reveal">
      {isMulti ? (
        <CarouselShot p={p} />
      ) : p.demo ? (
        <a href={p.demo} target="_blank" rel="noopener noreferrer" className="pj-shot pj-shot-link">
          {p.screenshot
            ? <Image src={p.screenshot} alt={p.name} fill style={{ objectFit: 'cover' }} />
            : (
              <div className="pj-placeholder">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity=".4">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p>Screenshot Coming</p>
              </div>
            )
          }
          <div className="pj-overlay">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Visit Site
          </div>
          {p.featured && <div className="pj-feat-badge">Featured</div>}
          <div className="pj-contrib-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
            Contributed
          </div>
        </a>
      ) : (
        <div className="pj-shot" onMouseEnter={() => p.screenshot && onZoom(p.screenshot)}>
          {p.screenshot
            ? <Image src={p.screenshot} alt={p.name} fill style={{ objectFit: 'cover' }} />
            : (
              <div className="pj-placeholder">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity=".4">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p>Screenshot Coming</p>
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
          {p.featured && <div className="pj-feat-badge">Featured</div>}
          <div className="pj-contrib-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
            Contributed
          </div>
        </div>
      )}

      <div className="pj-body">
        <div className="pj-type">
          {p.type}
          {p.status === 'in-progress' && (
            <span className="pj-status-badge">● In Progress</span>
          )}
        </div>
        <div className="pj-name">{p.name}</div>
        <div className="pj-desc">{p.description}</div>
        <div className="pj-tags">
          {p.tags.map(t => <span className="pj-tag" key={t}>{t}</span>)}
        </div>
        <div className="pj-confidential">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 5 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Internal / Confidential
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

export default function Projects({ items }: { items: CompanyProject[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const { ref: headRef } = useReveal()

  return (
    <section id="projects" className="section section-alt">
      <div className="section-inner">
        <div className="section-head reveal" ref={headRef}>
          <div className="section-label">Professional Work</div>
          <h2 className="section-title">Projects I <em>built</em><br />& contributed to</h2>
        </div>

        <div className="pj-grid">
          {items.map(p => (
            <WorkCard key={p.id} p={p} onZoom={setLightbox} />
          ))}
        </div>
      </div>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </section>
  )
}
