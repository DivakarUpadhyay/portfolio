'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useReveal } from '@/hooks/useReveal'

interface Stat { value: number; suffix: string; label: string }
interface Profile {
  name: string; title: string; typedTitles: string[]
  resumePdf: string; stats: Stat[]; photo?: string
  github?: string; linkedin?: string
}

const CODE_SNIPPETS = [
  'async Task<T> Execute()',
  'IRepository<T>',
  'services.AddScoped<T>()',
  '.Where(x => x.IsActive)',
  'await ctx.SaveChangesAsync()',
  '[ApiController]',
  'EXEC sp_GetData @UserId',
  'IActionResult Ok(data)',
  'SELECT * FROM [dbo].[tbl_]',
  'Observable<T>.pipe(tap())',
  '@Component({ selector })',
  'new HttpClient().GetAsync()',
  'builder.Configuration.Bind()',
  'INNER JOIN tbl ON id = fk',
]

const TECH_TAGS = ['.NET 8', 'AngularJS', 'Next.js', 'Solidity', 'MSSQL']

function GitHubIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

export default function Hero({ profile }: { profile: Profile }) {
  const [typed, setTyped]   = useState('')
  const [counts, setCounts] = useState<number[]>(profile.stats.map(() => 0))
  const { ref: heroRef }    = useReveal()
  const bgRef               = useRef<HTMLDivElement>(null)
  const tiRef = useRef(0), ciRef = useRef(0), delRef = useRef(false)
  const countsStarted       = useRef(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    function tick() {
      const titles = profile.typedTitles
      const s = titles[tiRef.current]
      if (delRef.current) { ciRef.current--; setTyped(s.substring(0, ciRef.current)) }
      else                { ciRef.current++; setTyped(s.substring(0, ciRef.current)) }
      if (!delRef.current && ciRef.current === s.length) {
        timer = setTimeout(() => { delRef.current = true; tick() }, 2200); return
      }
      if (delRef.current && ciRef.current === 0) {
        delRef.current = false
        tiRef.current = (tiRef.current + 1) % titles.length
      }
      timer = setTimeout(tick, delRef.current ? 45 : 85)
    }
    const init = setTimeout(tick, 900)
    return () => { clearTimeout(init); clearTimeout(timer) }
  }, [profile.typedTitles])

  useEffect(() => {
    const el = document.getElementById('hero-stats')
    if (!el) return
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !countsStarted.current) {
        countsStarted.current = true
        profile.stats.forEach((stat, i) => {
          let n = 0; const step = stat.value / 45
          const t = setInterval(() => {
            n += step
            if (n >= stat.value) { setCounts(p => { const a=[...p]; a[i]=stat.value; return a }); clearInterval(t) }
            else                 { setCounts(p => { const a=[...p]; a[i]=Math.floor(n); return a }) }
          }, 35)
        })
      }
    }, { threshold: .5 })
    io.observe(el)
    return () => io.disconnect()
  }, [profile.stats])

  useEffect(() => {
    const bg = bgRef.current; if (!bg) return
    const spawn = () => {
      const el = document.createElement('div')
      el.className = 'code-float'
      el.textContent = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)]
      el.style.cssText = `left:${5+Math.random()*50}%;top:${55+Math.random()*35}%;animation-duration:${9+Math.random()*12}s`
      bg.appendChild(el)
      el.addEventListener('animationend', () => el.remove())
    }
    const id = setInterval(spawn, 1400)
    return () => clearInterval(id)
  }, [])

  return (
    <section id="hero" className="hero" ref={heroRef}>
      <div className="hero-bg" ref={bgRef}>
        <div className="hero-grid" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </div>

      <div className="hero-inner hero-split">
        {/* LEFT */}
        <div className="hero-content">
          <div className="hero-eyebrow">Available for new opportunities &mdash; Taiwan</div>
          <h1 className="hero-name">Divakar<br /><em>R. Upadhyay</em></h1>
          <div className="hero-title">
            <span>{typed}</span><span className="typed-cur">|</span>
          </div>
          <div className="hero-stats" id="hero-stats">
            {profile.stats.map((s, i) => (
              <div className="hero-stat" key={i}>
                <span className="hero-stat-n">{counts[i]}{s.suffix}</span>
                <span className="hero-stat-l">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="hero-btns">
            <a href="#projects" className="btn-primary">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              View My Work
            </a>
            <a href="#contact" className="btn-outline">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
              Get In Touch
            </a>
          </div>
          {(profile.github || profile.linkedin) && (
            <div className="hero-social">
              <span className="hero-social-label">Find me on</span>
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener" className="social-link github" aria-label="GitHub">
                  <GitHubIcon />
                </a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener" className="social-link linkedin" aria-label="LinkedIn">
                  <LinkedInIcon />
                </a>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — photo */}
        <div className="hero-photo-wrap">
          <div className="hero-photo-glow" />
          <div className="hero-photo-frame">
            <div className="hero-photo-ring hero-photo-ring-1" />
            <div className="hero-photo-ring hero-photo-ring-2" />
            <div className="hero-photo-border">
              <div className="hero-photo-inner">
                {profile.photo
                  ? <Image
                      src={profile.photo}
                      alt="Divakar R. Upadhyay"
                      fill
                      style={{ objectFit: 'cover', objectPosition: 'center center' }}
                      priority
                    />
                  : (
                    <div className="hero-photo-placeholder">
                      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity=".3">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                  )
                }
              </div>
            </div>
            <div className="hero-photo-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              Taiwan Gold Card Holder
            </div>
          </div>

          <div className="hero-photo-tags">
            {TECH_TAGS.map(t => <span className="hero-photo-tag" key={t}>{t}</span>)}
          </div>
        </div>
      </div>

      <div className="hero-scroll">
        <div className="hero-scroll-line" />
        Scroll to explore
      </div>
    </section>
  )
}
