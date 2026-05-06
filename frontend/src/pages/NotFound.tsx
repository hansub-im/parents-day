import { Carnation } from '../components/Carnation'
import { navigate } from '../lib/router'

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-6 text-center">
      <div>
        <Carnation className="h-24 mx-auto mb-5" />
        <h2 className="font-display text-2xl text-stone-800 mb-2">
          페이지를 찾을 수 없어요
        </h2>
        <p className="text-sm text-stone-500 mb-6">
          주소를 다시 확인해주세요.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-2xl transition"
        >
          처음으로
        </button>
      </div>
    </div>
  )
}
