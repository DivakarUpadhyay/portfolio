'use client'
import { useLayoutEffect } from 'react'
import palettes from '../../data/themes.json'

const LAYOUTS = ['split-left', 'split-right'] as const
const N = palettes.length

function dayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86400000)
}

export default function ThemeRotator() {
  useLayoutEffect(() => {
    const day = dayOfYear()
    const palette = palettes[day % N]
    const layout = LAYOUTS[Math.floor(day / N) % LAYOUTS.length]

    const root = document.documentElement
    Object.entries(palette.vars).forEach(([k, v]) => root.style.setProperty(k, v))
    root.dataset.layout = layout
  }, [])

  return null
}
