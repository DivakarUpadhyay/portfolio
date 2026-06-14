'use client'
import { useEffect, useState } from 'react'

let showToastFn: ((msg: string) => void) | null = null

export function showToast(msg: string) {
  showToastFn?.(msg)
}

export default function Toast() {
  const [msg, setMsg]     = useState('')
  const [visible, setVis] = useState(false)

  useEffect(() => {
    showToastFn = (m: string) => {
      setMsg(m); setVis(true)
      setTimeout(() => setVis(false), 2600)
    }
    return () => { showToastFn = null }
  }, [])

  return (
    <div className={`toast${visible ? ' show' : ''}`}>{msg}</div>
  )
}
