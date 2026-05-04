import { useEffect, useMemo, useState } from 'react'
import {
  FAMILIES,
  familyDisplayName,
  findFamily,
  findFamilyByCousin,
  RECIPIENTS,
  type Family,
} from '../config/family'
import {
  deleteLetter,
  getAllLetters,
  type Letter,
} from '../lib/storage'
import { buildShareLink, navigate } from '../lib/router'

const ADMIN_PASS = '182637'
const ADMIN_AUTH_KEY = 'parents-day:admin-auth:v1'

function isAdminAuthed(): boolean {
  return localStorage.getItem(ADMIN_AUTH_KEY) === ADMIN_PASS
}

export default function Admin() {
  const [authed, setAuthed] = useState<boolean>(() => isAdminAuthed())

  if (!authed) {
    return (
      <PasswordGate
        onSuccess={() => {
          localStorage.setItem(ADMIN_AUTH_KEY, ADMIN_PASS)
          setAuthed(true)
        }}
      />
    )
  }

  return (
    <AdminContent
      onLogout={() => {
        localStorage.removeItem(ADMIN_AUTH_KEY)
        setAuthed(false)
      }}
    />
  )
}

function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-10">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-sm text-stone-400 hover:text-stone-600"
      >
        ← 처음으로
      </button>

      <div className="text-5xl mb-5">🔒</div>
      <h2 className="font-display text-2xl text-stone-800 mb-2">
        관리자 비밀번호
      </h2>
      <p className="text-sm text-stone-500 mb-8 text-center max-w-xs">
        본인만 들어올 수 있는 페이지예요.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (input === ADMIN_PASS) {
            onSuccess()
          } else {
            setError(true)
            setInput('')
          }
        }}
        className="w-full max-w-xs space-y-3"
      >
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setError(false)
          }}
          placeholder="비밀번호"
          className={[
            'w-full bg-white border rounded-2xl px-5 py-4 text-lg outline-none transition',
            error
              ? 'border-rose-400 ring-4 ring-rose-100'
              : 'border-stone-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100',
          ].join(' ')}
        />
        {error && (
          <p className="text-xs text-rose-500 text-center">
            비밀번호가 틀려요
          </p>
        )}
        <button
          type="submit"
          disabled={!input}
          className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-rose-200/70 transition"
        >
          확인
        </button>
      </form>
    </div>
  )
}

function AdminContent({ onLogout }: { onLogout: () => void }) {
  const [letters, setLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    setLoading(true)
    try {
      const ls = await getAllLetters()
      setLetters(ls)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const allCousins = useMemo(() => {
    return FAMILIES.flatMap((f) =>
      f.cousins.map((name) => ({ name, family: f })),
    )
  }, [])

  const matrix = useMemo(() => {
    const m = new Map<string, Set<string>>()
    for (const { name } of allCousins) m.set(name, new Set())
    for (const l of letters) {
      if (l.content.trim().length === 0) continue
      if (!m.has(l.writerName)) m.set(l.writerName, new Set())
      m.get(l.writerName)!.add(l.recipientId)
    }
    return m
  }, [letters, allCousins])

  const totalCousins = allCousins.length
  const completedCousins = allCousins.filter(
    (c) => (matrix.get(c.name)?.size ?? 0) === RECIPIENTS.length,
  ).length

  return (
    <div className="min-h-full px-5 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-sm text-stone-400 hover:text-stone-600"
        >
          ← 처음으로
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className="text-xs text-stone-500 hover:text-stone-800 underline underline-offset-2 disabled:opacity-50"
          >
            {loading ? '불러오는 중…' : '새로고침'}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-stone-400 hover:text-rose-500"
          >
            🔒 잠그기
          </button>
        </div>
      </div>

      <h1 className="font-display text-3xl text-stone-800 mb-1">관리</h1>
      <p className="text-sm text-stone-500 mb-8">
        편지 진행 상황과 부모님께 보낼 링크를 관리해요.
      </p>

      <Section title="한눈에 보기">
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="작성 완료한 사촌"
            value={`${completedCousins}/${totalCousins}`}
          />
          <Stat
            label="모인 편지"
            value={`${letters.filter((l) => l.content.trim().length > 0).length}통`}
          />
        </div>
      </Section>

      <Section title="부모님 링크 (각자 따로 보내드리기)">
        <BulkLinks />
        <ul className="space-y-2">
          {RECIPIENTS.map((r) => {
            const link = buildShareLink(`/home/${r.id}`)
            const count = letters.filter(
              (l) => l.recipientId === r.id && l.content.trim().length > 0,
            ).length
            return (
              <li
                key={r.id}
                className="bg-white rounded-2xl px-4 py-3 border border-stone-200 flex items-center gap-3"
              >
                <div className="w-24 shrink-0">
                  <div className="font-semibold text-stone-800 truncate">
                    {r.realName}
                  </div>
                  <div className="text-[11px] text-stone-400 truncate">
                    {r.label}
                  </div>
                </div>
                <div className="text-xs text-stone-400 tabular-nums w-12 shrink-0">
                  {count}통
                </div>
                <code className="flex-1 min-w-0 truncate text-xs text-stone-500 bg-stone-50 px-2 py-1.5 rounded">
                  {link}
                </code>
                <CopyButton text={link} />
                <button
                  type="button"
                  onClick={() => window.open(`#/home/${r.id}`, '_blank')}
                  className="text-xs text-stone-500 hover:text-stone-800 px-2 py-1.5"
                >
                  미리보기
                </button>
              </li>
            )
          })}
        </ul>
      </Section>

      <Section title="사촌별 진행도">
        <div className="space-y-5">
          {FAMILIES.map((family) => (
            <FamilyProgress
              key={family.id}
              family={family}
              matrix={matrix}
            />
          ))}
        </div>
        <UnknownWriters letters={letters} matrix={matrix} />
      </Section>

      <Section title="모든 편지">
        {letters.filter((l) => l.content.trim().length > 0).length === 0 ? (
          <p className="text-sm text-stone-400 px-4 py-6 text-center bg-stone-50 rounded-2xl">
            아직 편지가 없어요.
          </p>
        ) : (
          <ul className="space-y-2">
            {letters
              .filter((l) => l.content.trim().length > 0)
              .slice()
              .sort(
                (a, b) =>
                  Date.parse(b.updatedAt ?? '0') -
                  Date.parse(a.updatedAt ?? '0'),
              )
              .map((l) => {
                const r = RECIPIENTS.find((x) => x.id === l.recipientId)
                const writerFamily = l.writerFamilyId
                  ? findFamily(l.writerFamilyId)
                  : findFamilyByCousin(l.writerName)
                return (
                  <li
                    key={`${l.writerName}-${l.recipientId}`}
                    className="bg-white rounded-2xl border border-stone-200 px-4 py-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm min-w-0 truncate">
                        <span className="font-semibold text-stone-800">
                          {l.writerName}
                        </span>
                        {writerFamily && (
                          <span className="text-stone-400 text-xs ml-1">
                            ({familyDisplayName(writerFamily)})
                          </span>
                        )}
                        <span className="text-stone-400 mx-1.5">→</span>
                        <span className="font-semibold text-stone-800">
                          {r?.realName ?? r?.label ?? l.recipientId}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            confirm(
                              `${l.writerName} → ${r?.realName ?? r?.label} 편지를 정말 삭제할까요?`,
                            )
                          ) {
                            try {
                              await deleteLetter(l.writerName, l.recipientId)
                              await reload()
                            } catch (e) {
                              console.error(e)
                              alert('삭제 실패')
                            }
                          }
                        }}
                        className="text-xs text-stone-300 hover:text-rose-500 shrink-0"
                      >
                        삭제
                      </button>
                    </div>
                    <p className="text-xs text-stone-500 line-clamp-2">
                      {l.content}
                    </p>
                  </li>
                )
              })}
          </ul>
        )}
      </Section>

      <Section title="공유">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center gap-3">
          <code className="flex-1 min-w-0 truncate text-xs text-stone-500 bg-stone-50 px-2 py-1.5 rounded">
            {'https://www.im-hansub.co.kr'}
          </code>
          <CopyButton text={'https://www.im-hansub.co.kr'} label="작성 링크" />
        </div>
        <p className="mt-2 text-xs text-stone-400">
          위 링크를 사촌들 단톡에 공유하세요.
        </p>
      </Section>
    </div>
  )
}

function FamilyProgress({
  family,
  matrix,
}: {
  family: Family
  matrix: Map<string, Set<string>>
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-100">
        <span className="text-sm font-bold text-stone-800">
          {familyDisplayName(family)}
        </span>
      </div>
      <ul className="divide-y divide-stone-100">
        {family.cousins.map((name) => {
          const done = matrix.get(name)?.size ?? 0
          const total = RECIPIENTS.length
          const complete = done === total
          const started = done > 0
          return (
            <li
              key={name}
              className="px-4 py-3 grid grid-cols-[1fr_auto] gap-x-3 items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-800">{name}</span>
                  {!started && (
                    <span className="text-[10px] tracking-wider uppercase text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                      미시작
                    </span>
                  )}
                </div>
                <div className="flex gap-1 mt-1.5">
                  {RECIPIENTS.map((r) => {
                    const has = matrix.get(name)?.has(r.id)
                    return (
                      <span
                        key={r.id}
                        title={`${r.realName} ${r.label}`}
                        className={[
                          'h-2 flex-1 rounded-full',
                          has ? 'bg-emerald-400' : 'bg-stone-200',
                        ].join(' ')}
                      />
                    )
                  })}
                </div>
              </div>
              <span
                className={[
                  'tabular-nums text-sm font-semibold',
                  complete
                    ? 'text-emerald-600'
                    : started
                      ? 'text-stone-700'
                      : 'text-stone-400',
                ].join(' ')}
              >
                {done}/{total}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function UnknownWriters({
  letters,
  matrix,
}: {
  letters: Letter[]
  matrix: Map<string, Set<string>>
}) {
  const knownNames = new Set(FAMILIES.flatMap((f) => f.cousins))
  const unknownNames = Array.from(
    new Set(letters.map((l) => l.writerName).filter((n) => !knownNames.has(n))),
  )
  if (unknownNames.length === 0) return null

  return (
    <div className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <p className="text-xs text-amber-800 font-semibold mb-2">
        명단에 없는 이름
      </p>
      <ul className="space-y-1">
        {unknownNames.map((name) => {
          const done = matrix.get(name)?.size ?? 0
          return (
            <li
              key={name}
              className="text-sm text-amber-900 flex justify-between"
            >
              <span>{name}</span>
              <span className="tabular-nums text-amber-700">
                {done}/{RECIPIENTS.length}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function BulkLinks() {
  const text = useMemo(() => {
    const lines = [
      '🌷 어버이날 편지가 도착했어요',
      '본인 성함이 적힌 줄을 눌러주세요',
      '',
      ...RECIPIENTS.map(
        (r) => `${r.realName} 어른: ${buildShareLink(`/home/${r.id}`)}`,
      ),
    ]
    return lines.join('\n')
  }, [])

  return (
    <div className="mb-3 bg-white rounded-2xl border border-stone-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-stone-500">단톡에 그대로 붙여넣기</div>
        <CopyButton text={text} label="전체 복사" />
      </div>
      <pre className="text-[11px] text-stone-500 bg-stone-50 rounded p-2 leading-5 max-h-40 overflow-auto" style={{ whiteSpace: 'pre-wrap' }}>
        {text}
      </pre>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-10">
      <h2 className="text-sm font-semibold text-stone-700 mb-3">{title}</h2>
      {children}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 px-4 py-3">
      <div className="text-xs text-stone-400 mb-1">{label}</div>
      <div className="font-display text-2xl text-stone-800 tabular-nums">
        {value}
      </div>
    </div>
  )
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          /* ignore */
        }
      }}
      className={[
        'shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition',
        copied
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-rose-500 hover:bg-rose-600 text-white',
      ].join(' ')}
    >
      {copied ? '✓ 복사됨' : label ?? '복사'}
    </button>
  )
}
