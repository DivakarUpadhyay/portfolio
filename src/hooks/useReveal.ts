'use client'
import { useEffect, useRef, useState } from 'react'

export function useReveal(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          setIsVisible(true)
          io.unobserve(el)
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])

  return { ref, isVisible }
}
