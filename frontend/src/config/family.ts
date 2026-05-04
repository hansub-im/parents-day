export type RecipientAccent = 'rose' | 'amber' | 'emerald' | 'sky' | 'violet'

export type Recipient = {
  id: string
  /** Project-creator perspective label, used in admin & legacy contexts. */
  label: string
  realName: string
  accent: RecipientAccent
}

export type FamilyId = 'big' | 'middle' | 'small'

export type Family = {
  id: FamilyId
  /** 1 = eldest of the three siblings, 3 = youngest */
  birthOrder: number
  fatherId: string
  /** Some families may not have a mother in the recipient list. */
  motherId?: string
  cousins: string[]
}

export const RECIPIENTS: Recipient[] = [
  { id: 'big-dad',   label: '큰아빠',   realName: '임철원', accent: 'emerald' },
  { id: 'big-mom',   label: '큰엄마',   realName: '곽은숙', accent: 'rose'    },
  { id: 'dad',       label: '아빠',     realName: '임길원', accent: 'amber'   },
  { id: 'small-dad', label: '작은아빠', realName: '임기원', accent: 'sky'     },
  { id: 'small-mom', label: '작은엄마', realName: '김은정', accent: 'violet'  },
]

export const FAMILIES: Family[] = [
  {
    id: 'big',
    birthOrder: 1,
    fatherId: 'big-dad',
    motherId: 'big-mom',
    cousins: ['임호섭', '임현아'],
  },
  {
    id: 'middle',
    birthOrder: 2,
    fatherId: 'dad',
    cousins: ['임한섭', '임가린'],
  },
  {
    id: 'small',
    birthOrder: 3,
    fatherId: 'small-dad',
    motherId: 'small-mom',
    cousins: ['임권섭', '임민섭'],
  },
]

export function familyDisplayName(family: Family): string {
  const father = findRecipient(family.fatherId)
  return father ? `${father.realName} 가족` : family.id
}

export function findRecipient(id: string): Recipient | undefined {
  return RECIPIENTS.find((r) => r.id === id)
}

export function findFamily(id: FamilyId): Family | undefined {
  return FAMILIES.find((f) => f.id === id)
}

export function findFamilyByCousin(name: string): Family | undefined {
  return FAMILIES.find((f) => f.cousins.includes(name))
}

export function recipientPrimary(r: Recipient): string {
  return r.realName
}

/**
 * Returns how `recipientId` should be addressed by a writer in `writerFamilyId`.
 * - Own father/mother → "아빠"/"엄마"
 * - Otherwise → 큰/작은 + 아빠/엄마, with location prefix when ambiguous.
 * If `writerFamilyId` is omitted, falls back to the project-creator label.
 */
export function recipientLabelFor(
  recipientId: string,
  writerFamilyId?: FamilyId,
): string {
  const recipient = findRecipient(recipientId)
  if (!recipient) return recipientId

  if (!writerFamilyId) return recipient.label

  const writerFamily = findFamily(writerFamilyId)
  if (!writerFamily) return recipient.label

  if (recipient.id === writerFamily.fatherId) return '아빠'
  if (recipient.id === writerFamily.motherId) return '엄마'

  const recipientFamily = FAMILIES.find(
    (f) => f.fatherId === recipient.id || f.motherId === recipient.id,
  )
  if (!recipientFamily) return recipient.label

  const isFather = recipientFamily.fatherId === recipient.id
  const isOlder = recipientFamily.birthOrder < writerFamily.birthOrder

  return isOlder
    ? isFather
      ? '큰아빠'
      : '큰엄마'
    : isFather
      ? '작은아빠'
      : '작은엄마'
}

/** "임철원 큰아빠" — for "께" addressing or card subheaders. */
export function recipientAddressFor(
  recipientId: string,
  writerFamilyId?: FamilyId,
): string {
  const recipient = findRecipient(recipientId)
  if (!recipient) return recipientId
  return `${recipient.realName} ${recipientLabelFor(recipientId, writerFamilyId)}`
}
