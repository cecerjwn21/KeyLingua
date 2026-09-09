import type {
  CEFRLevel,
  EnglishDialogueTypingSession,
  EnglishPracticeDocument,
  EnglishPracticeSentence,
  EnglishVocabularyItem,
  EnglishVocabularyLibrary,
  EnglishVocabularySet,
} from '@/typings'
import { CEFR_LEVELS } from '@/typings'

export type EnglishImportInput = { text: string; filename?: string }

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const isCEFRLevel = (value: unknown): value is CEFRLevel => typeof value === 'string' && CEFR_LEVELS.includes(value as CEFRLevel)
const nonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const fallbackTitleFromFilename = (filename?: string) => filename?.replace(/\.json$/i, '').trim() ?? ''
const describeInput = (input: EnglishImportInput, inputIndex: number) =>
  `第 ${inputIndex + 1} 個檔案${input.filename ? `（${input.filename}）` : ''}`

export const normalizeEnglishTypingText = (text: string) =>
  text.trim().replace(/[‘’]/g, "'").replace(/[“”]/g, '"')

const validateNamedTitle = (title: string) => {
  if (/^(set|batch)\s*[a-z0-9]+$/i.test(title) || /^批次\s*\d+$/u.test(title)) {
    return '名稱必須描述主題，不能使用 Set、Batch 或批次編號。'
  }
  return undefined
}

const parseInputJSON = (input: EnglishImportInput, inputIndex: number): { value: unknown } | { error: string } => {
  try {
    return { value: JSON.parse(input.text) as unknown }
  } catch {
    return { error: `${describeInput(input, inputIndex)}不是有效的 JSON。` }
  }
}

const validateSentence = (value: unknown, location: string, sentenceIndex: number): EnglishPracticeSentence | { error: string } => {
  if (!isRecord(value)) return { error: `${location}，第 ${sentenceIndex + 1} 句格式錯誤：必須是物件。` }
  if (!nonEmptyString(value.text)) {
    return { error: `${location}，第 ${sentenceIndex + 1} 句格式錯誤：text 必須是非空字串。` }
  }
  if (!nonEmptyString(value.meaning)) {
    return { error: `${location}，第 ${sentenceIndex + 1} 句格式錯誤：meaning 必須是非空字串。` }
  }
  if ('reading' in value || 'romaji' in value) {
    return { error: `${location}，第 ${sentenceIndex + 1} 句格式錯誤：English sentence 不可包含 reading 或 romaji。` }
  }
  if (value.speaker !== undefined && !nonEmptyString(value.speaker)) {
    return { error: `${location}，第 ${sentenceIndex + 1} 句格式錯誤：speaker 必須是非空字串。` }
  }
  return {
    text: normalizeEnglishTypingText(value.text),
    meaning: value.meaning.trim(),
    ...(value.speaker ? { speaker: value.speaker.trim() } : {}),
  }
}

const validateDialogueCandidate = (
  value: unknown,
  location: string,
  fallbackTitle?: string,
): Omit<EnglishPracticeDocument, 'id' | 'source' | 'createdAt'> | { error: string } => {
  if (!isRecord(value)) return { error: `${location}格式錯誤：內容必須是物件。` }
  const title = nonEmptyString(value.title) ? value.title.trim() : fallbackTitleFromFilename(fallbackTitle)
  if (!title) return { error: `${location}格式錯誤：title 必須是非空字串。` }
  const titleError = validateNamedTitle(title)
  if (titleError) return { error: `${location}格式錯誤：${titleError}` }
  if (!isCEFRLevel(value.level)) return { error: `${location}格式錯誤：level 必須是 A1、A2、B1、B2、C1 或 C2。` }
  if (!Array.isArray(value.sentences) || value.sentences.length === 0) {
    return { error: `${location}格式錯誤：sentences 必須是非空陣列。` }
  }
  const sentences: EnglishPracticeSentence[] = []
  for (const [sentenceIndex, sentence] of Array.from(value.sentences.entries())) {
    const validated = validateSentence(sentence, location, sentenceIndex)
    if ('error' in validated) return validated
    sentences.push(validated)
  }
  return { title, level: value.level, sentences }
}

export const importEnglishDialogueDocuments = (
  inputs: EnglishImportInput[],
): { documents: EnglishPracticeDocument[] } | { error: string } => {
  const candidates: Omit<EnglishPracticeDocument, 'id' | 'source' | 'createdAt'>[] = []
  for (const [fileIndex, input] of Array.from(inputs.entries())) {
    const parsed = parseInputJSON(input, fileIndex)
    if ('error' in parsed) return parsed
    const values = Array.isArray(parsed.value) ? parsed.value : [parsed.value]
    for (const [candidateIndex, value] of Array.from(values.entries())) {
      const location = `${describeInput(input, fileIndex)}${values.length > 1 ? `的第 ${candidateIndex + 1} 筆資料` : ''}`
      const validated = validateDialogueCandidate(value, location, input.filename)
      if ('error' in validated) return validated
      candidates.push(validated)
    }
  }
  const now = new Date().toISOString()
  return {
    documents: candidates.map((candidate) => ({
      ...candidate,
      id: createId('english-dialogue'),
      source: 'imported',
      createdAt: now,
    })),
  }
}

type VocabularyCandidate = {
  title: string
  level: CEFRLevel
  items: Array<Pick<EnglishVocabularyItem, 'word' | 'meaning' | 'source' | 'sourceTitle'>>
}

const validateVocabularyCandidate = (value: unknown, location: string, filename?: string): VocabularyCandidate | { error: string } => {
  if (!isRecord(value)) return { error: `${location}格式錯誤：內容必須是物件。` }
  const title = nonEmptyString(value.title) ? value.title.trim() : fallbackTitleFromFilename(filename)
  if (!title) return { error: `${location}格式錯誤：title 必須是非空字串。` }
  const titleError = validateNamedTitle(title)
  if (titleError) return { error: `${location}格式錯誤：${titleError}` }
  if (!isCEFRLevel(value.level)) return { error: `${location}格式錯誤：level 必須是 A1、A2、B1、B2、C1 或 C2。` }
  if (!Array.isArray(value.items) || value.items.length === 0) {
    return { error: `${location}格式錯誤：items 必須是非空陣列。` }
  }
  const items: VocabularyCandidate['items'] = []
  for (const [itemIndex, item] of Array.from(value.items.entries())) {
    if (!isRecord(item)) return { error: `${location}，第 ${itemIndex + 1} 個單字格式錯誤：必須是物件。` }
    if (!nonEmptyString(item.word)) {
      return { error: `${location}，第 ${itemIndex + 1} 個單字格式錯誤：word 必須是非空字串。` }
    }
    if (!nonEmptyString(item.meaning)) {
      return { error: `${location}，第 ${itemIndex + 1} 個單字格式錯誤：meaning 必須是非空字串。` }
    }
    if ('reading' in item) {
      return { error: `${location}，第 ${itemIndex + 1} 個單字格式錯誤：English vocabulary 不可包含 reading。` }
    }
    const source = item.source === undefined || item.source === 'manual' || item.source === 'imported' ? item.source : undefined
    if (item.source !== undefined && source === undefined) {
      return { error: `${location}，第 ${itemIndex + 1} 個單字格式錯誤：source 必須是 manual 或 imported。` }
    }
    if (item.sourceTitle !== undefined && !nonEmptyString(item.sourceTitle)) {
      return { error: `${location}，第 ${itemIndex + 1} 個單字格式錯誤：sourceTitle 必須是非空字串。` }
    }
    items.push({
      word: normalizeEnglishTypingText(item.word),
      meaning: item.meaning.trim(),
      source: source ?? 'imported',
      ...(nonEmptyString(item.sourceTitle) ? { sourceTitle: item.sourceTitle.trim() } : {}),
    })
  }
  return { title, level: value.level, items }
}

export const importEnglishVocabularySets = (
  inputs: EnglishImportInput[],
  existing: EnglishVocabularyLibrary,
):
  | { library: EnglishVocabularyLibrary; sets: EnglishVocabularySet[]; items: EnglishVocabularyItem[]; duplicates: string[] }
  | { error: string } => {
  const candidates: VocabularyCandidate[] = []
  for (const [fileIndex, input] of Array.from(inputs.entries())) {
    const parsed = parseInputJSON(input, fileIndex)
    if ('error' in parsed) return parsed
    const values = Array.isArray(parsed.value) ? parsed.value : [parsed.value]
    for (const [candidateIndex, value] of Array.from(values.entries())) {
      const location = `${describeInput(input, fileIndex)}${values.length > 1 ? `的第 ${candidateIndex + 1} 筆資料` : ''}`
      const validated = validateVocabularyCandidate(value, location, input.filename)
      if ('error' in validated) return validated
      candidates.push(validated)
    }
  }

  const createdSets: EnglishVocabularySet[] = []
  const createdItems: EnglishVocabularyItem[] = []
  const duplicates: string[] = []
  for (const candidate of candidates) {
    const setId = createId('english-vocabulary-set')
    const set = { id: setId, title: candidate.title, level: candidate.level, createdAt: new Date().toISOString() }
    const seenWords = new Set<string>()
    createdSets.push(set)
    for (const item of candidate.items) {
      if (seenWords.has(item.word)) {
        duplicates.push(item.word)
        continue
      }
      seenWords.add(item.word)
      createdItems.push({ ...item, id: createId('english-vocabulary-item'), setId })
    }
  }

  const library = {
    version: 1 as const,
    sets: [...existing.sets, ...createdSets],
    items: [...existing.items, ...createdItems],
  }
  return { library, sets: createdSets, items: createdItems, duplicates }
}

export const createEnglishDialogueTypingSession = (document: EnglishPracticeDocument): EnglishDialogueTypingSession => {
  return {
    typingItems: document.sentences.map((sentence) => ({ name: sentence.text, trans: [sentence.meaning] })),
    sentencePresentations: document.sentences.map((sentence) => ({ targetStart: 0, targetEnd: sentence.text.length })),
  }
}
