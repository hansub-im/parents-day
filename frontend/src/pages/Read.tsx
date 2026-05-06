import { useEffect, useState } from 'react'
import { Carnation } from '../components/Carnation'
import { findRecipient, recipientPrimary } from '../config/family'
import {
  getCommonReply,
  getIndividualReply,
  getLettersByRecipient,
  saveReply,
  type Letter,
  type Reply,
} from '../lib/storage'
import { navigate } from '../lib/router'

export default function Read({ recipientId }: { recipientId: string }) {
  const recipient = findRecipient(recipientId)

  const [letters, setLetters] = useState<Letter[] | null>(null)
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!recipient) return
    let cancelled = false
    getLettersByRecipient(recipient.id).then((ls) => {
      if (!cancelled) setLetters(ls)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recipient는 id로부터 매 렌더 파생. id로 충분
  }, [recipient?.id])

  if (!recipient) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-5xl mb-4">😢</p>
          <p className="text-stone-600 font-semibold mb-1">잘못된 링크예요</p>
          <p className="text-sm text-stone-400">받으신 링크를 다시 확인해주세요.</p>
        </div>
      </div>
    )
  }

  const lettersList = letters ?? []

  return (
    <div className="min-h-dvh flex flex-col px-5 py-6 max-w-md mx-auto">
      <button
        type="button"
        onClick={() => navigate(`/home/${recipient.id}`)}
        className="self-start text-sm text-stone-400 hover:text-stone-600"
      >
        ← 추억의 홈으로
      </button>

      <div className="my-auto py-8 w-full">
      <header className="text-center mb-10">
        <p className="text-xs tracking-[0.4em] text-rose-400 uppercase mb-3">
          어버이날 편지
        </p>
        <h1 className="font-display text-4xl text-stone-800 mb-3">
          사랑하는 {recipientPrimary(recipient)}님께
        </h1>
        <p className="text-sm text-stone-500 leading-relaxed">
          {letters === null ? (
            '편지를 불러오는 중…'
          ) : (
            <>
              가족이 한 마음으로 모아 적은
              <br />
              {lettersList.length}통의 편지가 도착했어요
            </>
          )}
        </p>
      </header>

      {letters !== null && lettersList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center">
          <div className="text-3xl mb-3">✉️</div>
          <p className="text-sm text-stone-500">
            아직 도착한 편지가 없어요.
            <br />
            조금만 기다려주세요.
          </p>
        </div>
      ) : letters !== null ? (
        <>
          <CommonReplyBox recipientId={recipient.id} />

          <h2 className="text-sm font-semibold text-stone-700 mt-10 mb-3 px-1">
            받은 편지 {lettersList.length}통
          </h2>

          <ul className="space-y-4">
            {lettersList.map((letter, i) => (
              <li key={`${letter.writerName}-${i}`}>
                <LetterCard
                  letter={letter}
                  recipientId={recipient.id}
                  open={openIdx === i}
                  onToggle={() => setOpenIdx(openIdx === i ? null : i)}
                />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      </div>

      <footer className="mt-12 text-center text-xs text-stone-400 flex items-center justify-center gap-1.5">
        <Carnation headOnly className="h-4" />
        <span>어버이날, 늘 감사합니다</span>
      </footer>
    </div>
  )
}

function CommonReplyBox({ recipientId }: { recipientId: string }) {
  const [content, setContent] = useState<string>('')
  const [savedContent, setSavedContent] = useState<string>('')
  const [open, setOpen] = useState<boolean>(false)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    let cancelled = false
    getCommonReply(recipientId).then((r) => {
      if (cancelled) return
      const c = r?.content ?? ''
      setContent(c)
      setSavedContent(c)
    })
    return () => {
      cancelled = true
    }
  }, [recipientId])

  const hasSavedReply = savedContent.trim().length > 0

  const handleSave = async () => {
    const trimmed = content.trim()
    if (!trimmed) return
    try {
      setSaving(true)
      await saveReply({ fromRecipientId: recipientId, content })
      setSavedContent(content)
      setSavedFlash(true)
      setTimeout(() => {
        setSavedFlash(false)
        setOpen(false)
      }, 1200)
    } catch (e) {
      console.error(e)
      alert('저장 실패. 잠시 후 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-rose-50 transition"
      >
        <div>
          <div className="font-semibold text-stone-800">
            모두에게 한 통 답장
          </div>
          <div className="text-xs mt-0.5">
            {hasSavedReply ? (
              <span className="text-emerald-700">
                ✓ 답장 보냄 — 누르면 수정할 수 있어요
              </span>
            ) : (
              <span className="text-stone-500">
                한 번에 모두에게 같은 답장을 보낼 때 사용해요
              </span>
            )}
          </div>
        </div>
        <span
          className={[
            'text-stone-300 transition-transform',
            open ? 'rotate-90' : '',
          ].join(' ')}
        >
          ›
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 animate-fade-up">
          {savedFlash && (
            <div className="mb-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 text-sm text-center font-semibold">
              ✓ 답장을 보냈어요
            </div>
          )}
          <ReplyEditor
            value={content}
            onChange={setContent}
            onSave={handleSave}
            hasSavedReply={hasSavedReply}
            saving={saving}
            placeholder="아이들에게 한 마디 적어주세요…"
          />
          <p className="mt-3 text-[11px] text-stone-400 text-center">
            이 답장은 개별 답장을 따로 적지 않은 아이들에게 보여요.
          </p>
        </div>
      )}
    </div>
  )
}

function LetterCard({
  letter,
  recipientId,
  open,
  onToggle,
}: {
  letter: Letter
  recipientId: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={[
        'rounded-2xl bg-white border transition-all overflow-hidden',
        open
          ? 'border-rose-200 shadow-lg shadow-rose-100'
          : 'border-stone-200 shadow-sm',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-rose-50/40 transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-base shrink-0">
            ✉︎
          </div>
          <div className="min-w-0">
            <div className="text-xs text-stone-400 uppercase tracking-wider">
              From
            </div>
            <div className="font-semibold text-stone-800 truncate">
              {letter.writerName}
            </div>
          </div>
        </div>
        <span
          className={[
            'text-stone-300 transition-transform shrink-0',
            open ? 'rotate-90' : '',
          ].join(' ')}
        >
          ›
        </span>
      </button>

      {open && (
        <div className="border-t border-stone-100 animate-fade-up">
          <div
            className="font-display px-6 py-6 text-stone-800 text-xl leading-10 bg-[#fffaf0]"
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              backgroundImage:
                'repeating-linear-gradient(to bottom, transparent 0, transparent 39px, rgba(180, 83, 9, 0.08) 40px)',
            }}
          >
            {letter.content}
          </div>
          <div className="px-6 py-3 text-right text-xs text-stone-400 bg-[#fffaf0] border-t border-stone-100">
            — {letter.writerName} 드림
          </div>

          <IndividualReplySection
            recipientId={recipientId}
            cousinName={letter.writerName}
          />
        </div>
      )}
    </div>
  )
}

function IndividualReplySection({
  recipientId,
  cousinName,
}: {
  recipientId: string
  cousinName: string
}) {
  const [content, setContent] = useState<string>('')
  const [savedContent, setSavedContent] = useState<string>('')
  const [open, setOpen] = useState<boolean>(false)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    let cancelled = false
    getIndividualReply(recipientId, cousinName).then((r: Reply | undefined) => {
      if (cancelled) return
      const c = r?.content ?? ''
      setContent(c)
      setSavedContent(c)
    })
    return () => {
      cancelled = true
    }
  }, [recipientId, cousinName])

  const hasSavedReply = savedContent.trim().length > 0

  const handleSave = async () => {
    const trimmed = content.trim()
    if (!trimmed) return
    try {
      setSaving(true)
      await saveReply({
        fromRecipientId: recipientId,
        toCousinName: cousinName,
        content,
      })
      setSavedContent(content)
      setSavedFlash(true)
      setTimeout(() => {
        setSavedFlash(false)
        setOpen(false)
      }, 1200)
    } catch (e) {
      console.error(e)
      alert('저장 실패. 잠시 후 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          'w-full px-6 py-3 border-t border-stone-100 bg-white text-sm transition flex items-center justify-center gap-1.5',
          hasSavedReply
            ? 'text-emerald-700 hover:bg-emerald-50'
            : 'text-rose-600 hover:bg-rose-50',
        ].join(' ')}
      >
        {hasSavedReply ? (
          <>
            <span>✓</span>
            <span>{cousinName}에게 답장 보냄</span>
            <span className="text-stone-400 ml-1 text-xs">— 수정</span>
          </>
        ) : (
          <>
            <span>✍︎</span>
            <span>{cousinName}에게 따로 답장 쓰기</span>
          </>
        )}
      </button>
    )
  }

  return (
    <div className="border-t border-stone-100 bg-rose-50/60 p-4 animate-fade-up">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-stone-500">
          <span className="font-semibold text-rose-600">{cousinName}</span>
          에게 따로 답장
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-stone-400 hover:text-stone-600"
        >
          닫기
        </button>
      </div>
      {savedFlash && (
        <div className="mb-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 text-sm text-center font-semibold">
          ✓ {cousinName}에게 답장을 보냈어요
        </div>
      )}
      <ReplyEditor
        value={content}
        onChange={setContent}
        onSave={handleSave}
        hasSavedReply={hasSavedReply}
        saving={saving}
        placeholder={`${cousinName}에게 답장을 적어주세요…`}
      />
    </div>
  )
}

function ReplyEditor({
  value,
  onChange,
  onSave,
  hasSavedReply,
  saving,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  onSave: () => void
  hasSavedReply: boolean
  saving: boolean
  placeholder: string
}) {
  const trimmed = value.trim()
  return (
    <div>
      <div className="relative min-h-[240px]">
        <div
          className="absolute inset-0 rounded-xl bg-[#fffaf0] border border-stone-200/80"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, transparent 0, transparent 39px, rgba(180, 83, 9, 0.08) 40px)',
          }}
        />
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="font-display relative w-full min-h-[240px] bg-transparent rounded-xl px-4 py-3 text-xl leading-10 text-stone-800 outline-none resize-none"
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[11px] text-stone-400 tabular-nums">
          {trimmed.length}자
        </span>
        <button
          type="button"
          onClick={onSave}
          disabled={!trimmed || saving}
          className="bg-rose-500 hover:bg-rose-600 active:bg-rose-700 disabled:bg-stone-200 disabled:text-stone-400 text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-sm shadow-rose-200/70 transition"
        >
          {saving ? '저장 중…' : hasSavedReply ? '수정 완료' : '답장 보내기'}
        </button>
      </div>
    </div>
  )
}
