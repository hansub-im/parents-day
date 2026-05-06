import { useEffect } from 'react'
import { findRecipient } from '../config/family'
import { photoImageUrl, photoRecipientIdSet, type PhotoMeta } from '../lib/storage'

type Props = {
  photos: PhotoMeta[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function Lightbox({ photos, index, onClose, onPrev, onNext }: Props) {
  const photo = photos[index]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPrev()
      else if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, onPrev, onNext])

  if (!photo) return null

  const recipientLabels = Array.from(photoRecipientIdSet(photo))
    .map((id) => findRecipient(id)?.realName)
    .filter(Boolean)
    .join(', ')

  const hasPrev = index > 0
  const hasNext = index < photos.length - 1

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* close (top-right) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white text-xl flex items-center justify-center transition"
        aria-label="닫기"
      >
        ✕
      </button>

      {/* counter (top-left) */}
      <div className="absolute top-5 left-5 text-white/70 text-sm tabular-nums select-none">
        {index + 1} / {photos.length}
      </div>

      {/* prev button */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onPrev()
          }}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white text-2xl flex items-center justify-center transition"
          aria-label="이전"
        >
          ‹
        </button>
      )}

      {/* next button */}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white text-2xl flex items-center justify-center transition"
          aria-label="다음"
        >
          ›
        </button>
      )}

      {/* image + caption (clicks here don't close the modal) */}
      <div
        className="flex flex-col items-center gap-4 max-w-3xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photoImageUrl(photo.id)}
          alt={photo.caption ?? photo.uploaderName}
          className="max-h-[78vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
        />
        <div className="text-center text-white/90 px-4 max-w-full">
          {photo.caption?.trim() && (
            <p className="font-letter text-lg leading-relaxed mb-1 break-words">
              {photo.caption}
            </p>
          )}
          <p className="text-xs text-white/60">
            <span className="font-semibold">{photo.uploaderName}</span>
            {recipientLabels ? <span> · {recipientLabels}</span> : null}
          </p>
        </div>
      </div>
    </div>
  )
}
