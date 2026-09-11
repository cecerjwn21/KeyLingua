import { seedStarterDocuments, seedStarterVocabulary } from '../../src/resources/starter/seed'
import { expect, test } from '@playwright/test'

const starter = [
  { id: 'starter-one', title: '原始內容' },
  { id: 'starter-two', title: '另一單元' },
]
const vocabulary = { version: 1 as const, sets: starter, items: starter.map(({ id }) => ({ id: `${id}-word`, setId: id, word: id })) }
const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial))
  const writes: string[] = []
  return {
    data,
    writes,
    removeItem: (key: string) => {
      data.delete(key)
    },
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      writes.push(key)
      data.set(key, value)
    },
  }
}

test('只附加缺少的文章，保留使用者內容及其他儲存值，重開零寫入', () => {
  const existing = [
    { id: 'user-one', title: '我的文章', extra: '保留' },
    { ...starter[0], title: '我的修改' },
  ]
  const storage = memoryStorage({ documents: JSON.stringify(existing), settings: '不可更動', libraryCompletion: '{"done":true}' })
  const result = seedStarterDocuments(storage, 'documents', starter)
  expect(result).toEqual([...existing, starter[1]])
  expect(storage.getItem('settings')).toBe('不可更動')
  expect(storage.getItem('libraryCompletion')).toBe('{"done":true}')
  storage.writes.length = 0
  expect(seedStarterDocuments(storage, 'documents', starter)).toEqual(result)
  expect(storage.writes).toEqual([])
})

test('刪除已提供單元後不復活，未來新增 ID 仍會補入', () => {
  const storage = memoryStorage()
  seedStarterDocuments(storage, 'documents', starter)
  storage.setItem('documents', JSON.stringify([starter[1]]))
  const added = { id: 'starter-three', title: '新增主題' }
  expect(seedStarterDocuments(storage, 'documents', [...starter, added])).toEqual([starter[1], added])
})

test('單字題庫附加保持關聯，不覆寫同 ID 題庫、不補回已刪單字', () => {
  const existing = { version: 1, sets: [{ ...starter[0], title: '修改後' }], items: [], extra: '保留' }
  const storage = memoryStorage({ vocabulary: JSON.stringify(existing) })
  const result = seedStarterVocabulary(storage, 'vocabulary', vocabulary)
  expect(result).toEqual({ ...existing, sets: [...existing.sets, starter[1]], items: [vocabulary.items[1]] })
  expect(seedStarterVocabulary(storage, 'vocabulary', vocabulary)).toEqual(result)
})

test('item ID 與使用者資料碰撞時整個單元跳過，避免錯誤關聯', () => {
  const existing = { version: 1, sets: [{ id: 'user', title: '我的單字' }], items: [{ ...vocabulary.items[0], setId: 'user' }] }
  const storage = memoryStorage({ vocabulary: JSON.stringify(existing) })
  const result = seedStarterVocabulary(storage, 'vocabulary', vocabulary)
  expect(result?.sets).toEqual([...existing.sets, starter[1]])
  expect(result?.items).toEqual([...existing.items, vocabulary.items[1]])
})

for (const raw of ['{broken', 'null', '{"version":2,"sets":[],"items":[]}', '{"version":1,"sets":{},"items":[]}']) {
  test(`無法辨識的儲存內容不覆寫：${raw}`, () => {
    const storage = memoryStorage({ vocabulary: raw })
    expect(seedStarterVocabulary(storage, 'vocabulary', vocabulary)).toBeUndefined()
    expect(storage.writes).toEqual([])
    expect(storage.getItem('vocabulary')).toBe(raw)
  })
}

test('容量不足不記錄完成，下次可重試且原資料不變', () => {
  const storage = memoryStorage({ documents: '[]' })
  const full = {
    ...storage,
    setItem: () => {
      throw new Error('QuotaExceededError')
    },
  }
  expect(() => seedStarterDocuments(full, 'documents', starter)).not.toThrow()
  expect(storage.getItem('documents')).toBe('[]')
  expect(storage.data.size).toBe(1)
  expect(seedStarterDocuments(storage, 'documents', starter)).toEqual(starter)
})

test('題庫寫入成功、標記失敗後可安全恢復且不重複', () => {
  const storage = memoryStorage()
  seedStarterDocuments(
    {
      ...storage,
      setItem: (key, value) => {
        if (key !== 'documents') throw new Error('QuotaExceededError')
        storage.setItem(key, value)
      },
    },
    'documents',
    starter,
  )
  expect(seedStarterDocuments(storage, 'documents', starter)).toEqual(starter)
  expect(JSON.parse(storage.getItem('documents')!)).toHaveLength(2)
})

test('無法讀取 storage 時安全停止；損壞的 Starter 紀錄不觸發重建', () => {
  const unreadable = {
    removeItem: () => undefined,
    getItem: () => {
      throw new Error('SecurityError')
    },
    setItem: () => {
      throw new Error('不可寫入')
    },
  }
  expect(seedStarterDocuments(unreadable, 'documents', starter)).toBeUndefined()
  const storage = memoryStorage({ documents: '[]', 'keylinguaStarter:documents': '{broken' })
  expect(seedStarterDocuments(storage, 'documents', starter)).toBeUndefined()
  expect(storage.writes).toEqual([])
})

test('刪除整個內建詞庫後不重建，後續版本只加入新的詞庫', () => {
  const storage = memoryStorage()
  seedStarterVocabulary(storage, 'vocabulary', vocabulary)
  storage.setItem('vocabulary', JSON.stringify({ version: 1, sets: [starter[1]], items: [vocabulary.items[1]] }))
  const next = {
    version: 1 as const,
    sets: [...starter, { id: 'starter-three', title: '新詞庫' }],
    items: [...vocabulary.items, { id: 'starter-three-word', setId: 'starter-three', word: 'new' }],
  }
  const result = seedStarterVocabulary(storage, 'vocabulary', next)
  expect(result?.sets.map(({ id }) => id)).toEqual(['starter-two', 'starter-three'])
  expect(result?.items.map(({ id }) => id)).toEqual(['starter-two-word', 'starter-three-word'])
})

test('既有孤立單字占用 setId 時不附加內建題庫，以免混入使用者單字', () => {
  const orphan = { id: 'my-orphan', setId: starter[0].id, word: '我的單字' }
  const storage = memoryStorage({ vocabulary: JSON.stringify({ version: 1, sets: [], items: [orphan] }) })
  const result = seedStarterVocabulary(storage, 'vocabulary', vocabulary)
  expect(result?.sets).toEqual([starter[1]])
  expect(result?.items).toEqual([orphan, vocabulary.items[1]])
})

test('Starter 紀錄寫入失敗時回復原始題庫，不留下可被刪除又復活的半成功單元', () => {
  const original = '[ {"id":"user-one", "title":"我的文章"} ]'
  const storage = memoryStorage({ documents: original })
  seedStarterDocuments(
    {
      ...storage,
      setItem: (key, value) => {
        if (key !== 'documents') throw new Error('QuotaExceededError')
        storage.setItem(key, value)
      },
    },
    'documents',
    starter,
  )
  expect(storage.getItem('documents')).toBe(original)
})
