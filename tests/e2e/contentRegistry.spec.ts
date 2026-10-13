import {
  applyVocabularyDuplicateDecision,
  buildVocabularyExclusionConstraint,
  createVocabularyContentRegistry,
  reviewVocabularyImport,
} from '../../src/contentRegistry/vocabularyRegistry'
import { buildLibraryImportPrompt } from '../../src/pages/LibraryImport/importPrompts'
import { starterEnglishVocabulary } from '../../src/resources/starter/englishVocabulary'
import { starterJapaneseVocabulary } from '../../src/resources/starter/japaneseVocabulary'
import { expect, test } from '@playwright/test'

const japaneseLibrary = {
  version: 1 as const,
  sets: [{ id: 'ja-existing', title: 'N3｜居酒屋單字', jlptLevel: 'N3' as const, createdAt: '2026-01-01' }],
  items: [
    {
      id: 'ja-souvenir',
      setId: 'ja-existing',
      jlptLevel: 'N3' as const,
      word: 'お土産',
      reading: 'おみやげ',
      meaning: '伴手禮',
      source: 'manual' as const,
    },
  ],
}

const englishLibrary = {
  version: 1 as const,
  sets: [{ id: 'en-existing', title: 'A2｜Travel', level: 'A2' as const, createdAt: '2026-01-01' }],
  items: [
    {
      id: 'en-check-in',
      setId: 'en-existing',
      word: 'Check-in',
      meaning: '報到',
      source: 'manual' as const,
    },
  ],
}

test.describe('Vocabulary Content Registry', () => {
  test('可直接從兩套 Starter Library 建立 7,500 筆 derived index', () => {
    const registry = createVocabularyContentRegistry(starterJapaneseVocabulary, starterEnglishVocabulary)

    expect(registry.entries).toHaveLength(7_500)
    expect(registry.entries.filter(({ language }) => language === 'japanese')).toHaveLength(3_750)
    expect(registry.entries.filter(({ language }) => language === 'english')).toHaveLength(3_750)
  })

  test('English Unicode、大小寫與 apostrophe typography 相同時判定 EXACT', () => {
    const registry = createVocabularyContentRegistry(japaneseLibrary, {
      ...englishLibrary,
      items: [{ ...englishLibrary.items[0], word: 'Traveler’s Check', meaning: '旅行支票' }],
    })

    const review = reviewVocabularyImport(registry, [
      {
        language: 'english',
        itemId: 'candidate',
        unitId: 'new-unit',
        unitTitle: 'A2｜Travel Money',
        level: 'A2',
        word: "traveler's   check",
        meaning: '旅行支票',
      },
    ])

    expect(review.items[0].status).toBe('EXACT')
    expect(review.items[0].matches[0]).toMatchObject({ unitId: 'en-existing', level: 'A2' })
  })

  test('English hyphen 與 spacing 變體只判定 NEAR', () => {
    const registry = createVocabularyContentRegistry(japaneseLibrary, englishLibrary)
    const review = reviewVocabularyImport(registry, [
      {
        language: 'english',
        itemId: 'candidate',
        unitId: 'new-unit',
        unitTitle: 'A2｜Airport',
        level: 'A2',
        word: 'check in',
        meaning: '報到',
      },
    ])

    expect(review.items[0].status).toBe('NEAR')
  })

  test('Japanese 相同 word、reading、meaning 判定 EXACT', () => {
    const registry = createVocabularyContentRegistry(japaneseLibrary, englishLibrary)
    const review = reviewVocabularyImport(registry, [
      {
        language: 'japanese',
        itemId: 'candidate',
        unitId: 'new-unit',
        unitTitle: 'N3｜旅遊',
        level: 'N3',
        word: 'お土産',
        reading: 'おみやげ',
        meaning: '伴手禮',
      },
    ])

    expect(review.items[0].status).toBe('EXACT')
  })

  test('Japanese 平片假名與合理漢字／假名 variant 判定 NEAR', () => {
    const registry = createVocabularyContentRegistry(japaneseLibrary, englishLibrary)
    const review = reviewVocabularyImport(registry, [
      {
        language: 'japanese',
        itemId: 'candidate-kana',
        unitId: 'new-unit',
        unitTitle: 'N3｜旅遊',
        level: 'N3',
        word: 'ミヤゲ',
        reading: 'みやげ',
        meaning: '伴手禮',
      },
      {
        language: 'japanese',
        itemId: 'candidate-kanji',
        unitId: 'new-unit',
        unitTitle: 'N3｜旅遊',
        level: 'N3',
        word: '土産',
        reading: 'みやげ',
        meaning: '伴手禮',
      },
    ])

    expect(review.items.map(({ status }) => status)).toEqual(['NEAR', 'NEAR'])
  })

  test('跨題庫與 user-created vocabulary 也會被索引並回報所在題庫', () => {
    const registry = createVocabularyContentRegistry(japaneseLibrary, englishLibrary)
    const review = reviewVocabularyImport(registry, [
      {
        language: 'english',
        itemId: 'candidate',
        unitId: 'another-unit',
        unitTitle: 'A2｜Hotel',
        level: 'A2',
        word: 'check-in',
        meaning: '報到',
      },
    ])

    expect(review.items[0].status).toBe('EXACT')
    expect(review.items[0].matches[0].unitTitle).toBe('A2｜Travel')
  })

  test('Library 刪除內容後 rebuild 不再攔截該詞', () => {
    const before = createVocabularyContentRegistry(japaneseLibrary, englishLibrary)
    const after = createVocabularyContentRegistry(japaneseLibrary, { ...englishLibrary, sets: [], items: [] })
    const candidate = {
      language: 'english' as const,
      itemId: 'candidate',
      unitId: 'new-unit',
      unitTitle: 'A2｜Airport',
      level: 'A2',
      word: 'check-in',
      meaning: '報到',
    }

    expect(reviewVocabularyImport(before, [candidate]).items[0].status).toBe('EXACT')
    expect(reviewVocabularyImport(after, [candidate]).items[0].status).toBe('OK')
  })

  test('Import EXACT 預設阻止，NEAR 只有明確允許後才加入', () => {
    const registry = createVocabularyContentRegistry(japaneseLibrary, englishLibrary)
    const candidates = [
      {
        language: 'english' as const,
        itemId: 'exact',
        unitId: 'new-unit',
        unitTitle: 'A2｜Airport',
        level: 'A2',
        word: 'CHECK-IN',
        meaning: '報到',
      },
      {
        language: 'english' as const,
        itemId: 'near',
        unitId: 'new-unit',
        unitTitle: 'A2｜Airport',
        level: 'A2',
        word: 'check in',
        meaning: '報到',
      },
      {
        language: 'english' as const,
        itemId: 'ok',
        unitId: 'new-unit',
        unitTitle: 'A2｜Airport',
        level: 'A2',
        word: 'boarding pass',
        meaning: '登機證',
      },
    ]
    const review = reviewVocabularyImport(registry, candidates)

    expect(applyVocabularyDuplicateDecision(review).map(({ itemId }) => itemId)).toEqual(['ok'])
    expect(applyVocabularyDuplicateDecision(review, new Set(['near'])).map(({ itemId }) => itemId)).toEqual(['near', 'ok'])
  })

  test('Prompt exclusion 依語言、level 與 topic 排序且受固定 budget 限制', () => {
    const registry = createVocabularyContentRegistry(starterJapaneseVocabulary, starterEnglishVocabulary)
    const constraint = buildVocabularyExclusionConstraint(registry, {
      language: 'japanese',
      level: 'N3',
      topic: '居酒屋',
      maxEntries: 80,
      maxCharacters: 2_400,
    })

    expect(constraint).toContain('Already used vocabulary')
    expect(constraint.length).toBeLessThanOrEqual(2_400)
    expect(constraint.split('\n').length).toBeLessThan(7_500)
    const prompt = buildLibraryImportPrompt('japanese-vocabulary', 'mobile', undefined, {
      level: 'N3',
      topic: '居酒屋',
      count: 50,
      duplicateConstraint: constraint,
    })
    expect(prompt).toContain('程度：N3')
    expect(prompt).toContain('主題：居酒屋')
    expect(prompt).toContain('單字數：50')
    expect(prompt).toContain(constraint)
  })
})
