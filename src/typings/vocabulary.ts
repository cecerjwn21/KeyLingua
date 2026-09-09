import type { JLPTLevel } from './practiceGeneration'

export type VocabularySource = 'manual' | 'article'

export type VocabularySet = {
  id: string
  title: string
  jlptLevel: JLPTLevel
  source?: VocabularySource
  createdAt: string
}

export type VocabularyItem = {
  id: string
  setId: string
  jlptLevel: JLPTLevel
  word: string
  reading: string
  meaning: string
  source?: VocabularySource
  sourceTitle?: string
}

export type VocabularyLibrary = {
  version: 1
  sets: VocabularySet[]
  items: VocabularyItem[]
}
