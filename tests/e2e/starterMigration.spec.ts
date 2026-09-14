import { starterEnglishDialogues } from '../../src/resources/starter/englishDialogues'
import { starterEnglishVocabulary } from '../../src/resources/starter/englishVocabulary'
import { starterJapaneseArticles } from '../../src/resources/starter/japaneseArticles'
import { starterJapaneseVocabulary } from '../../src/resources/starter/japaneseVocabulary'
import released from '../../src/resources/starter/legacyStarterContent.json'
import { seedStarterDocuments, seedStarterVocabulary, starterLedgerKey } from '../../src/resources/starter/seed'
import legacy from './fixtures/starter-v1.json'
import { expect, test } from '@playwright/test'

const memoryStorage = (values: Record<string, unknown>) => {
  const data = new Map(Object.entries(values).map(([key, value]) => [key, JSON.stringify(value)]))
  const writes: string[] = []
  return {
    data,
    writes,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      writes.push(key)
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
  }
}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const settings = {
  libraryCompletion: { 'japanese:article:official': true },
  customProgress: { sentence: 4 },
  articleSpeechConfig: { voiceURI: 'Nanami', rate: 0.8 },
  libraryImportRules: { custom: '保留' },
}
const versionKey = (key: string) => `keylinguaStarterContentVersion:${key}`

for (const key of ['pastedPracticeDocuments', 'englishPracticeDocuments'] as const) {
  const old = legacy[key] as Array<any>
  const next = old.map((doc) => ({ ...clone(doc), title: doc.title + '新版', sentences: [...doc.sentences, ...doc.sentences] }))
  test(`${key} 官方舊文章升級，改過與刪除單元及其他儲存值保留`, () => {
    const edited = { ...clone(old[1]), title: '使用者改名' }
    const custom = { ...clone(old[2]), id: 'user-document' }
    const current = [clone(old[0]), edited, custom, ...clone(old.slice(3))]
    const storage = memoryStorage({ [key]: current, [starterLedgerKey(key)]: old.map(({ id }) => id), ...settings })
    const result = seedStarterDocuments(storage, key, next)
    expect(result?.[0]).toEqual(next[0])
    expect(result?.[1]).toEqual(edited)
    expect(result?.[2]).toEqual(custom)
    expect(result?.some(({ id }) => id === old[2].id)).toBe(false)
    for (const [name, value] of Object.entries(settings)) expect(storage.getItem(name)).toBe(JSON.stringify(value))
    expect(storage.getItem(versionKey(key))).toBe('3')
    storage.writes.length = 0
    expect(seedStarterDocuments(storage, key, next)).toEqual(result)
    expect(storage.writes).toEqual([])
  })
  test(`${key} 沒有官方領取紀錄的同 ID 自訂文章不覆寫`, () => {
    const storage = memoryStorage({ [key]: [old[0]] })
    expect(seedStarterDocuments(storage, key, next)?.[0]).toEqual(old[0])
    expect(seedStarterDocuments(storage, key, next)?.[0]).toEqual(old[0])
  })
  test(`${key} 新版本標記寫入失敗會完整回復，重試可升級`, () => {
    const storage = memoryStorage({ [key]: old, [starterLedgerKey(key)]: old.map(({ id }) => id) })
    const before = new Map(storage.data)
    const failing = {
      ...storage,
      setItem: (name: string, value: string) => {
        if (name === versionKey(key)) throw new Error('QuotaExceededError')
        storage.setItem(name, value)
      },
    }
    expect(seedStarterDocuments(failing, key, next)).toBeUndefined()
    expect(storage.data).toEqual(before)
    expect(seedStarterDocuments(storage, key, next)).toEqual(next)
  })
  test(`${key} 損壞或未來版本的版本標記不更動任何資料`, () => {
    for (const raw of ['{broken', 'null', '"3"', '4']) {
      const storage = memoryStorage({ [key]: old, [starterLedgerKey(key)]: old.map(({ id }) => id) })
      storage.data.set(versionKey(key), raw)
      expect(seedStarterDocuments(storage, key, next)).toBeUndefined()
      expect(storage.writes).toEqual([])
    }
  })
}

for (const key of ['vocabularyLibrary', 'englishVocabularyLibrary'] as const) {
  const old = legacy[key] as any
  const next = {
    ...clone(old),
    sets: old.sets.map((set: any) => ({ ...set, title: set.title + '新版' })),
    items: [
      ...clone(old.items),
      ...old.sets.map((set: any) => ({ ...old.items.find((item: any) => item.setId === set.id), id: set.id + '-11' })),
    ],
  }
  test(`${key} 只更新完整官方詞庫，保留編輯與刪除、孤立項目及 metadata`, () => {
    const current = clone(old)
    current.sets = current.sets.filter((set: any) => set.id !== old.sets[2].id)
    current.items = current.items.filter((item: any) => item.setId !== old.sets[2].id && item.id !== old.items[10].id)
    current.sets[3].title = '我的修改'
    current.extra = '原封保留'
    const custom = { ...clone(old.items[0]), id: 'user-item', setId: 'user-set', meaning: '我的詞義' }
    current.sets.push({ ...clone(old.sets[0]), id: 'user-set' })
    current.items.push(custom)
    const storage = memoryStorage({ [key]: current, [starterLedgerKey(key)]: old.sets.map(({ id }: any) => id), ...settings })
    const result = seedStarterVocabulary(storage, key, next) as any
    expect(result.sets[0]).toEqual(next.sets[0])
    expect(result.items.filter((item: any) => item.setId === old.sets[0].id)).toHaveLength(11)
    expect(result.sets[1]).toEqual(current.sets[1])
    expect(result.items.some((item: any) => item.id === old.items[10].id)).toBe(false)
    expect(result.sets.some((set: any) => set.id === old.sets[2].id)).toBe(false)
    expect(result.sets[3]).toEqual(current.sets[3])
    expect(result.items.find((item: any) => item.id === 'user-item')).toEqual(custom)
    expect(result.extra).toBe('原封保留')
    for (const [name, value] of Object.entries(settings)) expect(storage.getItem(name)).toBe(JSON.stringify(value))
    storage.writes.length = 0
    expect(seedStarterVocabulary(storage, key, next)).toEqual(result)
    expect(storage.writes).toEqual([])
  })
  test(`${key} 升級新增 item ID 碰撞使用者項目時整組保留`, () => {
    const current = clone(old)
    current.items.push({ ...old.items[0], id: old.sets[0].id + '-11', setId: 'custom' })
    const storage = memoryStorage({ [key]: current, [starterLedgerKey(key)]: old.sets.map(({ id }: any) => id) })
    const result = seedStarterVocabulary(storage, key, next) as any
    expect(result.sets[0]).toEqual(current.sets[0])
    expect(result.items.filter((item: any) => item.setId === old.sets[0].id)).toEqual(old.items.slice(0, 10))
    expect(new Set(result.items.map((item: any) => item.id)).size).toBe(result.items.length)
  })
  test(`${key} 版本標記失敗回復原始資料與領取紀錄`, () => {
    const storage = memoryStorage({ [key]: old, [starterLedgerKey(key)]: old.sets.map(({ id }: any) => id) })
    const before = new Map(storage.data)
    const failing = {
      ...storage,
      setItem: (name: string, value: string) => {
        if (name === versionKey(key)) throw new Error('QuotaExceededError')
        storage.setItem(name, value)
      },
    }
    expect(seedStarterVocabulary(failing, key, next)).toBeUndefined()
    expect(storage.data).toEqual(before)
    expect(seedStarterVocabulary(storage, key, next)?.sets).toEqual(next.sets)
  })
}

test('四類全部 300 個 Starter stable ID 與原始發行完全一致', () => {
  expect(starterJapaneseArticles.map(({ id }) => id)).toEqual(legacy.pastedPracticeDocuments.map(({ id }) => id))
  expect(starterEnglishDialogues.map(({ id }) => id)).toEqual(legacy.englishPracticeDocuments.map(({ id }) => id))
  expect(starterJapaneseVocabulary.sets.map(({ id }) => id)).toEqual(legacy.vocabularyLibrary.sets.map(({ id }) => id))
  expect(starterEnglishVocabulary.sets.map(({ id }) => id)).toEqual(legacy.englishVocabularyLibrary.sets.map(({ id }) => id))
})

// 使用真實本機頁面驗證 atom 初始化會讀到升級結果，而非僅測純函式回傳值。
test('舊使用者啟動本機頁面後四類官方內容更新，完成紀錄與已刪除單元保留', async ({ page }) => {
  const initial: Record<string, unknown> = {}
  for (const [key, original] of Object.entries(legacy)) {
    const value = clone(original) as any
    const units = Array.isArray(value) ? value : value.sets
    initial[starterLedgerKey(key)] = units.map(({ id }: any) => id)
    const removed = units[1].id
    if (Array.isArray(value)) value.splice(1, 1)
    else {
      value.sets.splice(1, 1)
      value.items = value.items.filter(({ setId }: any) => setId !== removed)
    }
    initial[key] = value
  }
  const completion = { ['japanese:article:' + legacy.pastedPracticeDocuments[0].id]: true }
  initial.libraryCompletion = completion
  initial.customProgress = { documentId: legacy.pastedPracticeDocuments[0].id, sentence: 3 }
  initial.articleSpeechConfig = { enabled: false, voiceURI: 'Nanami-custom', rate: 0.8 }
  initial.practiceDocumentId = legacy.pastedPracticeDocuments[0].id
  initial.practiceSource = { language: 'japanese', practiceType: 'article', id: legacy.pastedPracticeDocuments[0].id }
  initial.currentChapter = 2
  initial.isIgnoreCase = false
  await page.addInitScript((values) => {
    if (localStorage.getItem('starter-migration-fixture')) return
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, JSON.stringify(value))
    localStorage.setItem('starter-migration-fixture', '1')
  }, initial)
  await page.goto('/ja/articles')
  const read = () =>
    page.evaluate((keys) => Object.fromEntries(keys.map((key) => [key, JSON.parse(localStorage.getItem(key)!)])), Object.keys(initial))
  const result = await read()
  for (const [key, official] of Object.entries({
    pastedPracticeDocuments: starterJapaneseArticles,
    englishPracticeDocuments: starterEnglishDialogues,
    vocabularyLibrary: starterJapaneseVocabulary,
    englishVocabularyLibrary: starterEnglishVocabulary,
  })) {
    const updated = result[key] as any
    if (Array.isArray(official)) {
      expect(updated).toEqual(official.filter((_, index) => index !== 1))
    } else {
      expect(updated.sets).toEqual(official.sets.filter((_, index) => index !== 1))
      const removed = official.sets[1].id
      expect(updated.items.slice().sort((a: any, b: any) => a.id.localeCompare(b.id))).toEqual(
        official.items
          .filter(({ setId }) => setId !== removed)
          .slice()
          .sort((a, b) => a.id.localeCompare(b.id)),
      )
    }
  }
  for (const key of [
    'libraryCompletion',
    'customProgress',
    'articleSpeechConfig',
    'practiceDocumentId',
    'practiceSource',
    'currentChapter',
    'isIgnoreCase',
  ])
    expect(result[key]).toEqual(initial[key])
  await page.reload()
  expect(await read()).toEqual(result)
  await page.getByRole('button', { name: /^N5/ }).click()
  await expect(
    page.getByTestId(`article-card-${legacy.pastedPracticeDocuments[0].id}`).getByTestId('library-completion-status'),
  ).toContainText('已完成')
})

test('初次發行與標點校訂版文章都可升級；版本完成後不再覆寫還原成舊內容的使用者編輯', () => {
  for (const key of ['pastedPracticeDocuments', 'englishPracticeDocuments'] as const) {
    const previous = legacy[key] as any[]
    const official = previous.map((doc) => ({ ...clone(doc), title: doc.title + '更新' }))
    const variants = released[key] as Record<string, string[]>
    const oldest = previous.map(({ id }) => JSON.parse(variants[id][variants[id].length - 1]))
    const storage = memoryStorage({ [key]: oldest, [starterLedgerKey(key)]: oldest.map(({ id }) => id) })
    expect(seedStarterDocuments(storage, key, official)).toEqual(official)
    storage.setItem(key, JSON.stringify(oldest))
    storage.writes.length = 0
    expect(seedStarterDocuments(storage, key, official)).toEqual(oldest)
    expect(storage.writes).toEqual([])
  }
})

test('舊資料有未知欄位或重複官方 ID 時保守保留，不以更新移除使用者資料', () => {
  const key = 'pastedPracticeDocuments'
  const old = clone(legacy[key])
  const next = old.map((doc) => ({ ...doc, title: doc.title + '更新' }))
  const duplicate = [old[0], old[0], ...old.slice(1)]
  const storage = memoryStorage({ [key]: duplicate, [starterLedgerKey(key)]: old.map(({ id }) => id) })
  expect(seedStarterDocuments(storage, key, next)?.slice(0, 2)).toEqual([old[0], old[0]])
  const extended = { ...old[0], customNote: '我的補充' }
  const other = memoryStorage({ [key]: [extended], [starterLedgerKey(key)]: old.map(({ id }) => id) })
  expect(seedStarterDocuments(other, key, next)).toEqual([extended])
})

test('已有版本且內容不變時保留原始 JSON 空白，完全零寫入', () => {
  const key = 'pastedPracticeDocuments'
  const old = legacy[key]
  const storage = memoryStorage({ [key]: old, [starterLedgerKey(key)]: old.map(({ id }) => id), [versionKey(key)]: 3 })
  const raw = JSON.stringify(old, null, 2)
  storage.data.set(key, raw)
  expect(seedStarterDocuments(storage, key, old)).toEqual(old)
  expect(storage.writes).toEqual([])
  expect(storage.getItem(key)).toBe(raw)
})

test('領取紀錄含重複 ID 時仍記錄新領取單元，刪除後不復活', () => {
  const key = 'pastedPracticeDocuments'
  const [first, second] = legacy[key]
  const storage = memoryStorage({ [key]: [first], [starterLedgerKey(key)]: [first.id, first.id] })
  expect(seedStarterDocuments(storage, key, [first, second])).toEqual([first, second])
  storage.setItem(key, JSON.stringify([first]))
  expect(seedStarterDocuments(storage, key, [first, second])).toEqual([first])
})
