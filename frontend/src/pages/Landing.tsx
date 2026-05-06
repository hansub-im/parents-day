import { Carnation } from '../components/Carnation'
import { navigate } from '../lib/router'

export default function Landing() {
  return (
    <div className="min-h-dvh relative overflow-hidden">
      <Decoration />

      <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-8 animate-bloom">
          <Carnation className="h-32 animate-carnation-sway" />
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

function Decoration() {
  return (
    <>
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-rose-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-amber-100/60 blur-3xl" />
    </>
  )
}
