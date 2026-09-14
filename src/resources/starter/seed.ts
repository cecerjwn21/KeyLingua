import legacyStarterContent from './legacyStarterContent.json'

type StorageAccess = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type Identified = { id: string }
type Vocabulary<S, I> = { version: 1; sets: S[]; items: I[] }

export const starterLedgerKey = (key: string) => `keylinguaStarter:${key}`
const contentVersionKey = (key: string) => `keylinguaStarterContentVersion:${key}`
// 1：初次發行；2：句尾與英文自然度校訂；3：50 詞與完整情境。
const contentVersion = 3
const legacyContent: Record<string, Record<string, string[]>> = legacyStarterContent
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

const readVersion = (storage: StorageAccess, key: string): number | undefined => {
  if (!Object.prototype.hasOwnProperty.call(legacyContent, key)) return undefined
  const version = readJSON(storage, contentVersionKey(key))
  if (version === undefined) return 0
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 0 || version > contentVersion)
    throw new Error('無法辨識內建教材版本。')
  return version
}

// 精確比對兩次正式發行的完整內容，包含 metadata；不以 ID、句數或短雜湊猜測所有權。
const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(object)
        .sort()
        .map((key) => [key, canonical(object[key])]),
    )
  }
  return value
}
const isUneditedStarter = (key: string, id: string, value: unknown) =>
  legacyContent[key]?.[id]?.includes(JSON.stringify(canonical(value))) ?? false

// 題庫、領取紀錄、版本採同一次寫入流程；任一步失敗便回復已成功寫入的原始字串。
const persist = (storage: StorageAccess, key: string, merged: unknown, seen: string[], ids: string[], version: number | undefined) => {
  const next = Array.from(new Set([...seen, ...ids]))
  const changes: [string, string][] = [[key, JSON.stringify(merged)]]
  if (next.length !== seen.length || next.some((id, index) => id !== seen[index]))
    changes.push([starterLedgerKey(key), JSON.stringify(next)])
  if (version !== undefined && version < contentVersion) changes.push([contentVersionKey(key), String(contentVersion)])
  const originals: [string, string | null][] = []
  try {
    for (const [name, value] of changes) {
      const original = storage.getItem(name)
      if (original === value || (name === key && original !== null && JSON.stringify(JSON.parse(original)) === value)) continue
      storage.setItem(name, value)
      originals.push([name, original])
    }
  } catch (error) {
    for (const [name, original] of originals.reverse()) {
      if (original === null) storage.removeItem(name)
      else storage.setItem(name, original)
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
    const version = readVersion(storage, key)
    const nextById = new Map(starter.map((unit) => [unit.id, unit]))
    const updated = current.map((unit) => {
      const next = nextById.get(unit.id)
      return version !== undefined &&
        version < contentVersion &&
        seen.includes(unit.id) &&
        next &&
        current.filter(({ id }) => id === unit.id).length === 1 &&
        isUneditedStarter(key, unit.id, unit)
        ? next
        : unit
    })
    const excluded = new Set([...seen, ...current.map(({ id }) => id)])
    const merged = [...updated, ...starter.filter(({ id }) => !excluded.has(id))]
    persist(
      storage,
      key,
      merged,
      seen,
      starter.map(({ id }) => id),
      version,
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
    const version = readVersion(storage, key)
    const nextById = new Map(starter.sets.map((set) => [set.id, set]))
    const upgraded = new Set<string>()
    const sets = current.sets.map((set) => {
      const next = nextById.get(set.id)
      if (
        version === undefined ||
        version >= contentVersion ||
        !seen.includes(set.id) ||
        !next ||
        current.sets.filter(({ id }) => id === set.id).length !== 1
      )
        return set
      const items = current.items.filter(({ setId }) => setId === set.id)
      if (!isUneditedStarter(key, set.id, { set, items })) return set
      const foreignIds = new Set(current.items.filter(({ setId }) => setId !== set.id).map(({ id }) => id))
      if (starter.items.some((item) => item.setId === set.id && foreignIds.has(item.id))) return set
      upgraded.add(set.id)
      return next
    })
    const excluded = new Set([...seen, ...current.sets.map(({ id }) => id), ...current.items.map(({ setId }) => setId)])
    const occupied = new Set(current.items.map(({ id }) => id))
    const additions = starter.sets.filter(
      ({ id }) => !excluded.has(id) && !starter.items.some((item) => item.setId === id && occupied.has(item.id)),
    )
    const addedIds = new Set(additions.map(({ id }) => id))
    // 既有 item 順序與 ID 留在原位；新增項目才附加，練習進度不因重排而跳到別組。
    const nextItems = new Map(starter.items.map((item) => [item.id, item]))
    const items = current.items.flatMap((item) => {
      if (!upgraded.has(item.setId)) return [item]
      const next = nextItems.get(item.id)
      return next && next.setId === item.setId ? [next] : []
    })
    const retainedIds = new Set(items.map(({ id }) => id))
    const merged = {
      ...current,
      sets: [...sets, ...additions],
      items: [...items, ...starter.items.filter(({ id, setId }) => addedIds.has(setId) || (upgraded.has(setId) && !retainedIds.has(id)))],
    }
    persist(
      storage,
      key,
      merged,
      seen,
      starter.sets.map(({ id }) => id),
      version,
    )
    return merged
  } catch {
    return undefined
  }
}
