type StorageAccess = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type Identified = { id: string }
type Vocabulary<S, I> = { version: 1; sets: S[]; items: I[] }

export const starterLedgerKey = (key: string) => `keylinguaStarter:${key}`
const hasId = (value: unknown): value is Identified =>
  Boolean(value) && typeof value === 'object' && typeof (value as Identified).id === 'string'

const readJSON = (storage: StorageAccess, key: string): unknown => {
  const raw = storage.getItem(key)
  return raw === null ? undefined : JSON.parse(raw)
}

const readLedger = (storage: StorageAccess, key: string): string[] => {
  const value = readJSON(storage, starterLedgerKey(key))
  if (value === undefined) return []
  if (!Array.isArray(value) || !value.every((id) => typeof id === 'string')) throw new Error('無法辨識內建題庫紀錄。')
  return value
}

// 先寫題庫再記錄 ID；若紀錄失敗，立即回復原始序列化內容，避免半成功 seed。
const persist = (storage: StorageAccess, key: string, current: unknown, merged: unknown, seen: string[], ids: string[]) => {
  const changed = JSON.stringify(current) !== JSON.stringify(merged)
  const original = storage.getItem(key)
  if (changed) storage.setItem(key, JSON.stringify(merged))
  const next = Array.from(new Set([...seen, ...ids]))
  try {
    if (next.length !== seen.length) storage.setItem(starterLedgerKey(key), JSON.stringify(next))
  } catch (error) {
    if (changed) {
      if (original === null) storage.removeItem(key)
      else storage.setItem(key, original)
    }
    throw error
  }
}

export const seedStarterDocuments = <T extends Identified>(storage: StorageAccess, key: string, starter: T[]): T[] | undefined => {
  try {
    const stored = readJSON(storage, key)
    if (stored !== undefined && (!Array.isArray(stored) || !stored.every(hasId))) return undefined
    const current = (stored ?? []) as T[]
    const seen = readLedger(storage, key)
    const excluded = new Set([...seen, ...current.map(({ id }) => id)])
    const merged = [...current, ...starter.filter(({ id }) => !excluded.has(id))]
    persist(
      storage,
      key,
      stored,
      merged,
      seen,
      starter.map(({ id }) => id),
    )
    return merged
  } catch {
    // 無法讀寫時保留原資料，不清空儲存空間，也不留下成功標記。
    return undefined
  }
}

export const seedStarterVocabulary = <S extends Identified, I extends Identified & { setId: string }>(
  storage: StorageAccess,
  key: string,
  starter: Vocabulary<S, I>,
  initial: Vocabulary<S, I> = { version: 1, sets: [], items: [] },
): Vocabulary<S, I> | undefined => {
  try {
    const stored = readJSON(storage, key)
    const current = (stored === undefined ? initial : stored) as Vocabulary<S, I>
    if (
      !current ||
      current.version !== 1 ||
      !Array.isArray(current.sets) ||
      !current.sets.every(hasId) ||
      !Array.isArray(current.items) ||
      !current.items.every((item) => hasId(item) && typeof item.setId === 'string')
    )
      return undefined
    const seen = readLedger(storage, key)
    const excluded = new Set([...seen, ...current.sets.map(({ id }) => id), ...current.items.map(({ setId }) => setId)])
    const occupied = new Set(current.items.map(({ id }) => id))
    const additions = starter.sets.filter(
      ({ id }) => !excluded.has(id) && !starter.items.some((item) => item.setId === id && occupied.has(item.id)),
    )
    const addedIds = new Set(additions.map(({ id }) => id))
    const merged = {
      ...current,
      sets: [...current.sets, ...additions],
      items: [...current.items, ...starter.items.filter(({ setId }) => addedIds.has(setId))],
    }
    persist(
      storage,
      key,
      stored,
      merged,
      seen,
      starter.sets.map(({ id }) => id),
    )
    return merged
  } catch {
    return undefined
  }
}
