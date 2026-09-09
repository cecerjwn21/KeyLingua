import type { ArticleSentencePresentation, Word } from '.'

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export type CEFRLevel = (typeof CEFR_LEVELS)[number]
export type EnglishContentSource = 'manual' | 'imported'

export type EnglishPracticeSentence = {
  text: string
  meaning: string
  speaker?: string
}

export type EnglishPracticeDocument = {
  id: string
  title: string
  level: CEFRLevel
  source: EnglishContentSource
  createdAt: string
  sentences: EnglishPracticeSentence[]
}

export type EnglishVocabularySet = {
  id: string
  title: string
  level: CEFRLevel
  createdAt: string
}

export type EnglishVocabularyItem = {
  id: string
  setId: string
  word: string
  meaning: string
  source?: EnglishContentSource
  sourceTitle?: string
}

export type EnglishVocabularyLibrary = {
  version: 1
  sets: EnglishVocabularySet[]
  items: EnglishVocabularyItem[]
}

export type EnglishDialogueTypingSession = {
  typingItems: Word[]
  sentencePresentations: ArticleSentencePresentation[]
}
