import { useEffect, useState } from 'react'
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

export default function Home({ recipientId }: { recipientId: string }) {
  const recipient = findRecipient(recipientId)
  const [letterCount, setLetterCount] = useState<number>(0)
  const [photos, setPhotos] = useState<PhotoMeta[] | null>(null)

  useEffect(() => {
    if (!recipient) return
    let cancelled = false

    Promise.all([
      getLettersByRecipient(recipient.id).catch(() => []),
      getAllPhotos().catch(() => []),
    ]).then(([ls, ps]) => {
      if (cancelled) return
      setLetterCount(ls.length)
      setPhotos(ps.filter((p) => photoTargetsRecipient(p, recipient.id)))
    })

    return () => {
      cancelled = true
    }
  }, [recipient?.id])

  if (!recipient) {
    return (
      <div className="min-h-full flex items-center justify-center px-6 text-center">
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
    <div className="min-h-full relative overflow-hidden">
      <Decoration />

      <div className="relative z-10 max-w-md mx-auto px-5 py-6 min-h-full flex flex-col">
        {letterCount > 0 && (
          <button
            type="button"
            onClick={() => navigate(`/read/${recipient.id}`)}
            className="self-start inline-flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-full transition"
          >
            ✉ 받은 편지 {letterCount}통 →
          </button>
        )}

        <div className="my-auto py-8 w-full">

        {/* Hero */}
        <header className="text-center mb-10">
          <div className="mb-5 flex justify-center">
            <Carnation />
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
          <PolaroidGrid photos={photos} />
        </section>

        {/* Quote */}
        <section className="mb-12 px-2">
          <div className="rounded-3xl bg-white/70 backdrop-blur-sm border border-rose-100 p-7 text-center shadow-sm shadow-rose-100/30">
            <div className="text-2xl mb-3">🌷</div>
            <p className="font-letter text-lg text-stone-700 leading-loose">
              늘 우리 곁에 계셔주셔서<br />
              감사하고, 또 감사해요.
            </p>
          </div>
        </section>

        {/* CTA */}
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

        </div>

        <footer className="text-center text-xs text-stone-400 mt-10">
          🌷 어버이날, 늘 감사합니다
        </footer>
      </div>
    </div>
  )
}

function PolaroidGrid({ photos }: { photos: PhotoMeta[] | null }) {
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
          <div className="text-3xl opacity-40">🌷</div>
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
}: {
  photo: PhotoMeta
  rotate: number
  delay: number
}) {
  return (
    <div className="animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="bg-white p-2.5 pb-7 shadow-lg shadow-stone-300/40 relative"
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
        <p className="mt-3 text-center font-letter text-base text-stone-700 px-1 truncate">
          {photo.caption?.trim() || `— ${photo.uploaderName}`}
        </p>
      </div>
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

function Carnation() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="animate-bloom"
    >
      <g transform="translate(48 50)">
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-16"
            rx="14"
            ry="20"
            fill="#fb7185"
            opacity="0.85"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle cx="0" cy="0" r="13" fill="#e11d48" />
        <circle cx="-3" cy="-3" r="4" fill="#fda4af" opacity="0.7" />
      </g>
      <path
        d="M48 60 Q 50 76 56 86"
        stroke="#15803d"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M50 72 Q 60 70 64 64"
        stroke="#15803d"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
