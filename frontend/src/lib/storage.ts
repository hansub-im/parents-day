import { findFamilyByCousin, RECIPIENTS, type FamilyId } from '../config/family'

const API_BASE = '/api'

export type Letter = {
  id?: number
  writerName: string
  writerFamilyId?: FamilyId
  recipientId: string
  content: string
  /** ISO 8601 string from the backend */
  updatedAt: string
}

export type Reply = {
  id?: number
  fromRecipientId: string
  /** Empty string means common (1:N) reply. */
  toCousinName: string
  content: string
  updatedAt: string
}

export type Writer = {
  name: string
  familyId: FamilyId
}

const WRITER_KEY = 'parents-day:writer:v2'

// === Writer (kept in localStorage — it's just per-device user identity) ===

export function getCurrentWriter(): Writer | null {
  try {
    const raw = localStorage.getItem(WRITER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed.name === 'string' &&
      typeof parsed.familyId === 'string'
    ) {
      return parsed as Writer
    }
    return null
  } catch {
    return null
  }
}

export function setCurrentWriter(writer: Writer | null) {
  if (writer) localStorage.setItem(WRITER_KEY, JSON.stringify(writer))
  else localStorage.removeItem(WRITER_KEY)
}

// === Letters ===

async function fetchAllLetters(): Promise<Letter[]> {
  const res = await fetch(`${API_BASE}/letters`)
  if (!res.ok) throw new Error(`GET /api/letters ${res.status}`)
  return res.json()
}

export async function getAllLetters(): Promise<Letter[]> {
  return fetchAllLetters()
}

export async function getLettersByWriter(writerName: string): Promise<Letter[]> {
  const all = await fetchAllLetters()
  return all.filter((l) => l.writerName === writerName)
}

export async function getLettersByRecipient(
  recipientId: string,
): Promise<Letter[]> {
  const all = await fetchAllLetters()
  return all
    .filter((l) => l.recipientId === recipientId && l.content.trim().length > 0)
    .sort(
      (a, b) =>
        Date.parse(a.updatedAt ?? '0') - Date.parse(b.updatedAt ?? '0'),
    )
}

export async function getLetter(
  writerName: string,
  recipientId: string,
): Promise<Letter | undefined> {
  const all = await fetchAllLetters()
  return all.find(
    (l) => l.writerName === writerName && l.recipientId === recipientId,
  )
}

export async function saveLetter(input: {
  writerName: string
  writerFamilyId?: FamilyId
  recipientId: string
  content: string
}): Promise<Letter> {
  const res = await fetch(`${API_BASE}/letters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`POST /api/letters ${res.status}`)
  return res.json()
}

export async function deleteLetter(
  writerName: string,
  recipientId: string,
): Promise<void> {
  const params = new URLSearchParams({
    writer: writerName,
    recipient: recipientId,
  })
  const res = await fetch(`${API_BASE}/letters?${params}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE /api/letters ${res.status}`)
}

export async function getWriterProgress(writerName: string): Promise<{
  done: number
  total: number
  doneIds: Set<string>
}> {
  const letters = await getLettersByWriter(writerName)
  const doneIds = new Set(
    letters
      .filter((l) => l.content.trim().length > 0)
      .map((l) => l.recipientId),
  )
  return { done: doneIds.size, total: RECIPIENTS.length, doneIds }
}

export async function getAllWriters(): Promise<
  { name: string; familyId?: FamilyId }[]
> {
  const all = await fetchAllLetters()
  const map = new Map<string, FamilyId | undefined>()
  for (const l of all) {
    if (!map.has(l.writerName)) {
      map.set(
        l.writerName,
        l.writerFamilyId ?? findFamilyByCousin(l.writerName)?.id,
      )
    }
  }
  return Array.from(map.entries())
    .map(([name, familyId]) => ({ name, familyId }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
}

// === Replies ===

async function fetchAllReplies(): Promise<Reply[]> {
  const res = await fetch(`${API_BASE}/replies`)
  if (!res.ok) throw new Error(`GET /api/replies ${res.status}`)
  return res.json()
}

export async function getAllReplies(): Promise<Reply[]> {
  return fetchAllReplies()
}

export async function getCommonReply(
  recipientId: string,
): Promise<Reply | undefined> {
  const all = await fetchAllReplies()
  return all.find(
    (r) => r.fromRecipientId === recipientId && (r.toCousinName ?? '') === '',
  )
}

export async function getIndividualReply(
  recipientId: string,
  cousinName: string,
): Promise<Reply | undefined> {
  const all = await fetchAllReplies()
  return all.find(
    (r) => r.fromRecipientId === recipientId && r.toCousinName === cousinName,
  )
}

export async function saveReply(input: {
  fromRecipientId: string
  toCousinName?: string
  content: string
}): Promise<Reply> {
  const res = await fetch(`${API_BASE}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`POST /api/replies ${res.status}`)
  return res.json()
}

export async function deleteReply(
  recipientId: string,
  toCousinName?: string,
): Promise<void> {
  const params = new URLSearchParams({ recipient: recipientId })
  if (toCousinName) params.append('cousin', toCousinName)
  const res = await fetch(`${API_BASE}/replies?${params}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE /api/replies ${res.status}`)
}

export async function getReplyForCousin(
  recipientId: string,
  cousinName: string,
): Promise<{ reply: Reply; kind: 'individual' | 'common' } | undefined> {
  const all = await fetchAllReplies()
  const ind = all.find(
    (r) => r.fromRecipientId === recipientId && r.toCousinName === cousinName,
  )
  if (ind) return { reply: ind, kind: 'individual' }
  const com = all.find(
    (r) => r.fromRecipientId === recipientId && (r.toCousinName ?? '') === '',
  )
  if (com) return { reply: com, kind: 'common' }
  return undefined
}

// === Photos ===

export type PhotoMeta = {
  id: number
  uploaderName: string
  uploaderFamilyId?: FamilyId
  caption?: string | null
  /** Comma-separated recipient ids, e.g. "big-dad,big-mom". Empty/null = shows on all. */
  recipientIds?: string | null
  createdAt: string
}

export function photoRecipientIdSet(p: PhotoMeta): Set<string> {
  if (!p.recipientIds || !p.recipientIds.trim()) return new Set()
  return new Set(p.recipientIds.split(',').map((s) => s.trim()).filter(Boolean))
}

export function photoTargetsRecipient(
  p: PhotoMeta,
  recipientId: string,
): boolean {
  const set = photoRecipientIdSet(p)
  // empty set = legacy / "all parents" wildcard
  return set.size === 0 || set.has(recipientId)
}

export async function getAllPhotos(): Promise<PhotoMeta[]> {
  const res = await fetch(`${API_BASE}/photos`)
  if (!res.ok) throw new Error(`GET /api/photos ${res.status}`)
  return res.json()
}

export function photoImageUrl(id: number): string {
  return `${API_BASE}/photos/${id}/image`
}

export async function uploadPhoto(input: {
  file: Blob
  uploaderName: string
  uploaderFamilyId?: FamilyId
  caption?: string
  recipientIds?: string[]
  filename?: string
}): Promise<PhotoMeta> {
  const fd = new FormData()
  fd.append('file', input.file, input.filename ?? 'photo.jpg')
  fd.append('uploaderName', input.uploaderName)
  if (input.uploaderFamilyId) fd.append('uploaderFamilyId', input.uploaderFamilyId)
  if (input.caption) fd.append('caption', input.caption)
  if (input.recipientIds && input.recipientIds.length > 0) {
    fd.append('recipientIds', input.recipientIds.join(','))
  }
  const res = await fetch(`${API_BASE}/photos`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error(`POST /api/photos ${res.status}`)
  return res.json()
}

export async function deletePhoto(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/photos/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE /api/photos ${res.status}`)
}
