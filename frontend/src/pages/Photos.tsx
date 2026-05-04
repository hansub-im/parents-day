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
import { processWithConcurrency, resizeImage } from '../lib/imageResize'
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

  // 본인이 올린 사진만 보여줌. 다른 사촌이 올린 사진은 부모님 홈에서만 보임.
  const myPhotos = useMemo(
    () => (writer ? photos.filter((p) => p.uploaderName === writer.name) : []),
    [photos, writer?.name],
  )

  // 다중 선택 삭제
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const togglePhotoSelect = (id: number) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedPhotoIds)
    if (ids.length === 0) return
    if (!confirm(`사진 ${ids.length}장을 정말 삭제할까요?`)) return
    setBulkDeleting(true)
    const failures: number[] = []
    await processWithConcurrency(
      ids,
      async (id) => {
        try {
          await deletePhoto(id)
        } catch (e) {
          console.error('Delete failed for', id, e)
          failures.push(id)
        }
      },
      4,
    )
    setSelectedPhotoIds(new Set())
    setBulkDeleting(false)
    if (failures.length > 0) {
      alert(`${failures.length}장 삭제 실패`)
    }
    await reload()
  }

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
    const failures: string[] = []

    await processWithConcurrency(
      files,
      async (file) => {
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
          failures.push(file.name)
        } finally {
          done += 1
          setUploading({ done, total: files.length })
        }
      },
      3,
    )

    setUploading(null)
    if (inputRef.current) inputRef.current.value = ''
    if (failures.length > 0) {
      alert(`업로드 실패: ${failures.join(', ')}`)
    }
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
          내가 올린 사진 {myPhotos.length}장
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

      {myPhotos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 p-10 text-center">
          <div className="text-3xl mb-3">🌷</div>
          <p className="text-sm text-stone-500">
            첫 사진을 올려보세요!
            <br />
            여러분이 올린 사진은 여기에 모여요.
          </p>
        </div>
      ) : (
        <>
          {myPhotos.length > 1 && (
            <p className="text-[11px] text-stone-400 mb-3 px-1">
              여러 장을 한 번에 지우려면 사진을 눌러서 선택하세요.
            </p>
          )}
          <ul className="grid grid-cols-2 gap-4">
            {myPhotos.map((photo) => (
              <li key={photo.id}>
                <PhotoCard
                  photo={photo}
                  selected={selectedPhotoIds.has(photo.id)}
                  onToggle={() => togglePhotoSelect(photo.id)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <footer className="mt-12 text-center text-xs text-stone-400">
        🌷 함께 만드는 어버이날
      </footer>

      {/* 선택된 사진 삭제 바 (선택된 게 있을 때만) */}
      {selectedPhotoIds.size > 0 && (
        <>
          {/* 콘텐츠가 바에 가려지지 않게 여백 */}
          <div className="h-24" />
          <div className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-5 pt-4 bg-gradient-to-t from-white via-white/95 to-white/0">
            <div className="max-w-2xl mx-auto flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedPhotoIds(new Set())}
                disabled={bulkDeleting}
                className="px-5 py-3 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex-1 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 disabled:bg-stone-300 text-white font-semibold py-3 rounded-full shadow-lg shadow-rose-200/70 transition"
              >
                {bulkDeleting
                  ? '삭제 중…'
                  : `${selectedPhotoIds.size}장 삭제`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function PhotoCard({
  photo,
  selected,
  onToggle,
}: {
  photo: PhotoMeta
  selected: boolean
  onToggle: () => void
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
    <button
      type="button"
      onClick={onToggle}
      className={[
        'block w-full bg-white p-2 pb-5 shadow-md shadow-stone-300/40 relative text-left transition',
        selected
          ? 'ring-4 ring-rose-400 -translate-y-0.5 shadow-rose-200'
          : 'hover:shadow-lg',
      ].join(' ')}
    >
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
      <div
        className={[
          'absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center text-base font-bold border-2 transition shadow-sm',
          selected
            ? 'bg-rose-500 text-white border-rose-500'
            : 'bg-white/95 text-transparent border-stone-300',
        ].join(' ')}
      >
        ✓
      </div>
    </button>
  )
}
