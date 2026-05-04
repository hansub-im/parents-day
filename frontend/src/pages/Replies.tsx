import { useEffect, useMemo, useState } from 'react'
import {
  RECIPIENTS,
  recipientLabelFor,
  recipientPrimary,
  type FamilyId,
  type Recipient,
} from '../config/family'
import {
  getCurrentWriter,
  getReplyForCousin,
  type Reply,
} from '../lib/storage'
import { navigate } from '../lib/router'

type ReplyEntry = { reply: Reply; kind: 'individual' | 'common' } | undefined

export default function Replies() {
  const writer = useMemo(() => getCurrentWriter(), [])

  if (!writer) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl mb-5">🌷</p>
        <h2 className="font-display text-2xl text-stone-800 mb-2">
          먼저 본인 이름을 골라주세요
        </h2>
        <p className="text-sm text-stone-500 mb-6 max-w-xs">
          어느 가족의 사촌인지 알아야 본인 앞으로 온 답장을 보여드릴 수 있어요.
        </p>
        <button
          type="button"
          onClick={() => navigate('/write')}
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-2xl transition"
        >
          편지 쓰러 가기
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col px-5 py-6 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/write')}
          className="text-sm text-stone-400 hover:text-stone-600"
        >
          ← 편지 쓰기
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-xs text-stone-400 hover:text-stone-600"
        >
          처음으로
        </button>
      </div>

      <div className="my-auto py-8 w-full">
        <header className="text-center mb-10">
          <p className="text-xs tracking-[0.4em] text-rose-400 uppercase mb-3">
            For. {writer.name}
          </p>
          <h1 className="font-display text-4xl text-stone-800 mb-3">
            가족이 보낸 답장
          </h1>
          <p className="text-sm text-stone-500 leading-relaxed">
            어버이날에 부모님들께서<br />
            전해주신 답장이에요
          </p>
        </header>

        <ul className="space-y-4">
          {RECIPIENTS.map((r) => (
            <li key={r.id}>
              <ReplyCard
                recipient={r}
                cousinName={writer.name}
                writerFamilyId={writer.familyId}
              />
            </li>
          ))}
        </ul>
      </div>

      <footer className="mt-12 text-center text-xs text-stone-400">
        🌷 가족, 늘 감사합니다
      </footer>
    </div>
  )
}

function ReplyCard({
  recipient,
  cousinName,
  writerFamilyId,
}: {
  recipient: Recipient
  cousinName: string
  writerFamilyId: FamilyId
}) {
  const [result, setResult] = useState<ReplyEntry>(undefined)
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false
    getReplyForCousin(recipient.id, cousinName).then((r) => {
      if (cancelled) return
      setResult(r)
      setLoaded(true)
      if (r) setOpen(true)
    })
    return () => {
      cancelled = true
    }
  }, [recipient.id, cousinName])

  const label = recipientLabelFor(recipient.id, writerFamilyId)

  return (
    <div
      className={[
        'rounded-2xl bg-white border overflow-hidden',
        result
          ? 'border-rose-200 shadow-sm shadow-rose-100/60'
          : 'border-stone-200',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!result}
        className={[
          'w-full text-left px-5 py-4 flex items-center justify-between gap-3',
          result ? 'hover:bg-rose-50/40' : 'cursor-default',
          'transition',
        ].join(' ')}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-base shrink-0">
            ♡
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-stone-800 truncate">
              {recipientPrimary(recipient)}
            </div>
            <div className="text-xs text-stone-400 truncate mt-0.5">
              {label}
              {result?.kind === 'common' && (
                <span className="ml-1.5 text-rose-500">· 모두에게</span>
              )}
            </div>
          </div>
        </div>
        {!loaded ? (
          <span className="text-xs text-stone-300 shrink-0">불러오는 중…</span>
        ) : result ? (
          <span
            className={[
              'text-stone-300 transition-transform shrink-0',
              open ? 'rotate-90' : '',
            ].join(' ')}
          >
            ›
          </span>
        ) : (
          <span className="text-xs text-stone-300 shrink-0">아직 답장 없음</span>
        )}
      </button>

      {open && result && (
        <div className="border-t border-stone-100">
          <div
            className="font-letter px-6 py-6 text-stone-800 text-base leading-8 bg-[#fffaf0]"
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              backgroundImage:
                'repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(180, 83, 9, 0.08) 32px)',
            }}
          >
            {result.reply.content}
          </div>
          <div className="px-6 py-3 text-right text-xs text-stone-400 bg-[#fffaf0] border-t border-stone-100">
            — {recipientPrimary(recipient)} 드림
          </div>
        </div>
      )}
    </div>
  )
}
