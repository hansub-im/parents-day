/**
 * Resize an image client-side before upload to keep payloads reasonable on mobile.
 * Phone photos are easily 5-10MB; resizing to ~1280px max + 0.82 JPEG quality
 * brings them down to ~150-300KB without visible quality loss for polaroid views.
 */
export async function resizeImage(
  file: File,
  maxDim = 1280,
  quality = 0.82,
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  )
  if (!blob) throw new Error('Failed to encode JPEG')

  return { blob, width: w, height: h }
}

/** Run async tasks with bounded concurrency. */
export async function processWithConcurrency<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<void>,
  concurrency: number,
): Promise<void> {
  let cursor = 0
  const n = Math.min(concurrency, items.length)
  if (n === 0) return
  const runners = Array.from({ length: n }, async () => {
    while (true) {
      const i = cursor++
      if (i >= items.length) break
      await worker(items[i], i)
    }
  })
  await Promise.all(runners)
}
