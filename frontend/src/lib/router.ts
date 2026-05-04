import { useEffect, useState } from 'react'

function readHash(): string {
  const h = window.location.hash || '#/'
  return h.startsWith('#') ? h.slice(1) : h
}

export function useHashRoute(): string {
  const [path, setPath] = useState<string>(() => readHash())

  useEffect(() => {
    const onChange = () => setPath(readHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return path || '/'
}

export function navigate(path: string) {
  if (!path.startsWith('/')) path = '/' + path
  window.location.hash = path
  window.scrollTo({ top: 0, behavior: 'instant' })
}

export function buildShareLink(path: string): string {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#${path.startsWith('/') ? path : '/' + path}`
}
