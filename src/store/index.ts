import atomForConfig from './atomForConfig'
import { reviewInfoAtom } from './reviewInfoAtom'
import { DISMISS_START_CARD_DATE_KEY, defaultFontSizeConfig } from '@/constants'
import { defaultLibraryImportRules, type LibraryImportRules } from '@/pages/LibraryImport/importPrompts'
import { migrateVocabularyLibrary } from '@/pages/Vocabulary/utils/vocabulary'
import { idDictionaryMap } from '@/resources/dictionary'
import { practiceDocumentMap } from '@/resources/practiceDocuments'
import { starterJapaneseArticles } from '@/resources/starter/japaneseArticles'
import { starterJapaneseVocabulary } from '@/resources/starter/japaneseVocabulary'
import { starterEnglishDialogues } from '@/resources/starter/englishDialogues'
import { starterEnglishVocabulary } from '@/resources/starter/englishVocabulary'
import { seedStarterDocuments, seedStarterVocabulary } from '@/resources/starter/seed'
import { correctSoundResources, keySoundResources, wrongSoundResources } from '@/resources/soundResource'
import type {
  Dictionary,
  EnglishPracticeDocument,
  EnglishVocabularyItem,
  EnglishVocabularyLibrary,
  EnglishVocabularySet,
  InfoPanelState,
  LoopWordTimesOption,
  PhoneticType,
  PracticeDocument,
  PronunciationType,
  WordDictationOpenBy,
  WordDictationType,
  VocabularyItem,
  VocabularyLibrary,
  VocabularySet,
} from '@/typings'
import type { ReviewRecord } from '@/utils/db/record'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const currentDictIdAtom = atomWithStorage('currentDict', 'cet4')
export const practiceDocumentIdAtom = atomWithStorage<string | null>('practiceDocumentId', null)
export const pastedPracticeDocumentsAtom = atomWithStorage<PracticeDocument[]>(
  'pastedPracticeDocuments',
  seedStarterDocuments(window.localStorage, 'pastedPracticeDocuments', starterJapaneseArticles) ?? [],
)
export const englishPracticeDocumentsAtom = atomWithStorage<EnglishPracticeDocument[]>(
  'englishPracticeDocuments',
  seedStarterDocuments(window.localStorage, 'englishPracticeDocuments', starterEnglishDialogues) ?? [],
)
export const englishPracticeDocumentIdAtom = atomWithStorage<string | null>('englishPracticeDocumentId', null)
export const englishVocabularySetIdAtom = atomWithStorage<string | null>('englishVocabularySetId', null)

const readStoredJSON = (key: string) => {
  try {
    const value = window.localStorage.getItem(key)
    return value === null ? undefined : JSON.parse(value)
  } catch {
    return undefined
  }
}

const initialVocabularyLibrary = migrateVocabularyLibrary(readStoredJSON('vocabularyLibrary'), readStoredJSON('vocabularyItems'))
const seededVocabularyLibrary =
  seedStarterVocabulary(window.localStorage, 'vocabularyLibrary', starterJapaneseVocabulary, initialVocabularyLibrary) ?? initialVocabularyLibrary

export const vocabularyLibraryAtom = atomWithStorage<VocabularyLibrary>('vocabularyLibrary', seededVocabularyLibrary)
export const vocabularySetsAtom = atom(
  (get) => get(vocabularyLibraryAtom).sets,
  (get, set, update: VocabularySet[] | ((sets: VocabularySet[]) => VocabularySet[])) => {
    const library = get(vocabularyLibraryAtom)
    const sets = typeof update === 'function' ? update(library.sets) : update
    set(vocabularyLibraryAtom, { ...library, sets })
  },
)
export const vocabularyItemsAtom = atom(
  (get) => get(vocabularyLibraryAtom).items,
  (get, set, update: VocabularyItem[] | ((items: VocabularyItem[]) => VocabularyItem[])) => {
    const library = get(vocabularyLibraryAtom)
    const items = typeof update === 'function' ? update(library.items) : update
    set(vocabularyLibraryAtom, { ...library, items })
  },
)
const emptyEnglishVocabularyLibrary: EnglishVocabularyLibrary = { version: 1, sets: [], items: [] }
export const englishVocabularyLibraryAtom = atomWithStorage<EnglishVocabularyLibrary>(
  'englishVocabularyLibrary',
  seedStarterVocabulary(window.localStorage, 'englishVocabularyLibrary', starterEnglishVocabulary) ?? emptyEnglishVocabularyLibrary,
)
export const englishVocabularySetsAtom = atom(
  (get) => get(englishVocabularyLibraryAtom).sets,
  (get, set, update: EnglishVocabularySet[] | ((sets: EnglishVocabularySet[]) => EnglishVocabularySet[])) => {
    const library = get(englishVocabularyLibraryAtom)
    const sets = typeof update === 'function' ? update(library.sets) : update
    set(englishVocabularyLibraryAtom, { ...library, sets })
  },
)
export const englishVocabularyItemsAtom = atom(
  (get) => get(englishVocabularyLibraryAtom).items,
  (get, set, update: EnglishVocabularyItem[] | ((items: EnglishVocabularyItem[]) => EnglishVocabularyItem[])) => {
    const library = get(englishVocabularyLibraryAtom)
    const items = typeof update === 'function' ? update(library.items) : update
    set(englishVocabularyLibraryAtom, { ...library, items })
  },
)

export type PracticeSource =
  | { language: 'japanese'; practiceType: 'article'; id: string }
  | { language: 'japanese'; practiceType: 'vocabulary'; id: string }
  | { language: 'english'; practiceType: 'dialogue'; id: string }
  | { language: 'english'; practiceType: 'vocabulary'; id: string }

export type LibraryCompletion = Record<string, true>

export const getLibraryCompletionKey = ({ language, practiceType, id }: PracticeSource) => `${language}:${practiceType}:${id}`
export const libraryCompletionAtom = atomWithStorage<LibraryCompletion>('libraryCompletion', {})

type LegacyPracticeSource = { kind: 'article' | 'vocabulary'; id: string }
export const practiceSourceAtom = atomWithStorage<PracticeSource | LegacyPracticeSource | null>('practiceSource', null)
export const currentVocabularySetIdAtom = atomWithStorage<string | null>('currentVocabularySetId', null)
export const chatGPTPracticeDocumentIdsAtom = atomWithStorage<string[]>('chatGPTPracticeDocumentIds', [])
export const libraryImportRulesAtom = atomWithStorage<LibraryImportRules>('libraryImportRules', { ...defaultLibraryImportRules })
export const currentPracticeDocumentAtom = atom((get) => {
  const documentId = get(practiceDocumentIdAtom)
  if (!documentId) return undefined
  return practiceDocumentMap[documentId] ?? get(pastedPracticeDocumentsAtom).find((document) => document.id === documentId)
})
export const currentVocabularySetAtom = atom((get) => {
  const setId = get(currentVocabularySetIdAtom)
  return setId ? get(vocabularyLibraryAtom).sets.find((set) => set.id === setId) : undefined
})
export const currentVocabularyPracticeAtom = atom((get) => {
  const set = get(currentVocabularySetAtom)
  if (!set) return undefined
  return { set, items: get(vocabularyLibraryAtom).items.filter((item) => item.setId === set.id) }
})
export const currentEnglishPracticeDocumentAtom = atom((get) => {
  const documentId = get(englishPracticeDocumentIdAtom)
  return documentId ? get(englishPracticeDocumentsAtom).find((document) => document.id === documentId) : undefined
})
export const currentEnglishVocabularySetAtom = atom((get) => {
  const setId = get(englishVocabularySetIdAtom)
  return setId ? get(englishVocabularyLibraryAtom).sets.find((set) => set.id === setId) : undefined
})
export const currentEnglishVocabularyPracticeAtom = atom((get) => {
  const set = get(currentEnglishVocabularySetAtom)
  if (!set) return undefined
  return { set, items: get(englishVocabularyLibraryAtom).items.filter((item) => item.setId === set.id) }
})
export const currentTypingPracticeAtom = atom((get) => {
  const source = get(practiceSourceAtom)
  const article = get(currentPracticeDocumentAtom)
  const vocabulary = get(currentVocabularyPracticeAtom)
  const englishDialogue = get(currentEnglishPracticeDocumentAtom)
  const englishVocabulary = get(currentEnglishVocabularyPracticeAtom)

  if (source && 'language' in source) {
    if (source.language === 'japanese' && source.practiceType === 'article' && article) {
      return { language: 'japanese' as const, kind: 'article' as const, document: article }
    }
    if (source.language === 'japanese' && source.practiceType === 'vocabulary' && vocabulary) {
      return { language: 'japanese' as const, kind: 'vocabulary' as const, ...vocabulary }
    }
    if (source.language === 'english' && source.practiceType === 'dialogue' && englishDialogue) {
      return { language: 'english' as const, kind: 'dialogue' as const, document: englishDialogue }
    }
    if (source.language === 'english' && source.practiceType === 'vocabulary' && englishVocabulary) {
      return { language: 'english' as const, kind: 'vocabulary' as const, ...englishVocabulary }
    }
    return undefined
  }

  if (source?.kind === 'vocabulary' && vocabulary) return { language: 'japanese' as const, kind: 'vocabulary' as const, ...vocabulary }
  if (source?.kind === 'article' && article) return { language: 'japanese' as const, kind: 'article' as const, document: article }
  if (article) return { language: 'japanese' as const, kind: 'article' as const, document: article }
  if (vocabulary) return { language: 'japanese' as const, kind: 'vocabulary' as const, ...vocabulary }
  return undefined
})
export const isPracticeModeAtom = atom((get) => get(currentTypingPracticeAtom) !== undefined)
export const practiceRecordDictIdAtom = atom((get) => {
  const practice = get(currentTypingPracticeAtom)
  if (practice?.kind === 'article') return `practice:${practice.document.id}`
  if (practice?.kind === 'dialogue') return `english-dialogue:${practice.document.id}`
  if (practice?.kind === 'vocabulary') {
    return practice.language === 'english' ? `english-vocabulary:${practice.set.id}` : `vocabulary:${practice.set.id}`
  }
  return get(currentDictIdAtom)
})
export const currentDictInfoAtom = atom<Dictionary>((get) => {
  const id = get(currentDictIdAtom)
  let dict = idDictionaryMap[id]
  // 如果 dict 不存在，则返回 cet4. Typing 中会检查 DictId 是否存在，如果不存在则会重置为 cet4
  if (!dict) {
    dict = idDictionaryMap.cet4
  }
  return dict
})

export const currentChapterAtom = atomWithStorage('currentChapter', 0)

export const loopWordConfigAtom = atomForConfig<{ times: LoopWordTimesOption }>('loopWordConfig', {
  times: 1,
})

export const keySoundsConfigAtom = atomForConfig('keySoundsConfig', {
  isOpen: true,
  isOpenClickSound: true,
  volume: 1,
  resource: keySoundResources[0],
})

export const hintSoundsConfigAtom = atomForConfig('hintSoundsConfig', {
  isOpen: true,
  volume: 1,
  isOpenWrongSound: true,
  isOpenCorrectSound: true,
  wrongResource: wrongSoundResources[0],
  correctResource: correctSoundResources[0],
})

export const pronunciationConfigAtom = atomForConfig('pronunciation', {
  isOpen: true,
  volume: 1,
  type: 'us' as PronunciationType,
  name: '美音',
  isLoop: false,
  isTransRead: false,
  transVolume: 1,
  rate: 1,
})

export const articleSpeechConfigAtom = atomForConfig('articleSpeechConfig', {
  autoReadSentence: true,
  voiceURI: '',
  rate: 1,
})

export const englishSpeechConfigAtom = atomForConfig('englishSpeechConfig', {
  autoReadSentence: true,
  voiceURI: '',
  rate: 1,
})

export const fontSizeConfigAtom = atomForConfig('fontsize', defaultFontSizeConfig)

export const pronunciationIsOpenAtom = atom((get) => get(pronunciationConfigAtom).isOpen)

export const pronunciationIsTransReadAtom = atom((get) => get(pronunciationConfigAtom).isTransRead)

export const randomConfigAtom = atomForConfig('randomConfig', {
  isOpen: false,
})

export const isShowPrevAndNextWordAtom = atomWithStorage('isShowPrevAndNextWord', true)

export const isIgnoreCaseAtom = atomWithStorage('isIgnoreCase', true)

export const isShowAnswerOnHoverAtom = atomWithStorage('isShowAnswerOnHover', true)

export const isTextSelectableAtom = atomWithStorage('isTextSelectable', false)

export const reviewModeInfoAtom = reviewInfoAtom({
  isReviewMode: false,
  reviewRecord: undefined as ReviewRecord | undefined,
})
export const isReviewModeAtom = atom((get) => get(reviewModeInfoAtom).isReviewMode)

export const phoneticConfigAtom = atomForConfig('phoneticConfig', {
  isOpen: true,
  type: 'us' as PhoneticType,
})

export const isOpenDarkModeAtom = atomWithStorage('isOpenDarkModeAtom', window.matchMedia('(prefers-color-scheme: dark)').matches)

export const isShowSkipAtom = atom(false)

export const isInDevModeAtom = atom(false)

export const infoPanelStateAtom = atom<InfoPanelState>({
  donate: false,
  vsc: false,
  community: false,
  redBook: false,
})

export const wordDictationConfigAtom = atomForConfig('wordDictationConfig', {
  isOpen: false,
  type: 'hideAll' as WordDictationType,
  openBy: 'auto' as WordDictationOpenBy,
})

export const dismissStartCardDateAtom = atomWithStorage<Date | null>(DISMISS_START_CARD_DATE_KEY, null)

// Enhanced version promotion popup state
export const hasSeenEnhancedPromotionAtom = atomWithStorage('hasSeenEnhancedPromotion', false)

// for dev test
//   dismissStartCardDateAtom = atom<Date | null>(new Date())
