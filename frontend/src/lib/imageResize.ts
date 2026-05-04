/**
 * Resize an image client-side before upload to keep payloads reasonable on mobile.
 * Phone photos are easily 5-10MB; resizing to ~1600px max + 0.85 JPEG quality
 * brings them down to ~200-500KB without visible quality loss.
 */
export async function resizeImage(
  file: File,
  maxDim = 1600,
  quality = 0.85,
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
