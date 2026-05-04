import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  findFamily,
  findRecipient,
  RECIPIENTS,
  recipientLabelFor,
} from '../config/family'
import {
  deletePhoto,
  getAllPhotos,
  getCurrentWriter,
  photoImageUrl,
  photoRecipientIdSet,
  uploadPhoto,
  type PhotoMeta,
} from '../lib/storage'
import { resizeImage } from '../lib/imageResize'
import { navigate } from '../lib/router'

export default function Photos() {
  const writer = getCurrentWriter()
  const [photos, setPhotos] = useState<PhotoMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Default selected recipients: writer's own parents
  const defaultIds = useMemo(() => {
    if (!writer) return new Set<string>()
    const f = findFamily(writer.familyId)
    if (!f) return new Set<string>()
    const ids: string[] = [f.fatherId]
    if (f.motherId) ids.push(f.motherId)
    return new Set(ids)
  }, [writer?.familyId])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(defaultIds)

  // sync default when writer changes
  useEffect(() => {
    setSelectedIds(new Set(defaultIds))
  }, [defaultIds])

  const reload = async () => {
    setLoading(true)
    try {
      setPhotos(await getAllPhotos())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  if (!writer) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl mb-5">📸</p>
        <h2 className="font-display text-2xl text-stone-800 mb-2">
          먼저 본인 이름을 골라주세요
        </h2>
        <p className="text-sm text-stone-500 mb-6 max-w-xs">
          누가 올린 사진인지 알아야 같이 만들어진 추억이 돼요.
        </p>
        <button
          type="button"
          onClick={() => navigate('/write')}
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-2xl transition"
        >
          편지 쓰러 가기
        </button>
      </div>
    )
  }

  const toggleRecipient = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    if (selectedIds.size === 0) {
      alert('어느 분의 사진인지 한 명 이상 선택해주세요.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    const recipientIds = Array.from(selectedIds)

    setUploading({ done: 0, total: files.length })
    let done = 0
    for (const file of files) {
      try {
        const { blob } = await resizeImage(file)
        await uploadPhoto({
          file: blob,
          uploaderName: writer.name,
          uploaderFamilyId: writer.familyId,
          recipientIds,
          filename: file.name,
        })
      } catch (err) {
        console.error('Upload failed for', file.name, err)
        alert(`${file.name} 업로드 실패`)
      } finally {
        done += 1
        setUploading({ done, total: files.length })
      }
    }
    setUploading(null)
    if (inputRef.current) inputRef.current.value = ''
    await reload()
  }

  return (
    <div className="min-h-full px-5 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate('/write')}
          className="text-sm text-stone-400 hover:text-stone-600"
        >
          ← 편지로
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-xs text-stone-400 hover:text-stone-600"
        >
          처음으로
        </button>
      </div>

      <header className="mb-6">
        <p className="text-xs tracking-[0.4em] text-rose-400 uppercase mb-2">
          For 추억의 홈
        </p>
        <h1 className="font-display text-3xl text-stone-800 mb-1">
          가족 사진 모으기
        </h1>
        <p className="text-sm text-stone-500 leading-relaxed">
          폰에 있는 옛날 사진을 올려주세요. 부모님 홈 화면이 함께 채워져요.
        </p>
      </header>

      {/* Recipient picker */}
      <div className="mb-5 bg-white rounded-2xl border border-stone-200 p-4">
        <p className="text-sm font-semibold text-stone-700 mb-1">
          어느 분의 사진인가요?
        </p>
        <p className="text-xs text-stone-400 mb-3">
          선택하신 분 홈 화면에만 사진이 표시돼요. 여러 분 같이 찍은 사진은 다 골라주세요.
        </p>
        <div className="flex flex-wrap gap-2">
          {RECIPIENTS.map((r) => {
            const checked = selectedIds.has(r.id)
            const label = recipientLabelFor(r.id, writer.familyId)
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleRecipient(r.id)}
                className={[
                  'px-3 py-1.5 rounded-full text-sm border transition',
                  checked
                    ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-rose-300',
                ].join(' ')}
              >
                {checked ? '✓ ' : ''}
                {r.realName} <span className="opacity-70 text-xs">({label})</span>
              </button>
            )
          })}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="mb-8 space-y-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading !== null || selectedIds.size === 0}
          className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-stone-300 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-rose-200/70 transition"
        >
          {uploading
            ? `업로드 중… ${uploading.done} / ${uploading.total}`
            : '📸 사진 추가하기'}
        </button>
        {selectedIds.size === 0 && (
          <p className="text-[11px] text-rose-500 text-center">
            ⚠ 받는 분을 한 명 이상 선택해주세요
          </p>
        )}
        {selectedIds.size > 0 && (
          <p className="text-[11px] text-stone-400 text-center">
            여러 장을 한 번에 선택할 수 있어요. 자동으로 크기 조정해서 올라가요.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-semibold text-stone-700">
          모인 사진 {photos.length}장
        </h2>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2 disabled:opacity-50"
        >
          {loading ? '새로고침 중…' : '새로고침'}
        </button>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center">
          <div className="text-3xl mb-3">🌷</div>
          <p className="text-sm text-stone-500">
            첫 사진을 올려보세요!
            <br />
            가족이 한 장씩 올리면 추억의 홈이 완성돼요.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4">
          {photos.map((photo) => (
            <li key={photo.id}>
              <PhotoCard
                photo={photo}
                canDelete={photo.uploaderName === writer.name}
                onDelete={async () => {
                  if (!confirm('정말 삭제할까요?')) return
                  try {
                    await deletePhoto(photo.id)
                    await reload()
                  } catch (e) {
                    console.error(e)
                    alert('삭제 실패')
                  }
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-12 text-center text-xs text-stone-400">
        🌷 함께 만드는 어버이날
      </footer>
    </div>
  )
}

function PhotoCard({
  photo,
  canDelete,
  onDelete,
}: {
  photo: PhotoMeta
  canDelete: boolean
  onDelete: () => void
}) {
  const recipientNames = useMemo(() => {
    const ids = photoRecipientIdSet(photo)
    if (ids.size === 0) return ''
    return Array.from(ids)
      .map((id) => findRecipient(id)?.realName)
      .filter(Boolean)
      .join(', ')
  }, [photo])

  return (
    <div className="bg-white p-2 pb-5 shadow-md shadow-stone-300/40 relative">
      <div className="aspect-square bg-stone-100 rounded-sm overflow-hidden">
        <img
          src={photoImageUrl(photo.id)}
          alt={photo.caption ?? photo.uploaderName}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      <p className="mt-2 text-center font-letter text-sm text-stone-700 truncate px-1">
        {photo.caption?.trim() || `— ${photo.uploaderName}`}
      </p>
      {recipientNames && (
        <p className="mt-0.5 text-[10px] text-rose-500/80 text-center truncate px-1">
          → {recipientNames}
        </p>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 hover:bg-rose-500 hover:text-white text-stone-500 text-xs flex items-center justify-center shadow border border-stone-200 transition"
          title="삭제"
        >
          ✕
        </button>
      )}
    </div>
  )
}
