'use client'
import { useReveal } from '@/hooks/useReveal'

export default function ResumeSection({ resumePdf }: { resumePdf: string }) {
  const { ref } = useReveal()
  return (
    <section id="resume" className="section section-alt">
      <div className="section-inner">
        <div className="resume-box reveal" ref={ref}>
          <div className="resume-icon">
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className="resume-title">My Resume</div>
          <div className="resume-subtitle">
            8+ years of enterprise software experience, distilled into one document.<br />
            Download instantly or view in your browser.
          </div>
          <div className="resume-btns">
            <a href={resumePdf} download="Divakar-SoftwareEngineer.pdf" className="btn-primary">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PDF
            </a>
            <a href={resumePdf} target="_blank" rel="noopener" className="btn-outline">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View Online
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
