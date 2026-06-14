'use client'
import { useEffect, useRef, useState } from 'react'

export default function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ref.current) return
    let cancelled = false

    import('mermaid').then(m => {
      if (cancelled) return
      m.default.initialize({
        startOnLoad: false,
        theme: 'default',
        themeVariables: {
          primaryColor: '#e8f0fe',
          primaryTextColor: '#111',
          primaryBorderColor: '#b0bec5',
          lineColor: '#546e7a',
          secondaryColor: '#f5f5f5',
          tertiaryColor: '#fafafa',
          background: '#ffffff',
          mainBkg: '#f0f4ff',
          nodeBorder: '#90a4ae',
          clusterBkg: '#f5f7ff',
          titleColor: '#111',
          edgeLabelBackground: '#fff',
          nodeTextColor: '#111',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: '13px',
        },
      })
      const id = 'mmd-' + Math.random().toString(36).slice(2, 8)
      m.default.render(id, code.trim())
        .then(({ svg }) => {
          if (cancelled || !ref.current) return
          ref.current.innerHTML = svg
        })
        .catch(err => {
          if (cancelled) return
          setError(String(err?.message || err))
        })
    })

    return () => { cancelled = true }
  }, [code])

  if (error) {
    return (
      <pre className="mermaid-error">
        <code>{'[Diagram error] ' + error + '\n\n' + code}</code>
      </pre>
    )
  }

  return <div ref={ref} className="mermaid-block" />
}
