import { navigate } from '../lib/router'

export default function Landing() {
  return (
    <div className="min-h-full relative overflow-hidden">
      <Decoration />

      <main className="relative z-10 flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-8 animate-bloom">
          <Carnation />
        </div>

        <p className="mb-3 text-xs tracking-[0.4em] text-rose-400 uppercase">
          Parents&apos; Day 2026
        </p>
        <h1 className="font-display text-5xl sm:text-6xl text-stone-800 mb-5 leading-tight">
          어버이날 편지
        </h1>
        <p className="text-stone-500 mb-12 leading-relaxed max-w-xs">
          사촌들이 한 마음으로 모아 쓰는<br />
          가족 편지책 한 권
        </p>

        <div className="w-full max-w-xs space-y-3">
          <button
            type="button"
            onClick={() => navigate('/write')}
            className="w-full bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-base font-semibold py-4 rounded-2xl shadow-lg shadow-rose-200/70 transition-all hover:-translate-y-0.5"
          >
            편지 쓰러 가기
          </button>

          <p className="pt-2 text-xs text-stone-400">
            받는 분들은 따로 받으신 링크로 열어주세요
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="absolute bottom-6 right-6 text-[11px] text-stone-300 hover:text-stone-500 transition"
        >
          관리
        </button>
      </main>
    </div>
  )
}

function Carnation() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
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

function Decoration() {
  return (
    <>
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-rose-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-amber-100/60 blur-3xl" />
    </>
  )
}
