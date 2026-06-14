'use client'
import { useReveal } from '@/hooks/useReveal'

const degrees = [
  {
    degree: 'Master of Science',
    field: 'Computer Science',
    school: 'E. S. Andrades College of Science\nUniversity of Mumbai, Maharashtra',
    year: 'Aug 2014',
  },
  {
    degree: 'Bachelor of Science',
    field: 'Computer Science',
    school: 'Bhaskar Waman Thakur College of Science\nUniversity of Mumbai, Maharashtra',
    year: 'Jul 2011',
  },
]

function EduCard({ d }: { d: typeof degrees[0] }) {
  const { ref } = useReveal()
  return (
    <div ref={ref} className="edu-card reveal">
      <div className="edu-degree">{d.degree}</div>
      <div className="edu-field">{d.field}</div>
      <div className="edu-school">{d.school.split('\n').map((l, i) => <span key={i}>{l}{i === 0 && <br />}</span>)}</div>
      <div className="edu-year">{d.year}</div>
    </div>
  )
}

export default function Education() {
  const { ref: headRef } = useReveal()
  return (
    <section id="education" className="section">
      <div className="section-inner">
        <div className="section-head reveal" ref={headRef}>
          <div className="section-label">Academic Background</div>
          <h2 className="section-title">Academic <em>foundation</em></h2>
        </div>
        <div className="edu-grid">
          {degrees.map(d => <EduCard key={d.degree} d={d} />)}
        </div>
      </div>
    </section>
  )
}
