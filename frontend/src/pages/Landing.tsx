import { navigate } from '../lib/router'

export default function Landing() {
  return (
    <div className="min-h-dvh relative overflow-hidden">
      <Decoration />

      <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
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
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* 줄기 */}
      <path
        d="M50 58 Q 48 75 52 95"
        stroke="#15803d"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* 잎 */}
      <path
        d="M50 80 Q 32 76 24 88 Q 38 85 50 82 Z"
        fill="#16a34a"
      />
      <path
        d="M50 70 Q 67 66 74 76 Q 62 73 50 72 Z"
        fill="#16a34a"
      />

      {/* 카네이션 머리 — 풍성한 분홍 펑펑한 모양 */}
      <g transform="translate(50, 36)">
        {/* 바깥 layer: 살짝 흐린 분홍 */}
        <circle cx="-18" cy="-8"  r="11" fill="#fda4af" />
        <circle cx="18"  cy="-8"  r="11" fill="#fda4af" />
        <circle cx="-15" cy="11"  r="11" fill="#fda4af" />
        <circle cx="15"  cy="11"  r="11" fill="#fda4af" />
        <circle cx="0"   cy="-19" r="11" fill="#fda4af" />
        <circle cx="0"   cy="16"  r="10" fill="#fda4af" />

        {/* 중간 layer */}
        <circle cx="-9"  cy="-4"  r="11" fill="#fb7185" />
        <circle cx="9"   cy="-4"  r="11" fill="#fb7185" />
        <circle cx="0"   cy="-11" r="10" fill="#fb7185" />
        <circle cx="-7"  cy="8"   r="10" fill="#fb7185" />
        <circle cx="7"   cy="8"   r="10" fill="#fb7185" />

        {/* 중심 */}
        <circle cx="0" cy="0" r="9" fill="#e11d48" />
        <circle cx="-2" cy="-3" r="3" fill="#fda4af" opacity="0.7" />
      </g>
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
