'use client'
import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const mx = useRef(0), my = useRef(0)
  const rx = useRef(0), ry = useRef(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer:fine)').matches) return

    const move = (e: MouseEvent) => {
      mx.current = e.clientX; my.current = e.clientY
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + 'px'
        dotRef.current.style.top  = e.clientY + 'px'
      }
    }

    const animRing = () => {
      rx.current += (mx.current - rx.current) * 0.13
      ry.current += (my.current - ry.current) * 0.13
      if (ringRef.current) {
        ringRef.current.style.left = rx.current + 'px'
        ringRef.current.style.top  = ry.current + 'px'
      }
      raf.current = requestAnimationFrame(animRing)
    }

    document.addEventListener('mousemove', move)
    raf.current = requestAnimationFrame(animRing)
    return () => {
      document.removeEventListener('mousemove', move)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <>
      <div ref={dotRef}  className="cursor" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  )
}
