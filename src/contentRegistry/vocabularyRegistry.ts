import { starterEnglishVocabulary } from '@/resources/starter/englishVocabulary'
import { starterJapaneseVocabulary } from '@/resources/starter/japaneseVocabulary'
import type { EnglishVocabularyLibrary, VocabularyLibrary } from '@/typings'

export type VocabularyRegistryLanguage = 'japanese' | 'english'
export type VocabularyDuplicateStatus = 'EXACT' | 'NEAR' | 'OK'

export type VocabularyRegistryEntry = {
  language: VocabularyRegistryLanguage
  level: string
  unitId: string
  unitTitle: string
  itemId: string
  word: string
  reading?: string
  meaning: string
  normalizedKey: string
  origin: 'starter' | 'custom' | 'pending-import'
}

export type VocabularyImportCandidate = Omit<VocabularyRegistryEntry, 'normalizedKey' | 'origin'>

export type VocabularyDuplicateReviewItem = {
  candidate: VocabularyImportCandidate
  status: VocabularyDuplicateStatus
  matches: VocabularyRegistryEntry[]
}

export type VocabularyDuplicateReview = {
  items: VocabularyDuplicateReviewItem[]
}

export type VocabularyContentRegistry = {
  entries: VocabularyRegistryEntry[]
}

const starterJapaneseSetIds = new Set(starterJapaneseVocabulary.sets.map(({ id }) => id))
const starterEnglishSetIds = new Set(starterEnglishVocabulary.sets.map(({ id }) => id))

const normalizeUnicode = (value: string) => value.normalize('NFKC').trim().replace(/\s+/gu, ' ')
const normalizeMeaning = (value: string) => normalizeUnicode(value).toLocaleLowerCase()

export const normalizeEnglishVocabulary = (value: string) =>
  normalizeUnicode(value)
    .replace(/[‘’ʼ]/gu, "'")
    .replace(/[‐‑‒–—―−]/gu, '-')
    .toLocaleLowerCase()

const normalizeEnglishNearKey = (value: string) => normalizeEnglishVocabulary(value).replace(/[\s-]+/gu, ' ')

const katakanaToHiragana = (value: string) =>
  Array.from(value, (character) => {
    const codePoint = character.codePointAt(0)
    return codePoint && codePoint >= 0x30a1 && codePoint <= 0x30f6 ? String.fromCodePoint(codePoint - 0x60) : character
  }).join('')

export const normalizeJapaneseVocabulary = (value: string) => katakanaToHiragana(normalizeUnicode(value))

const stripJapaneseHonorific = (value: string) => value.replace(/^[おご御]/u, '')

const normalizedExactKey = (entry: Pick<VocabularyRegistryEntry, 'language' | 'word' | 'reading' | 'meaning'>) => {
  const meaning = normalizeMeaning(entry.meaning)
  if (entry.language === 'english') return `${normalizeEnglishVocabulary(entry.word)}\u0000${meaning}`
  return `${normalizeJapaneseVocabulary(entry.word)}\u0000${normalizeJapaneseVocabulary(entry.reading ?? '')}\u0000${meaning}`
}

const entryFromJapanese = (library: VocabularyLibrary, item: VocabularyLibrary['items'][number]): VocabularyRegistryEntry | undefined => {
  const unit = library.sets.find(({ id }) => id === item.setId)
  if (!unit) return undefined
  const entry: VocabularyRegistryEntry = {
    language: 'japanese',
    level: unit.jlptLevel,
    unitId: unit.id,
    unitTitle: unit.title,
    itemId: item.id,
    word: item.word,
    reading: item.reading,
    meaning: item.meaning,
    normalizedKey: '',
    origin: starterJapaneseSetIds.has(unit.id) ? 'starter' : 'custom',
  }
  entry.normalizedKey = normalizedExactKey(entry)
  return entry
}

const entryFromEnglish = (
  library: EnglishVocabularyLibrary,
  item: EnglishVocabularyLibrary['items'][number],
): VocabularyRegistryEntry | undefined => {
  const unit = library.sets.find(({ id }) => id === item.setId)
  if (!unit) return undefined
  const entry: VocabularyRegistryEntry = {
    language: 'english',
    level: unit.level,
    unitId: unit.id,
    unitTitle: unit.title,
    itemId: item.id,
    word: item.word,
    meaning: item.meaning,
    normalizedKey: '',
    origin: starterEnglishSetIds.has(unit.id) ? 'starter' : 'custom',
  }
  entry.normalizedKey = normalizedExactKey(entry)
  return entry
}

export const createVocabularyContentRegistry = (
  japaneseLibrary: VocabularyLibrary,
  englishLibrary: EnglishVocabularyLibrary,
): VocabularyContentRegistry => ({
  entries: [
    ...japaneseLibrary.items.map((item) => entryFromJapanese(japaneseLibrary, item)),
    ...englishLibrary.items.map((item) => entryFromEnglish(englishLibrary, item)),
  ].filter((entry): entry is VocabularyRegistryEntry => Boolean(entry)),
})

const candidateToEntry = (candidate: VocabularyImportCandidate): VocabularyRegistryEntry => {
  const entry: VocabularyRegistryEntry = { ...candidate, normalizedKey: '', origin: 'pending-import' }
  entry.normalizedKey = normalizedExactKey(entry)
  return entry
}

const duplicateRelationship = (candidate: VocabularyRegistryEntry, existing: VocabularyRegistryEntry): VocabularyDuplicateStatus => {
  if (candidate.language !== existing.language) return 'OK'
  if (candidate.normalizedKey === existing.normalizedKey) return 'EXACT'

  const sameMeaning = normalizeMeaning(candidate.meaning) === normalizeMeaning(existing.meaning)
  if (candidate.language === 'english') {
    const candidateWord = normalizeEnglishVocabulary(candidate.word)
    const existingWord = normalizeEnglishVocabulary(existing.word)
    if (candidateWord === existingWord || normalizeEnglishNearKey(candidate.word) === normalizeEnglishNearKey(existing.word)) return 'NEAR'
    return 'OK'
  }

  const candidateWord = normalizeJapaneseVocabulary(candidate.word)
  const existingWord = normalizeJapaneseVocabulary(existing.word)
  const candidateReading = normalizeJapaneseVocabulary(candidate.reading ?? '')
  const existingReading = normalizeJapaneseVocabulary(existing.reading ?? '')
  const relatedReading =
    candidateReading === existingReading || stripJapaneseHonorific(candidateReading) === stripJapaneseHonorific(existingReading)
  const wordMatchesReading =
    stripJapaneseHonorific(candidateWord) === stripJapaneseHonorific(existingReading) ||
    stripJapaneseHonorific(existingWord) === stripJapaneseHonorific(candidateReading)

  if (candidateWord === existingWord) return 'NEAR'
  if (sameMeaning && (relatedReading || wordMatchesReading)) return 'NEAR'
  return 'OK'
}

export const reviewVocabularyImport = (
  registry: VocabularyContentRegistry,
  candidates: VocabularyImportCandidate[],
): VocabularyDuplicateReview => {
  const searchable = [...registry.entries]
  const items = candidates.map((candidate) => {
    const candidateEntry = candidateToEntry(candidate)
    const relationships = searchable
      .filter((entry) => entry.itemId !== candidate.itemId)
      .map((entry) => ({ entry, status: duplicateRelationship(candidateEntry, entry) }))
      .filter(({ status }) => status !== 'OK')
    const exactMatches = relationships.filter(({ status }) => status === 'EXACT').map(({ entry }) => entry)
    const nearMatches = relationships.filter(({ status }) => status === 'NEAR').map(({ entry }) => entry)
    const status: VocabularyDuplicateStatus = exactMatches.length > 0 ? 'EXACT' : nearMatches.length > 0 ? 'NEAR' : 'OK'
    searchable.push(candidateEntry)
    return { candidate, status, matches: status === 'EXACT' ? exactMatches : nearMatches }
  })
  return { items }
}

export const applyVocabularyDuplicateDecision = (review: VocabularyDuplicateReview, allowedNearIds = new Set<string>()) =>
  review.items
    .filter(({ candidate, status }) => status === 'OK' || (status === 'NEAR' && allowedNearIds.has(candidate.itemId)))
    .map(({ candidate }) => candidate)

const topicTokens = (topic: string) =>
  normalizeUnicode(topic)
    .toLocaleLowerCase()
    .split(/[\s｜|/、，,・]+/u)
    .filter((token) => token.length > 0)

export const buildVocabularyExclusionConstraint = (
  registry: VocabularyContentRegistry,
  options: {
    language: VocabularyRegistryLanguage
    level?: string
    topic?: string
    maxEntries?: number
    maxCharacters?: number
  },
) => {
  const maxEntries = Math.max(1, options.maxEntries ?? 120)
  const maxCharacters = Math.max(200, options.maxCharacters ?? 4_800)
  const tokens = topicTokens(options.topic ?? '')
  const ranked = registry.entries
    .filter(({ language }) => language === options.language)
    .map((entry) => {
      const searchableTitle = normalizeUnicode(entry.unitTitle).toLocaleLowerCase()
      const topicScore = tokens.reduce((score, token) => score + (searchableTitle.includes(token) ? 40 : 0), 0)
      return { entry, score: (entry.level === options.level ? 100 : 0) + topicScore }
    })
    .sort((left, right) => right.score - left.score || left.entry.normalizedKey.localeCompare(right.entry.normalizedKey))

  const header = 'Already used vocabulary:\nDo not reuse these lexical items or trivial variants.'
  const lines: string[] = []
  let length = header.length
  const seen = new Set<string>()
  for (const { entry } of ranked) {
    const display = entry.reading ? `${entry.word}（${entry.reading}）` : entry.word
    const key =
      options.language === 'english'
        ? normalizeEnglishNearKey(entry.word)
        : `${normalizeJapaneseVocabulary(entry.word)}\u0000${normalizeJapaneseVocabulary(entry.reading ?? '')}`
    if (seen.has(key)) continue
    const line = `- ${display}`
    if (lines.length >= maxEntries || length + line.length + 1 > maxCharacters) break
    seen.add(key)
    lines.push(line)
    length += line.length + 1
  }
  return `${header}${lines.length > 0 ? `\n${lines.join('\n')}` : ''}`
}
