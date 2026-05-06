import { useCallback, useEffect, useMemo, useState } from 'react'
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
  deletePhoto,
  getAdminPassword,
  getAllLetters,
  getAllPhotos,
  listPins,
  resetAllPins,
  type PinSummary,
  photoImageUrl,
  photoRecipientIdSet,
  resetPin,
  setAdminPassword,
  type Letter,
  type PhotoMeta,
  verifyAdminPassword,
} from '../lib/storage'
import { findRecipient } from '../config/family'
import { buildShareLink, navigate } from '../lib/router'

export default function Admin() {
  const [adminPassword, setAdminPasswordState] = useState<string | null>(() =>
    getAdminPassword(),
  )

  if (!adminPassword) {
    return (
      <PasswordGate
        onSuccess={(password) => {
          setAdminPassword(password)
          setAdminPasswordState(password)
        }}
      />
    )
  }

  return (
    <AdminContent
      adminPassword={adminPassword}
      onLogout={() => {
        setAdminPassword(null)
        setAdminPasswordState(null)
        navigate('/')
      }}
    />
  )
}

function PasswordGate({ onSuccess }: { onSuccess: (password: string) => void }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-10">
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
          const password = input.trim()
          if (!password) return
          setChecking(true)
          verifyAdminPassword(password)
            .then((ok) => {
              if (ok) {
                onSuccess(password)
              } else {
                setError(true)
                setInput('')
              }
            })
            .catch(() => {
              setError(true)
              setInput('')
            })
            .finally(() => setChecking(false))
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
          disabled={!input || checking}
          className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-rose-200/70 transition"
        >
          {checking ? '확인 중…' : '확인'}
        </button>
      </form>
    </div>
  )
}

function AdminContent({
  adminPassword,
  onLogout,
}: {
  adminPassword: string
  onLogout: () => void
}) {
  const [letters, setLetters] = useState<Letter[]>([])
  const [photos, setPhotos] = useState<PhotoMeta[]>([])
  const [pins, setPins] = useState<PinSummary[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [ls, ps, ps2] = await Promise.all([
        getAllLetters(),
        getAllPhotos(),
        listPins(adminPassword).catch(() => [] as PinSummary[]),
      ])
      setLetters(ls)
      setPhotos(ps)
      setPins(ps2)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [adminPassword])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch
    reload()
  }, [reload])

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
    <div className="min-h-dvh px-5 py-8 max-w-2xl mx-auto">
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

      <Section title="사촌 PIN 관리">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-stone-400 flex-1">
            PIN을 잊은 사촌이 있으면 리셋해주세요.
          </p>
          <button
            type="button"
            onClick={async () => {
              if (
                !confirm(
                  '모든 사촌의 PIN을 초기화할까요? 모두 다음 입장 때 새 PIN을 만들어야 해요.',
                )
              ) {
                return
              }
              try {
                await resetAllPins(adminPassword)
                await reload()
              } catch (e) {
                console.error(e)
                alert('전체 초기화 실패')
              }
            }}
            className="text-xs text-rose-500 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 shrink-0"
          >
            전체 초기화
          </button>
        </div>
        <ul className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
          {FAMILIES.flatMap((f) => f.cousins).map((name) => {
            const entry = pins.find((p) => p.cousinName === name)
            const isSet = !!entry
            return (
              <li
                key={name}
                className="px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-semibold text-stone-800 truncate w-16 shrink-0">
                    {name}
                  </span>
                  {isSet ? (
                    <span className="text-[10px] tracking-wider uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      설정됨
                    </span>
                  ) : (
                    <span className="text-[10px] tracking-wider uppercase text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                      미설정
                    </span>
                  )}
                </div>
                {isSet && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`${name}의 PIN을 리셋할까요?`)) return
                      try {
                        await resetPin(name, adminPassword)
                        await reload()
                      } catch (e) {
                        console.error(e)
                        alert('리셋 실패')
                      }
                    }}
                    className="text-xs text-rose-500 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 shrink-0"
                  >
                    리셋
                  </button>
                )}
              </li>
            )
          })}
        </ul>
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
                              await deleteLetter(
                                l.writerName,
                                l.recipientId,
                                adminPassword,
                              )
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

      <Section title={`올라온 사진 (${photos.length}장)`}>
        {photos.length === 0 ? (
          <p className="text-sm text-stone-400 px-4 py-6 text-center bg-stone-50 rounded-2xl">
            아직 사진이 없어요.
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-3">
            {photos.map((p) => {
              const recipientNames = Array.from(photoRecipientIdSet(p))
                .map((id) => findRecipient(id)?.realName)
                .filter(Boolean)
                .join(', ')
              return (
                <li
                  key={p.id}
                  className="bg-white rounded-xl border border-stone-200 p-2 relative"
                >
                  <div className="aspect-square bg-stone-100 rounded overflow-hidden mb-2">
                    <img
                      src={photoImageUrl(p.id)}
                      alt={p.caption ?? ''}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[11px] text-stone-600 truncate">
                    {p.uploaderName}
                  </div>
                  {recipientNames && (
                    <div className="text-[10px] text-rose-500 truncate">
                      → {recipientNames}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        confirm(
                          `${p.uploaderName}이 올린 사진을 정말 삭제할까요?`,
                        )
                      ) {
                        try {
                          await deletePhoto(p.id, { adminPassword })
                          await reload()
                        } catch (e) {
                          console.error(e)
                          alert('삭제 실패')
                        }
                      }
                    }}
                    className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/90 hover:bg-rose-500 hover:text-white text-stone-500 text-[11px] flex items-center justify-center shadow border border-stone-200 transition"
                    title="삭제"
                  >
                    ✕
                  </button>
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
      '🌹 어버이날, 가족 편지가 도착했어요',
      '본인 성함을 찾아 아래 링크를 눌러주세요 💌',
      '',
      ...RECIPIENTS.flatMap((r) => [
        `🌷 ${r.realName} ${r.label}`,
        buildShareLink(`/home/${r.id}`),
        '',
      ]),
    ]
    return lines.join('\n').trimEnd()
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
