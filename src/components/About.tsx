'use client'
import { useReveal } from '@/hooks/useReveal'

interface SkillTag   { name: string; primary: boolean }
interface SkillGroup { group: string; tags: SkillTag[] }
interface Profile {
  bio: string[]; email: string; phone: string; lineId: string
  location: string; availability: string; visa?: string
}

const EXPERTISE = [
  {
    title: 'Enterprise Backend',
    desc: '.NET 8 Clean Architecture, Dapper ORM, MSSQL. Complex business logic built for scale.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
  },
  {
    title: 'Full-Stack Web',
    desc: 'AngularJS, Next.js 16 — from admin dashboards to investor portals with real-time data.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
  {
    title: 'Third-Party Integrations',
    desc: 'EDI/logistics (FedEx, TNT, DHL), payment gateways, KYC platforms (Sumsub), healthcare APIs.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7M11 18H8a2 2 0 0 1-2-2V9"/>
      </svg>
    ),
  },
  {
    title: 'Blockchain / Web3',
    desc: 'Solidity smart contracts, UUPS upgradeable proxy, on-chain compliance gates, Hardhat deployment pipelines.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    title: 'Team Leadership',
    desc: 'Led 5+ developer teams, sprint planning, code reviews, UAT release cycles, knowledge transfer sessions.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    title: 'System Architecture',
    desc: 'Clean Architecture, microservices, repository pattern, CI/CD pipelines on Azure DevOps and AWS.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
      </svg>
    ),
  },
]

export default function About({ profile, skills }: { profile: Profile; skills: SkillGroup[] }) {
  const { ref: headRef     } = useReveal()
  const { ref: leftRef     } = useReveal()
  const { ref: rightRef    } = useReveal()
  const { ref: expertRef   } = useReveal()

  return (
    <section id="about" className="section">
      <div className="section-inner">
        <div className="section-head reveal" ref={headRef}>
          <div className="section-label">Who I Am</div>
          <h2 className="section-title">Crafting <em>enterprise</em><br />systems since 2015</h2>
        </div>

        <div className="about-grid">
          <div ref={leftRef} className="reveal">
            {profile.bio.map((p, i) => (
              <p key={i} className="about-bio" dangerouslySetInnerHTML={{ __html: p }} />
            ))}

            <div className="about-meta">
              <div className="meta-item">
                <span className="meta-key">Location</span>
                <span className="meta-val">{profile.location}</span>
              </div>
              <div className="meta-item">
                <span className="meta-key">Email</span>
                <span className="meta-val">
                  <a href={`mailto:${profile.email}`}>{profile.email}</a>
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-key">Phone / WhatsApp</span>
                <span className="meta-val">{profile.phone}</span>
              </div>
              <div className="meta-item">
                <span className="meta-key">Line ID</span>
                <span className="meta-val">{profile.lineId}</span>
              </div>
              <div className="meta-item">
                <span className="meta-key">Education</span>
                <span className="meta-val">MSc Computer Science</span>
              </div>
              <div className="meta-item">
                <span className="meta-key">Status</span>
                <span className="meta-val meta-available">{profile.availability}</span>
              </div>
              {profile.visa && (
                <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="meta-key">Work Authorization</span>
                  <span className="meta-val" style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>🇹🇼</span> {profile.visa}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div ref={rightRef} className="reveal">
            {skills.map(sg => (
              <div className="skill-group" key={sg.group}>
                <div className="skill-group-label">{sg.group}</div>
                <div className="skill-tags">
                  {sg.tags.map(t => (
                    <span key={t.name} className={`skill-tag${t.primary ? ' primary' : ''}`}>{t.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What I Do */}
        <div className="expertise-grid reveal" ref={expertRef}>
          {EXPERTISE.map(e => (
            <div className="expertise-card" key={e.title}>
              <div className="expertise-icon">{e.icon}</div>
              <div className="expertise-title">{e.title}</div>
              <div className="expertise-desc">{e.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
