import {
  importEnglishDialogueDocuments,
  importEnglishVocabularySets,
  createEnglishDialogueTypingSession,
} from '../../src/pages/English/utils/englishPractice'
import { getNotationInfo, stripNotation } from '../../src/pages/Typing/components/WordPanel/components/Word/Notation'
import { createArticleTypingSession, MAX_ARTICLE_TYPING_LENGTH } from '../../src/pages/Typing/utils/practiceArticle'
import { validateGeneratedPracticeDocument } from '../../src/pages/Typing/utils/practiceGeneration'
import { importChatGPTPracticeDocuments } from '../../src/pages/Typing/utils/practiceImport'
import { getJapaneseReadingTypingTarget, getPracticeTypingTarget } from '../../src/pages/Typing/utils/practiceTypingTarget'
import { importVocabularySets, getVocabularySpeechText } from '../../src/pages/Vocabulary/utils/vocabulary'
import { starterEnglishDialogues } from '../../src/resources/starter/englishDialogues'
import { starterEnglishVocabulary } from '../../src/resources/starter/englishVocabulary'
import { starterJapaneseArticles } from '../../src/resources/starter/japaneseArticles'
import { starterJapaneseVocabulary } from '../../src/resources/starter/japaneseVocabulary'
import { expect, test } from '@playwright/test'

const jlpt = ['N5', 'N4', 'N3', 'N2', 'N1'] as const
const cefr = ['A1', 'A2', 'B1', 'B2', 'C1'] as const
const empty = { version: 1 as const, sets: [], items: [] }
const categories = [starterJapaneseArticles, starterJapaneseVocabulary.sets, starterEnglishDialogues, starterEnglishVocabulary.sets]
const speakerLabel = /^(?:[A-ZＡ-Ｚ]|speaker\s*\d+|店員|客|先生|学生|話者\s*\d+)\s*[:：]/iu
const unique = (values: string[]) => expect(new Set(values).size).toBe(values.length)

test('300 單元及所有 item ID 全域唯一，標題與整份內容不重複', () => {
  const units = categories.flat()
  expect(units).toHaveLength(300)
  unique([...units, ...starterJapaneseVocabulary.items, ...starterEnglishVocabulary.items].map(({ id }) => id))
  for (const category of categories) {
    expect(category).toHaveLength(75)
    unique(category.map(({ title }) => title))
    for (const unit of category) {
      expect(unit.id).toMatch(/keylingua-starter-/)
      expect(unit.title.trim()).not.toBe('')
      expect(unit.title).not.toMatch(/(?:日常對話\s*\d+|Set\s+[A-Z]|Batch\s*\d+)/iu)
    }
  }
  unique(starterJapaneseArticles.map(({ sentences }) => JSON.stringify(sentences.map(({ name }) => name))))
  unique(starterEnglishDialogues.map(({ sentences }) => JSON.stringify(sentences.map(({ text }) => text))))
  for (const library of [starterJapaneseVocabulary, starterEnglishVocabulary]) {
    unique(
      library.sets.map(({ id }) =>
        JSON.stringify(
          library.items
            .filter(({ setId }) => setId === id)
            .map(({ word }) => word)
            .sort(),
        ),
      ),
    )
    expect(library.items).toHaveLength(750)
    expect(library.items.every(({ setId }) => library.sets.some(({ id }) => id === setId))).toBe(true)
  }
})

test('Starter 日文不把句尾終止標點納入 target，句中與英文標點仍保留', () => {
  const japaneseSentences = starterJapaneseArticles.flatMap(({ sentences }) => sentences)
  expect(japaneseSentences).toHaveLength(450)
  for (const sentence of japaneseSentences) {
    expect(sentence.name).not.toMatch(/[。？！]$/u)
    expect(sentence.notation).not.toMatch(/[。？！]$/u)
    expect(getPracticeTypingTarget(sentence)).not.toMatch(/[.?!]$/)
  }
  const japaneseSentenceWithComma = japaneseSentences.find(({ name }) => name.includes('、'))
  expect(japaneseSentenceWithComma).toBeDefined()
  expect(getPracticeTypingTarget(japaneseSentenceWithComma!)).toContain(',')

  const englishSentences = starterEnglishDialogues.flatMap(({ sentences }) => sentences)
  expect(englishSentences).toHaveLength(450)
  expect(englishSentences.every(({ text }) => /[.?!]$/.test(text))).toBe(true)
  expect(englishSentences.some(({ text }) => text.includes(','))).toBe(true)
  expect(englishSentences.some(({ text }) => text.includes("'"))).toBe(true)
  for (const document of starterEnglishDialogues) {
    expect(createEnglishDialogueTypingSession(document).typingItems.map(({ name }) => name)).toEqual(
      document.sentences.map(({ text }) => text),
    )
  }
})

for (const level of jlpt) {
  test(`${level} 正好 15 個日文單字題庫，各 10 詞，符合正式匯入與 reading invariant`, () => {
    const sets = starterJapaneseVocabulary.sets.filter(({ jlptLevel }) => jlptLevel === level)
    expect(sets).toHaveLength(15)
    for (const set of sets) {
      const items = starterJapaneseVocabulary.items.filter(({ setId }) => setId === set.id)
      expect(items, set.title).toHaveLength(10)
      unique(items.map(({ word, reading }) => `${word}|${reading}`))
      const result = importVocabularySets([{ text: JSON.stringify({ ...set, items }) }], empty)
      expect(result, set.title).not.toHaveProperty('error')
      for (const item of items) {
        expect(item.jlptLevel).toBe(level)
        expect(item.reading, item.word).toMatch(/^[\p{Script=Hiragana}\p{Script=Katakana}ー・\s]+$/u)
        expect(item.meaning.trim()).not.toBe('')
        expect(item.source).toBe('manual')
        expect(item.sourceTitle).toBe(set.title)
        expect(getVocabularySpeechText(item)).toBe(item.reading)
        expect(getJapaneseReadingTypingTarget(item.reading), item.word).toMatch(/^[\x20-\x7e]+$/)
      }
    }
  })
  test(`${level} 正好 15 篇日文情境，notation 與正式 typing target 全部有效`, () => {
    const documents = starterJapaneseArticles.filter(({ jlptLevel }) => jlptLevel === level)
    expect(documents).toHaveLength(15)
    expect(importChatGPTPracticeDocuments([JSON.stringify(documents)]).error).toBeUndefined()
    for (const document of documents) {
      expect(document.sentences, document.title).toHaveLength(6)
      expect(validateGeneratedPracticeDocument(document), document.title).toEqual({ valid: true, errors: [] })
      for (const sentence of document.sentences) {
        expect(sentence.name).not.toMatch(speakerLabel)
        expect(stripNotation(sentence.notation!)).toBe(sentence.name)
        for (const chunk of getNotationInfo(sentence.notation!)) {
          if (/\p{Script=Han}/u.test(chunk.word)) expect(chunk.phonetic, sentence.notation).toBeTruthy()
        }
        expect(getPracticeTypingTarget(sentence), sentence.notation).toMatch(/^[\x21-\x7e]+$/)
      }
      const session = createArticleTypingSession(document)
      expect(session.typingLength).toBeGreaterThan(0)
      expect(session.typingLength).toBeLessThanOrEqual(MAX_ARTICLE_TYPING_LENGTH)
      expect(session.sentencePresentations).toHaveLength(6)
    }
  })
}

for (const level of cefr) {
  test(`${level} 正好 15 個英文單字題庫，各 10 詞，符合正式匯入`, () => {
    const sets = starterEnglishVocabulary.sets.filter((set) => set.level === level)
    expect(sets).toHaveLength(15)
    for (const set of sets) {
      const items = starterEnglishVocabulary.items.filter(({ setId }) => setId === set.id)
      expect(items, set.title).toHaveLength(10)
      unique(items.map(({ word }) => word))
      expect(importEnglishVocabularySets([{ text: JSON.stringify({ ...set, items }) }], empty), set.title).not.toHaveProperty('error')
      for (const item of items) {
        expect(item).not.toHaveProperty('reading')
        expect(item).not.toHaveProperty('romaji')
        expect(item.word).toMatch(/^[\x20-\x7e]+$/)
        expect(item.meaning.trim()).not.toBe('')
        expect(item.sourceTitle).toBe(set.title)
      }
    }
  })
  test(`${level} 正好 15 篇英文對話，大小寫空白標點直接作為 target`, () => {
    const documents = starterEnglishDialogues.filter((document) => document.level === level)
    expect(documents).toHaveLength(15)
    expect(importEnglishDialogueDocuments([{ text: JSON.stringify(documents) }])).not.toHaveProperty('error')
    for (const document of documents) {
      expect(document.sentences, document.title).toHaveLength(6)
      const session = createEnglishDialogueTypingSession(document)
      expect(session.typingItems.map(({ name }) => name)).toEqual(document.sentences.map(({ text }) => text))
      for (const sentence of document.sentences) {
        expect(sentence).not.toHaveProperty('reading')
        expect(sentence).not.toHaveProperty('romaji')
        expect(sentence.text).toMatch(/^[\x20-\x7e]+$/)
        expect(sentence.text).not.toMatch(speakerLabel)
        expect(sentence.meaning.trim()).not.toBe('')
      }
    }
  })
}

// 分級以人工審稿為主；以下僅攔截明顯跨級與句長退化，並非官方認證或完整詞表。
// 參考：https://www.jlpt.jp/e/about/levelsummary.html
// 參考：https://www.coe.int/en/web/common-european-framework-reference-languages/table-%201-cefr-3.3-common-reference-levels-global-scale
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length

test('初階沒有明顯高階論述詞句，整體句長隨級別增加', () => {
  const beginnerJapanese = [
    ...starterJapaneseArticles.filter(({ jlptLevel }) => jlptLevel === 'N5').flatMap(({ sentences }) => sentences.map(({ name }) => name)),
    ...starterJapaneseVocabulary.items.filter(({ jlptLevel }) => jlptLevel === 'N5').map(({ word }) => word),
  ]
  expect(beginnerJapanese.join('\n')).not.toMatch(
    /余儀なく|に堪えない|を禁じ得ない|訴訟|恣意|形骸|金融政策|財政|資本主義|というものではない/,
  )
  const beginnerEnglish = [
    ...starterEnglishDialogues.filter(({ level }) => level === 'A1').flatMap(({ sentences }) => sentences.map(({ text }) => text)),
    ...starterEnglishVocabulary.sets
      .filter(({ level }) => level === 'A1')
      .flatMap((set) => starterEnglishVocabulary.items.filter(({ setId }) => setId === set.id).map(({ word }) => word)),
  ]
  expect(beginnerEnglish.join('\n')).not.toMatch(
    /\b(?:notwithstanding|epistemic|stakeholders?|ramifications?|paradigm|counterfactual|insofar|albeit|bureaucracy)\b/i,
  )
  const japaneseLengths = jlpt.map((level) =>
    average(
      starterJapaneseArticles
        .filter(({ jlptLevel }) => jlptLevel === level)
        .flatMap(({ sentences }) => sentences.map(({ name }) => name.length)),
    ),
  )
  const englishLengths = cefr.map((level) =>
    average(
      starterEnglishDialogues
        .filter((document) => document.level === level)
        .flatMap(({ sentences }) => sentences.map(({ text }) => text.split(/\s+/).length)),
    ),
  )
  for (const lengths of [japaneseLengths, englishLengths]) {
    for (let i = 1; i < lengths.length; i++) expect(lengths[i], JSON.stringify(lengths)).toBeGreaterThan(lengths[i - 1])
  }
  expect(japaneseLengths[0]).toBeLessThan(25)
  expect(englishLengths[0]).toBeLessThan(10)
  console.log('各級平均日文字數／英文字數', { jlpt: japaneseLengths, cefr: englishLengths })
})
