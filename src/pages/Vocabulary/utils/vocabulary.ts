import type { JLPTLevel, VocabularyItem, VocabularyLibrary, VocabularySet, VocabularySource } from '@/typings'

export const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']

type VocabularyInput = Omit<VocabularyItem, 'id' | 'setId'> & { id?: string; setId?: string }

type LegacyVocabularyItem = Omit<VocabularyItem, 'setId'>

export type VocabularyImportSource = {
  text: string
  filename?: string
}

export type VocabularyImportResult =
  | { sets: VocabularySet[]; items: VocabularyItem[]; duplicates: VocabularyItem[] }
  | { error: string }

const isJLPTLevel = (value: unknown): value is JLPTLevel => typeof value === 'string' && JLPT_LEVELS.includes(value as JLPTLevel)

const isVocabularySource = (value: unknown): value is VocabularySource => value === undefined || value === 'manual' || value === 'article'

const createId = (prefix = 'vocabulary') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const duplicateKey = (item: Pick<VocabularyItem, 'word' | 'reading'>) => `${item.word}\u0000${item.reading}`

export const getVocabularySpeechText = (item: Pick<VocabularyItem, 'word' | 'reading'>) => item.reading || item.word

const technicalTitlePattern = /^(?:set\s+[a-z0-9]+|batch\s+\d+|批次\s*\d+)$/iu

export const validateVocabularySetTitle = (value: unknown) => {
  if (typeof value !== 'string' || value.trim() === '') return { error: '題庫名稱必須是非空字串。' } as const
  if (technicalTitlePattern.test(value.trim())) return { error: '題庫名稱必須描述主題，不能使用 Set、Batch 或批次編號。' } as const
  return value.trim()
}

export const validateVocabularyInput = (
  value: unknown,
  id = createId(),
  setId?: string,
  inheritedLevel?: JLPTLevel,
): VocabularyItem | string => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '必須是 JSON object。'
  const input = value as Partial<VocabularyInput>
  const jlptLevel = input.jlptLevel ?? inheritedLevel
  if (!isJLPTLevel(jlptLevel)) return 'jlptLevel 只允許 N5、N4、N3、N2、N1。'
  if (inheritedLevel && input.jlptLevel && input.jlptLevel !== inheritedLevel) return `jlptLevel 必須與題庫 ${inheritedLevel} 相同。`
  if (typeof input.word !== 'string' || input.word.trim() === '') return 'word 必須是非空字串。'
  if (typeof input.reading !== 'string' || input.reading.trim() === '') return 'reading 必須是非空字串。'
  if (typeof input.meaning !== 'string' || input.meaning.trim() === '') return 'meaning 必須是非空字串。'
  if (!isVocabularySource(input.source)) return 'source 只允許 manual 或 article。'
  if (input.sourceTitle !== undefined && (typeof input.sourceTitle !== 'string' || input.sourceTitle.trim() === '')) return 'sourceTitle 必須是非空字串。'

  return {
    id,
    setId: setId ?? input.setId ?? '',
    jlptLevel,
    word: input.word.trim(),
    reading: input.reading.trim(),
    meaning: input.meaning.trim(),
    source: input.source ?? 'manual',
    ...(input.sourceTitle ? { sourceTitle: input.sourceTitle.trim() } : {}),
  }
}

const isVocabularyLibrary = (value: unknown): value is VocabularyLibrary => {
  if (!value || typeof value !== 'object') return false
  const library = value as Partial<VocabularyLibrary>
  return library.version === 1 && Array.isArray(library.sets) && Array.isArray(library.items)
}

const migratedSetId = (level: JLPTLevel) => `vocabulary-set-migrated-${level.toLowerCase()}`

export const migrateVocabularyLibrary = (current: unknown, legacyItems: unknown): VocabularyLibrary => {
  if (isVocabularyLibrary(current)) return current
  if (!Array.isArray(legacyItems)) return { version: 1, sets: [], items: [] }

  const grouped = new Map<JLPTLevel, LegacyVocabularyItem[]>()
  for (const value of legacyItems) {
    if (!value || typeof value !== 'object') continue
    const input = value as Partial<LegacyVocabularyItem>
    if (!isJLPTLevel(input.jlptLevel)) continue
    const validated = validateVocabularyInput(input, typeof input.id === 'string' ? input.id : createId(), migratedSetId(input.jlptLevel))
    if (typeof validated === 'string') continue
    const items = grouped.get(input.jlptLevel) ?? []
    items.push(validated)
    grouped.set(input.jlptLevel, items)
  }

  const createdAt = new Date().toISOString()
  const sets: VocabularySet[] = []
  const items: VocabularyItem[] = []
  for (const level of JLPT_LEVELS) {
    const levelItems = grouped.get(level) ?? []
    if (levelItems.length === 0) continue
    const id = migratedSetId(level)
    sets.push({
      id,
      title: level === 'N4' && levelItems.length === 100 ? 'N4｜實用自由行單字 100' : `${level}｜已匯入單字`,
      jlptLevel: level,
      createdAt,
    })
    items.push(...levelItems.map((item) => ({ ...item, setId: id })))
  }
  return { version: 1, sets, items }
}

const filenameTitle = (filename?: string) => filename?.replace(/\.json$/iu, '').trim()

export const importVocabularySets = (
  sources: VocabularyImportSource[],
  _existingLibrary: VocabularyLibrary,
  pastedTitle?: string,
): VocabularyImportResult => {
  const sets: VocabularySet[] = []
  const items: VocabularyItem[] = []
  const duplicates: VocabularyItem[] = []
  const createdAt = new Date().toISOString()

  for (let fileIndex = 0; fileIndex < sources.length; fileIndex += 1) {
    const source = sources[fileIndex]
    let parsed: unknown
    try {
      parsed = JSON.parse(source.text)
    } catch {
      return sources.length > 1
        ? { error: `第 ${fileIndex + 1} 個檔案格式錯誤：無法讀取 JSON。` }
        : { error: '無法讀取 JSON。' }
    }

    const isSetFormat = Boolean(parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'items' in parsed)
    const setInput = isSetFormat ? (parsed as { title?: unknown; jlptLevel?: unknown; items?: unknown }) : undefined
    const rawItems = isSetFormat ? setInput?.items : Array.isArray(parsed) ? parsed : [parsed]
    if (!Array.isArray(rawItems)) {
      const prefix = sources.length > 1 ? `第 ${fileIndex + 1} 個檔案，` : ''
      return { error: `${prefix}items 必須是 JSON array。` }
    }

    const rawTitle = setInput?.title ?? filenameTitle(source.filename) ?? pastedTitle
    if (rawTitle === undefined) return { error: '請輸入題庫名稱。' }
    const title = validateVocabularySetTitle(rawTitle)
    if (typeof title !== 'string') return title

    const inheritedLevel = setInput?.jlptLevel
    if (inheritedLevel !== undefined && !isJLPTLevel(inheritedLevel)) return { error: 'jlptLevel 只允許 N5、N4、N3、N2、N1。' }
    const setId = createId('vocabulary-set')
    const parsedItems: VocabularyItem[] = []
    const acceptedKeys = new Set<string>()
    let resolvedLevel = inheritedLevel as JLPTLevel | undefined
    for (let itemIndex = 0; itemIndex < rawItems.length; itemIndex += 1) {
      const item = validateVocabularyInput(rawItems[itemIndex], createId(), setId, resolvedLevel)
      if (typeof item === 'string') {
        const prefix = sources.length > 1 ? `第 ${fileIndex + 1} 個檔案，` : ''
        return { error: `${prefix}第 ${itemIndex + 1} 個單字格式錯誤：${item}` }
      }
      resolvedLevel = resolvedLevel ?? item.jlptLevel
      if (item.jlptLevel !== resolvedLevel) {
        const prefix = sources.length > 1 ? `第 ${fileIndex + 1} 個檔案，` : ''
        return { error: `${prefix}第 ${itemIndex + 1} 個單字格式錯誤：jlptLevel 必須與題庫 ${resolvedLevel} 相同。` }
      }
      const key = duplicateKey(item)
      if (acceptedKeys.has(key)) duplicates.push(item)
      else {
        acceptedKeys.add(key)
        parsedItems.push(item)
      }
    }

    if (!resolvedLevel) return { error: sources.length > 1 ? `第 ${fileIndex + 1} 個檔案沒有單字。` : '題庫至少需要一個單字。' }
    sets.push({ id: setId, title, jlptLevel: resolvedLevel, createdAt })
    items.push(...parsedItems)
  }

  return { sets, items, duplicates }
}

export const importVocabularyItems = (texts: string[], existingItems: VocabularyItem[]): VocabularyImportResult => {
  const existingLibrary: VocabularyLibrary = { version: 1, sets: [], items: existingItems }
  return importVocabularySets(texts.map((text) => ({ text })), existingLibrary)
}

export const findVocabularyDuplicate = (item: VocabularyItem, items: VocabularyItem[]) =>
  items.find((candidate) => candidate.id !== item.id && candidate.setId === item.setId && duplicateKey(candidate) === duplicateKey(item))
