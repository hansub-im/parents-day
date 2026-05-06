import { useEffect, useState } from 'react'
import { Carnation } from '../components/Carnation'
import { Lightbox } from '../components/Lightbox'
import { findRecipient, recipientPrimary } from '../config/family'
import {
  getAllPhotos,
  getLettersByRecipient,
  photoImageUrl,
  photoTargetsRecipient,
  type PhotoMeta,
} from '../lib/storage'
import { navigate } from '../lib/router'

/** Fallback gradient placeholders used when no real photos uploaded yet. */
const PLACEHOLDERS = [
  { gradient: 'from-rose-200 to-amber-100',    rotate: -2 },
  { gradient: 'from-sky-200 to-cyan-100',      rotate:  1.5 },
  { gradient: 'from-amber-200 to-orange-100',  rotate: -1 },
  { gradient: 'from-violet-200 to-sky-100',    rotate:  2 },
  { gradient: 'from-rose-100 to-pink-200',     rotate: -1.5 },
  { gradient: 'from-emerald-100 to-amber-100', rotate:  1 },
]

const ROTATIONS = [-2, 1.5, -1, 2, -1.5, 1, -2.2, 1.8, -0.8, 2.4]

export default function Home({
  recipientId,
  preview = false,
}: {
  recipientId: string
  preview?: boolean
}) {
  const recipient = findRecipient(recipientId)
  const [letterCount, setLetterCount] = useState<number>(0)
  const [photos, setPhotos] = useState<PhotoMeta[] | null>(null)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!recipient) return
    let cancelled = false

    Promise.all([
      preview
        ? Promise.resolve([])
        : getLettersByRecipient(recipient.id).catch(() => []),
      getAllPhotos().catch(() => []),
    ]).then(([ls, ps]) => {
      if (cancelled) return
      setLetterCount(ls.length)
      setPhotos(ps.filter((p) => photoTargetsRecipient(p, recipient.id)))
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recipient는 id로부터 매 렌더 파생. id로 충분
  }, [recipient?.id, preview])

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

  const name = recipientPrimary(recipient)

  return (
    <div className="min-h-dvh relative overflow-hidden">
      <Decoration />

      <div className="relative z-10 max-w-md mx-auto px-5 py-6 min-h-dvh flex flex-col">
        {preview ? (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-full bg-stone-100 border border-stone-200 px-3 py-1.5">
            <span className="text-[11px] text-stone-600">
              👀 미리보기 — 부모님께 보일 화면이에요
            </span>
            <button
              type="button"
              onClick={() => navigate('/photos')}
              className="text-[11px] text-stone-500 hover:text-stone-800 underline underline-offset-2 shrink-0"
            >
              ← 사진으로
            </button>
          </div>
        ) : (
          letterCount > 0 && (
            <button
              type="button"
              onClick={() => navigate(`/read/${recipient.id}`)}
              className="self-start inline-flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-full transition"
            >
              ✉ 받은 편지 {letterCount}통 →
            </button>
          )
        )}

        <div className="my-auto py-8 w-full">

        {/* Hero */}
        <header className="text-center mb-10">
          <div className="mb-5 flex justify-center">
            <div className="animate-bloom">
              <Carnation className="h-24 animate-carnation-sway" />
            </div>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-stone-800 mb-4 leading-tight">
            사랑하는<br />{name}님께
          </h1>
          <p className="font-letter text-lg text-stone-600 leading-loose">
            함께 보낸 모든 날들이<br />
            저희에게 가장 큰 선물이에요
          </p>
        </header>

        {/* Polaroid gallery */}
        <section className="mb-12">
          <SectionLabel>우리의 추억</SectionLabel>
          {photos && photos.length > 0 && (
            <p className="text-center text-sm text-stone-500 mb-5">
              👆 사진을 누르면 크게 보여요
            </p>
          )}
          <PolaroidGrid photos={photos} onOpen={(i) => setLightboxIdx(i)} />
        </section>

        {/* Quote */}
        <section className="mb-12 px-2">
          <div className="rounded-3xl bg-white/70 backdrop-blur-sm border border-rose-100 p-7 text-center shadow-sm shadow-rose-100/30">
            <Carnation headOnly className="h-10 mx-auto mb-3" />
            <p className="font-letter text-lg text-stone-700 leading-loose">
              늘 우리 곁에 계셔주셔서<br />
              감사하고, 또 감사해요.
            </p>
          </div>
        </section>

        {/* CTA */}
        {preview ? (
          <section className="mb-10 text-center">
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/50 px-5 py-6 text-center">
              <p className="text-sm text-stone-600 mb-1">💌 편지 받으러 가기</p>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                편지는 부모님만 열어 보실 수 있어요
              </p>
            </div>
          </section>
        ) : (
          <section className="mb-10 text-center">
            <p className="text-sm text-stone-500 mb-4">
              가족이 한 마음으로 모은 편지가 도착했어요
            </p>
            <button
              type="button"
              onClick={() => navigate(`/read/${recipient.id}`)}
              className="w-full bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-base font-semibold py-4 rounded-2xl shadow-lg shadow-rose-200/70 transition-all hover:-translate-y-0.5"
            >
              💌 편지 받으러 가기
            </button>
          </section>
        )}

        </div>

        <footer className="text-center text-xs text-stone-400 mt-10 flex items-center justify-center gap-1.5">
          <Carnation headOnly className="h-4" />
          <span>어버이날, 늘 감사합니다</span>
        </footer>
      </div>

      {photos && photos.length > 0 && lightboxIdx !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={() =>
            setLightboxIdx((i) => (i === null ? null : Math.max(0, i - 1)))
          }
          onNext={() =>
            setLightboxIdx((i) =>
              i === null ? null : Math.min(photos.length - 1, i + 1),
            )
          }
        />
      )}
    </div>
  )
}

function PolaroidGrid({
  photos,
  onOpen,
}: {
  photos: PhotoMeta[] | null
  onOpen: (index: number) => void
}) {
  if (photos === null) {
    // initial loading — show muted skeleton placeholders
    return (
      <div className="grid grid-cols-2 gap-5 sm:gap-6">
        {PLACEHOLDERS.map((p, i) => (
          <PlaceholderPolaroid key={i} gradient={p.gradient} rotate={p.rotate} />
        ))}
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-5 sm:gap-6">
        {PLACEHOLDERS.map((p, i) => (
          <PlaceholderPolaroid key={i} gradient={p.gradient} rotate={p.rotate} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:gap-6">
      {photos.map((photo, i) => (
        <RealPolaroid
          key={photo.id}
          photo={photo}
          rotate={ROTATIONS[i % ROTATIONS.length]}
          delay={i * 80}
          onOpen={() => onOpen(i)}
        />
      ))}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5 px-1">
      <span className="h-px flex-1 bg-rose-200" />
      <span className="text-xs tracking-[0.3em] text-rose-400 uppercase">
        {children}
      </span>
      <span className="h-px flex-1 bg-rose-200" />
    </div>
  )
}

function PlaceholderPolaroid({
  gradient,
  rotate,
}: {
  gradient: string
  rotate: number
}) {
  return (
    <div>
      <div
        className="bg-white p-2.5 pb-7 shadow-lg shadow-stone-300/40 relative"
        style={{ transform: `rotate(${rotate}deg)` }}
      >
        <Tape />
        <div
          className={`aspect-square rounded-sm flex items-center justify-center bg-gradient-to-br ${gradient}`}
        >
          <Carnation headOnly className="h-12 opacity-40" />
        </div>
        <p className="mt-3 text-center font-letter text-sm text-stone-400">
          사진을 기다리는 중…
        </p>
      </div>
    </div>
  )
}

function RealPolaroid({
  photo,
  rotate,
  delay,
  onOpen,
}: {
  photo: PhotoMeta
  rotate: number
  delay: number
  onOpen: () => void
}) {
  return (
    <div className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <button
        type="button"
        onClick={onOpen}
        className="block w-full bg-white p-2.5 pb-7 shadow-lg shadow-stone-300/40 relative text-left transition-transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]"
        style={{ transform: `rotate(${rotate}deg)` }}
      >
        <Tape />
        <div className="aspect-square bg-stone-100 rounded-sm overflow-hidden">
          <img
            src={photoImageUrl(photo.id)}
            alt={photo.caption ?? photo.uploaderName}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
        <p
          className="mt-3 text-center font-letter text-base text-stone-700 px-1"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {photo.caption?.trim() || `— ${photo.uploaderName}`}
        </p>
      </button>
    </div>
  )
}

function Tape() {
  return (
    <div
      className="absolute -top-2.5 left-1/2 w-10 h-4 bg-amber-200/70 shadow-sm"
      style={{ transform: 'translateX(-50%) rotate(-3deg)' }}
    />
  )
}

function Decoration() {
  return (
    <>
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-rose-200/50 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-20 w-64 h-64 rounded-full bg-amber-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-0 w-72 h-72 rounded-full bg-emerald-100/40 blur-3xl" />
    </>
  )
}

