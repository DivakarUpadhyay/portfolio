'use client'
import { useEffect, useState } from 'react'

interface Props { initials: string; resumePdf: string }

const SECTIONS = ['about','experience','projects','education','contact']

export default function Nav({ initials, resumePdf }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)
  const [active, setActive]     = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    SECTIONS.forEach(id => {
      const el = document.getElementById(id)
      if (!el) return
      const io = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id) },
        { rootMargin: '-40% 0px -55% 0px' }
      )
      io.observe(el)
      observers.push(io)
    })
    return () => observers.forEach(io => io.disconnect())
  }, [])

  const close = () => setOpen(false)

  return (
    <>
      <div className={`mob-menu${open ? ' open' : ''}`}>
        <a href="#about"      onClick={close}>About</a>
        <a href="#experience" onClick={close}>Experience</a>
        <a href="#projects"   onClick={close}>Projects</a>
        <a href="#education"  onClick={close}>Education</a>
        <a href="#contact"    onClick={close}>Contact</a>
        <a href={resumePdf} download onClick={close}>Download CV</a>
      </div>

      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <a href="#hero" className="nav-logo">
          {initials}<span>.dev</span>
        </a>

        <ul className="nav-links">
          {SECTIONS.map(id => (
            <li key={id}>
              <a href={`#${id}`} className={active === id ? 'active' : ''}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            </li>
          ))}
        </ul>

        <a href={resumePdf} download className="nav-cv">Download CV</a>

        <button className="nav-burger" onClick={() => setOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>
    </>
  )
}
