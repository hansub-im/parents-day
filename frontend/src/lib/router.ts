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

/** 단톡 공유용 링크는 항상 운영 도메인 기준으로 만든다. */
const SHARE_BASE = 'https://www.im-hansub.co.kr'

export function buildShareLink(path: string): string {
  const p = path.startsWith('/') ? path : '/' + path
  return `${SHARE_BASE}/#${p}`
}
