'use client'
import { useState } from 'react'
import { useReveal } from '@/hooks/useReveal'

interface ExperienceItem {
  period: string; role: string; company: string; companyUrl: string
  client: string; badge: string; highlights: string[]; tech: string[]
}

function TlItem({ item, index, isOpen, onToggle }: {
  item: ExperienceItem; index: number; isOpen: boolean; onToggle: () => void
}) {
  const { ref, isVisible } = useReveal()
  return (
    <div ref={ref} className={`tl-item reveal${isVisible ? ' visible' : ''}${isOpen ? ' open' : ''}`} onClick={onToggle}>
      <div className="tl-head">
        <div>
          <div className="tl-period">{item.period}</div>
          <div className="tl-role">{item.role}</div>
          <div className="tl-company">
            <a href={item.companyUrl} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}>
              {item.company}
            </a>
            {item.client && <> &mdash; <span style={{ color: 'var(--textm)', fontSize: 12 }}>{item.client}</span></>}
          </div>
        </div>
        <div className="tl-right">
          <div className="tl-badge">{item.badge}</div>
          <div className="tl-chevron">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      <div className="tl-body">
        <div className="tl-body-inner">
          <div>
            {item.highlights.map((h, i) => (
              <div className="tl-pt" key={i}>{h}</div>
            ))}
          </div>
          <div className="tl-tech-label">Technologies Used</div>
          <div className="tl-tech-tags">
            {item.tech.map(t => <span className="tl-tech-tag" key={t}>{t}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Experience({ items }: { items: ExperienceItem[] }) {
  const [open, setOpen] = useState<number>(0)
  const { ref: headRef } = useReveal()

  return (
    <section id="experience" className="section">
      <div className="section-inner">
        <div className="section-head reveal" ref={headRef}>
          <div className="section-label">Work History</div>
          <h2 className="section-title">8+ years <em>building</em><br />production systems</h2>
        </div>

        <div className="timeline">
          {items.map((item, i) => (
            <TlItem
              key={i} item={item} index={i}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
