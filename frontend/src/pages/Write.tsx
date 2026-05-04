import { useEffect, useState } from 'react'
import {
  FAMILIES,
  familyDisplayName,
  RECIPIENTS,
  recipientLabelFor,
  recipientPrimary,
  type Family,
  type Recipient,
} from '../config/family'
import {
  getCurrentWriter,
  getLetter,
  getWriterProgress,
  pinExists,
  saveLetter,
  setCurrentWriter,
  setPin,
  verifyPin,
  type Writer,
} from '../lib/storage'
import { navigate } from '../lib/router'

type View =
  | { kind: 'pick' }
  | { kind: 'list' }
  | { kind: 'editor'; recipient: Recipient }

/**
 * 한 세션 안에서 picker를 통과한 적이 있는지 표시.
 * 처음 진입 시: picker 표시 (가족이 폰 공유 시 누군지 확인)
 * 한 번 picker 통과 후: /write로 다시 와도 RecipientList로 직행 (back 등)
 * 탭 닫으면 sessionStorage가 비워져서 다음 세션엔 다시 picker 표시
 */
const SESSION_PICKER_PASSED = 'parents-day:picker-passed'

export default function Write() {
  const [writer, setWriter] = useState<Writer | null>(() => getCurrentWriter())
  const [view, setView] = useState<View>(() => {
    const w = getCurrentWriter()
    const passed = sessionStorage.getItem(SESSION_PICKER_PASSED) === '1'
    return w && passed ? { kind: 'list' } : { kind: 'pick' }
  })

  if (view.kind === 'pick' || !writer) {
    return (
      <CousinPicker
        current={writer}
        onPick={(w) => {
          setCurrentWriter(w)
          sessionStorage.setItem(SESSION_PICKER_PASSED, '1')
          setWriter(w)
          setView({ kind: 'list' })
        }}
      />
    )
  }

  if (view.kind === 'editor') {
    return (
      <Editor
        writer={writer}
        recipient={view.recipient}
        onDone={() => setView({ kind: 'list' })}
      />
    )
  }

  return (
    <RecipientList
      writer={writer}
      onPick={(r) => setView({ kind: 'editor', recipient: r })}
      onChangeWriter={() => {
        sessionStorage.removeItem(SESSION_PICKER_PASSED)
        setView({ kind: 'pick' })
      }}
    />
  )
}

function CousinPicker({
  current,
  onPick,
}: {
  current: Writer | null
  onPick: (w: Writer) => void
}) {
  const [pending, setPending] = useState<{ name: string; familyId: Family['id'] } | null>(null)

  return (
    <div className="min-h-dvh flex flex-col px-5 py-6 max-w-md mx-auto">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="self-start text-sm text-stone-400 hover:text-stone-600"
      >
        ← 처음으로
      </button>

      <div className="my-auto py-8 w-full">
        <p className="text-xs tracking-[0.3em] text-rose-400 uppercase mb-3">
          Step 1 of 2
        </p>
        <h2 className="font-display text-3xl text-stone-800 mb-2">
          본인을 골라주세요
        </h2>
        <p className="text-sm text-stone-500 mb-8">
          {current
            ? `이전에 ${current.name}으로 쓰셨어요. 그대로면 다시 눌러주세요.`
            : '어느 가족의 사촌인지 알아야 부모님 호칭을 맞춰드릴 수 있어요.'}
        </p>

        <div className="space-y-6">
          {FAMILIES.map((family) => (
            <FamilySection
              key={family.id}
              family={family}
              current={current}
              onPick={(name) => setPending({ name, familyId: family.id })}
            />
          ))}
        </div>

        <p className="mt-10 text-xs text-stone-400 text-center">
          잘못 골랐어도 괜찮아요. 언제든 다시 바꿀 수 있어요.
        </p>
      </div>

      {pending && (
        <PinModal
          cousinName={pending.name}
          onSuccess={() => {
            const picked = pending
            setPending(null)
            onPick({ name: picked.name, familyId: picked.familyId })
          }}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  )
}

function PinModal({
  cousinName,
  onSuccess,
  onCancel,
}: {
  cousinName: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const [mode, setMode] = useState<'checking' | 'set' | 'verify'>('checking')
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    pinExists(cousinName)
      .then((exists) => {
        if (!cancelled) setMode(exists ? 'verify' : 'set')
      })
      .catch(() => {
        if (!cancelled) setMode('set')
      })
    return () => {
      cancelled = true
    }
  }, [cousinName])

  const handleSubmit = async () => {
    setError(null)
    if (mode === 'set') {
      if (!/^\d{4}$/.test(pin1)) {
        setError('숫자 4자리로 만들어주세요')
        return
      }
      if (pin1 !== pin2) {
        setError('두 번 입력이 달라요')
        return
      }
      setSubmitting(true)
      const ok = await setPin(cousinName, pin1)
      setSubmitting(false)
      if (ok) onSuccess()
      else setError('이미 설정된 PIN이 있어요. 입력 모드로 다시 시도해주세요.')
    } else if (mode === 'verify') {
      if (!/^\d{4}$/.test(pin1)) {
        setError('숫자 4자리로 입력해주세요')
        return
      }
      setSubmitting(true)
      const ok = await verifyPin(cousinName, pin1)
      setSubmitting(false)
      if (ok) onSuccess()
      else {
        setError('PIN이 틀려요')
        setPin1('')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl">
        <h3 className="font-display text-xl text-stone-800 mb-1 text-center">
          {cousinName}
        </h3>
        <p className="text-sm text-stone-500 text-center mb-5">
          {mode === 'checking' && '확인 중…'}
          {mode === 'set' && '처음이라 PIN을 만들어주세요 (4자리)'}
          {mode === 'verify' && '본인 확인 PIN 4자리'}
        </p>

        {mode !== 'checking' && (
          <>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={pin1}
              onChange={(e) => {
                setPin1(e.target.value.replace(/\D/g, '').slice(0, 4))
                setError(null)
              }}
              placeholder="••••"
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-lg text-center tracking-[0.5em] outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 mb-3"
            />
            {mode === 'set' && (
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin2}
                onChange={(e) => {
                  setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))
                  setError(null)
                }}
                placeholder="다시 한 번"
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-lg text-center tracking-[0.5em] outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 mb-3"
              />
            )}
            {error && (
              <p className="text-xs text-rose-500 text-center mb-3">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:bg-stone-300 text-white font-semibold"
              >
                {submitting ? '잠시…' : mode === 'set' ? '만들기' : '확인'}
              </button>
            </div>
            {mode === 'verify' && (
              <p className="text-[11px] text-stone-400 text-center mt-3">
                PIN 잊었으면 가족 단톡방에 알려주세요. 관리자가 리셋해줄게요.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function FamilySection({
  family,
  current,
  onPick,
}: {
  family: Family
  current: Writer | null
  onPick: (name: string) => void
}) {
  return (
    <section>
      <h3 className="text-sm font-bold text-stone-700 mb-3 px-1">
        {familyDisplayName(family)}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {family.cousins.map((name) => {
          const selected = current?.name === name
          return (
            <button
              key={name}
              type="button"
              onClick={() => onPick(name)}
              className={[
                'rounded-2xl px-4 py-4 text-center transition-all border',
                selected
                  ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200/70'
                  : 'bg-white border-stone-200 text-stone-800 hover:-translate-y-0.5 hover:shadow-md hover:border-rose-200',
              ].join(' ')}
            >
              <div className="font-semibold text-base">{name}</div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function RecipientList({
  writer,
  onPick,
  onChangeWriter,
}: {
  writer: Writer
  onPick: (r: Recipient) => void
  onChangeWriter: () => void
}) {
  const [progress, setProgress] = useState<{
    done: number
    total: number
    doneIds: Set<string>
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    getWriterProgress(writer.name).then((p) => {
      if (!cancelled) setProgress(p)
    })
    return () => {
      cancelled = true
    }
  }, [writer.name])

  const allDone = progress && progress.done === progress.total

  return (
    <div className="min-h-dvh flex flex-col px-5 py-6 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-sm text-stone-400 hover:text-stone-600"
        >
          ← 처음으로
        </button>
        <button
          type="button"
          onClick={onChangeWriter}
          className="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2"
        >
          이름 바꾸기
        </button>
      </div>

      <div className="my-auto py-8 w-full">
        <p className="text-xs tracking-[0.3em] text-rose-400 uppercase mb-2">
          Step 2 of 2
        </p>
        <h2 className="font-display text-3xl text-stone-800 mb-1">
          {writer.name}님의 편지
        </h2>
        <p className="text-sm text-stone-500 mb-6">
          다섯 분께 한 장씩 써주세요. 짧아도 괜찮아요.
        </p>

        <ProgressBar
          done={progress?.done ?? 0}
          total={progress?.total ?? RECIPIENTS.length}
        />

        <ul className="mt-8 space-y-3">
        {RECIPIENTS.map((r) => {
          const done = progress?.doneIds.has(r.id) ?? false
          const label = recipientLabelFor(r.id, writer.familyId)
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onPick(r)}
                className={[
                  'w-full text-left bg-white rounded-2xl px-5 py-4 flex items-center justify-between border transition-all hover:-translate-y-0.5 hover:shadow-md',
                  done
                    ? 'border-emerald-200 shadow-sm shadow-emerald-100/40'
                    : 'border-stone-200',
                ].join(' ')}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <RecipientBadge accent={r.accent} done={done} />
                  <div className="min-w-0">
                    <div className="font-semibold text-stone-800 truncate">
                      {recipientPrimary(r)}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5 truncate">
                      {label} · {done ? '편지 작성 완료' : '아직 작성 전'}
                    </div>
                  </div>
                </div>
                <span className="text-stone-300 text-lg">›</span>
              </button>
            </li>
          )
        })}
      </ul>

      {allDone && (
        <div className="mt-8 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
          <div className="text-2xl mb-2">🎉</div>
          <p className="text-sm font-semibold text-emerald-800 mb-1">
            다섯 통 모두 작성 완료!
          </p>
          <p className="text-xs text-emerald-700/80 mb-4">
            정말 수고하셨어요. 이제 부모님 답장을 기다려볼까요?
          </p>
          <button
            type="button"
            onClick={() => navigate('/replies')}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl shadow-md shadow-rose-200/70 transition"
          >
            답장 보러가기 →
          </button>
        </div>
      )}

        <button
          type="button"
          onClick={() => navigate('/photos')}
          className="mt-8 w-full bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold py-3 rounded-2xl transition flex items-center justify-center gap-2"
        >
          📸 추억 사진 올리기
        </button>

        <button
          type="button"
          onClick={() => navigate('/replies')}
          className="mt-3 w-full text-sm text-stone-500 hover:text-rose-600 underline underline-offset-2"
        >
          답장함 열기
        </button>
      </div>
    </div>
  )
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = Math.round((done / total) * 100)
  return (
    <div>
      <div className="flex justify-between text-xs text-stone-500 mb-2">
        <span>진행 상황</span>
        <span className="tabular-nums">
          <span className="font-semibold text-stone-800">{done}</span> / {total}
        </span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-400 to-rose-500 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function RecipientBadge({
  accent,
  done,
}: {
  accent: Recipient['accent']
  done: boolean
}) {
  const palette: Record<Recipient['accent'], string> = {
    rose: 'bg-rose-100 text-rose-600',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    sky: 'bg-sky-100 text-sky-700',
    violet: 'bg-violet-100 text-violet-700',
  }
  return (
    <div
      className={[
        'w-11 h-11 rounded-full flex items-center justify-center text-base font-semibold relative',
        palette[accent],
      ].join(' ')}
    >
      <span>♡</span>
      {done && (
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] flex items-center justify-center border-2 border-white">
          ✓
        </span>
      )}
    </div>
  )
}

function Editor({
  writer,
  recipient,
  onDone,
}: {
  writer: Writer
  recipient: Recipient
  onDone: () => void
}) {
  const [content, setContent] = useState<string>('')
  const [initialContent, setInitialContent] = useState<string>('')
  const [loaded, setLoaded] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const label = recipientLabelFor(recipient.id, writer.familyId)
  const addressing = `${recipient.realName} ${label}`

  useEffect(() => {
    let cancelled = false
    getLetter(writer.name, recipient.id).then((letter) => {
      if (cancelled) return
      const c = letter?.content ?? ''
      setContent(c)
      setInitialContent(c)
      if (letter?.updatedAt) setSavedAt(Date.parse(letter.updatedAt))
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [writer.name, recipient.id])

  // Auto-save on change with debounce
  useEffect(() => {
    if (!loaded) return
    if (content === initialContent) return
    const t = setTimeout(async () => {
      try {
        setSaving(true)
        const saved = await saveLetter({
          writerName: writer.name,
          writerFamilyId: writer.familyId,
          recipientId: recipient.id,
          content,
        })
        setInitialContent(content)
        setSavedAt(Date.parse(saved.updatedAt))
      } catch (e) {
        console.error(e)
      } finally {
        setSaving(false)
      }
    }, 600)
    return () => clearTimeout(t)
  }, [content, loaded, initialContent, writer.name, writer.familyId, recipient.id])

  const trimmed = content.trim()

  const handleSubmit = async () => {
    if (!trimmed) return
    try {
      setSaving(true)
      await saveLetter({
        writerName: writer.name,
        writerFamilyId: writer.familyId,
        recipientId: recipient.id,
        content,
      })
      onDone()
    } catch (e) {
      console.error(e)
      alert('저장 실패. 인터넷 또는 서버 상태를 확인해주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col px-5 py-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          ← 목록
        </button>
        <SaveStatus savedAt={savedAt} hasContent={trimmed.length > 0} saving={saving} />
      </div>

      <div className="text-center mb-4">
        <p className="text-xs tracking-[0.3em] text-rose-400 uppercase mb-1">
          To.
        </p>
        <h2 className="font-display text-3xl text-stone-800">
          {addressing}께
        </h2>
      </div>

      <div className="relative flex-1 min-h-[420px]">
        <div
          className="absolute inset-0 rounded-2xl bg-[#fffaf0] shadow-md shadow-stone-200/60 border border-stone-200/70"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(180, 83, 9, 0.08) 32px)',
          }}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`${recipientPrimary(recipient)}께 전하고 싶은 말을 적어주세요…`}
          autoFocus
          disabled={!loaded}
          className="font-letter relative w-full h-full min-h-[420px] bg-transparent rounded-2xl px-6 py-5 text-lg leading-8 text-stone-800 outline-none resize-none"
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-stone-400">
        <span>From. {writer.name}</span>
        <span className="tabular-nums">{trimmed.length}자</span>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!trimmed || saving}
        className="mt-5 w-full bg-rose-500 hover:bg-rose-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-rose-200/70 transition"
      >
        {saving ? '저장 중…' : initialContent ? '수정 완료' : '편지 봉인하기'}
      </button>
    </div>
  )
}

function SaveStatus({
  savedAt,
  hasContent,
  saving,
}: {
  savedAt: number | null
  hasContent: boolean
  saving: boolean
}) {
  if (saving) return <span className="text-xs text-stone-400">저장 중…</span>
  if (!hasContent) return <span className="text-xs text-stone-300">자동 저장</span>
  if (!savedAt) return <span className="text-xs text-stone-400">저장 대기</span>
  return <span className="text-xs text-emerald-600">✓ 자동 저장됨</span>
}
