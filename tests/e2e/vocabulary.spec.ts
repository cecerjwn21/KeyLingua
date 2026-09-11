import { importVocabularySets, migrateVocabularyLibrary } from '../../src/pages/Vocabulary/utils/vocabulary'
import { expect, test } from '@playwright/test'

const n4Vocabulary = {
  jlptLevel: 'N4',
  word: '予定',
  reading: 'よてい',
  meaning: '預定、計畫',
}

const typeVocabularyTarget = async (page: import('@playwright/test').Page, target: string, startIndex = 0) => {
  for (const [index, character] of Array.from(target).entries()) {
    await page.keyboard.press(character)
    if (index < target.length - 1) {
      await expect
        .poll(() =>
          page.getByTestId('practice-romaji-typing-row').locator('[data-current-letter="true"]').getAttribute('data-global-letter-index'),
        )
        .toBe(String(startIndex + index + 1))
    }
  }
}

test.describe('VocabularySet data contract', () => {
  test('舊 N4 100 筆只 migration 一次並保留全部 item id', () => {
    const legacyItems = Array.from({ length: 100 }, (_, index) => ({
      id: `legacy-n4-${index + 1}`,
      jlptLevel: 'N4' as const,
      word: `單字${index + 1}`,
      reading: `たんご${index + 1}`,
      meaning: `意思${index + 1}`,
      source: 'manual' as const,
    }))

    const migrated = migrateVocabularyLibrary(undefined, legacyItems)
    const reloaded = migrateVocabularyLibrary(migrated, legacyItems)

    expect(migrated.sets).toHaveLength(1)
    expect(migrated.sets[0]).toMatchObject({ title: 'N4｜實用自由行單字 100', jlptLevel: 'N4' })
    expect(migrated.items).toHaveLength(100)
    expect(migrated.items.map((item) => item.id)).toEqual(legacyItems.map((item) => item.id))
    expect(new Set(migrated.items.map((item) => item.setId))).toEqual(new Set([migrated.sets[0].id]))
    expect(reloaded).toEqual(migrated)
  })

  test('無法辨識主題的舊資料依 JLPT 建立 fallback 題庫', () => {
    const migrated = migrateVocabularyLibrary(undefined, [
      { ...n4Vocabulary, id: 'legacy-n4' },
      { ...n4Vocabulary, id: 'legacy-n5', jlptLevel: 'N5' as const, word: '駅', reading: 'えき' },
    ])

    expect(migrated.sets.map(({ title }) => title).sort()).toEqual(['N4｜已匯入單字', 'N5｜已匯入單字'])
    expect(migrated.items).toHaveLength(2)
  })

  test('新格式使用 JSON title 並由 set level 套入 items', () => {
    const result = importVocabularySets(
      [
        {
          text: JSON.stringify({
            title: 'N5｜用餐單字 100',
            jlptLevel: 'N5',
            items: [
              { word: '注文', reading: 'ちゅうもん', meaning: '點餐、訂購' },
              { word: '会計', reading: 'かいけい', meaning: '結帳', source: 'manual' },
            ],
          }),
          filename: 'ignored-filename.json',
        },
      ],
      { version: 1, sets: [], items: [] },
    )

    expect(result).not.toHaveProperty('error')
    if ('error' in result) return
    expect(result.sets[0]).toMatchObject({ title: 'N5｜用餐單字 100', jlptLevel: 'N5' })
    expect(result.items).toHaveLength(2)
    expect(result.items.every((item) => item.jlptLevel === 'N5' && item.setId === result.sets[0].id)).toBe(true)
  })

  test('multi-file 每檔建立獨立題庫，JSON title 優先於 filename', () => {
    const result = importVocabularySets(
      [
        { text: JSON.stringify([{ ...n4Vocabulary, word: '注文', reading: 'ちゅうもん' }]), filename: 'N4_用餐單字_100.json' },
        {
          text: JSON.stringify({
            title: 'N4｜購物單字 100',
            jlptLevel: 'N4',
            items: [{ ...n4Vocabulary, word: '会計', reading: 'かいけい' }],
          }),
          filename: 'filename-must-not-win.json',
        },
      ],
      { version: 1, sets: [], items: [] },
    )

    expect(result).not.toHaveProperty('error')
    if ('error' in result) return
    expect(result.sets.map(({ title }) => title)).toEqual(['N4_用餐單字_100', 'N4｜購物單字 100'])
    expect(new Set(result.items.map(({ setId }) => setId)).size).toBe(2)
  })

  test('貼上舊 array 沒有 title 時拒絕匯入，提供名稱後建立一個題庫', () => {
    const withoutTitle = importVocabularySets([{ text: JSON.stringify([n4Vocabulary]) }], { version: 1, sets: [], items: [] })
    expect(withoutTitle).toEqual({ error: '請輸入題庫名稱。' })

    const named = importVocabularySets([{ text: JSON.stringify([n4Vocabulary]) }], { version: 1, sets: [], items: [] }, 'N4｜旅行規劃單字')
    expect(named).not.toHaveProperty('error')
    if ('error' in named) return
    expect(named.sets[0].title).toBe('N4｜旅行規劃單字')
  })

  test('題庫名稱拒絕 Set、Batch 與批次技術名稱', () => {
    for (const title of ['Set A', 'Set B', 'Batch 1', '批次 2']) {
      const result = importVocabularySets([{ text: JSON.stringify({ title, jlptLevel: 'N4', items: [n4Vocabulary] }) }], {
        version: 1,
        sets: [],
        items: [],
      })
      expect(result).toEqual({ error: '題庫名稱必須描述主題，不能使用 Set、Batch 或批次編號。' })
    }
  })

  test('multi-file 任一 item 無效時維持整批 atomic 並指出檔案與單字索引', () => {
    const existing = { version: 1 as const, sets: [], items: [] }
    const result = importVocabularySets(
      [
        { text: JSON.stringify([{ ...n4Vocabulary, word: '注文', reading: 'ちゅうもん' }]), filename: 'valid.json' },
        {
          text: JSON.stringify([
            { ...n4Vocabulary, word: '会計', reading: 'かいけい' },
            { ...n4Vocabulary, word: '', reading: 'しっぱい' },
          ]),
          filename: 'invalid.json',
        },
      ],
      existing,
    )

    expect(result).toEqual({ error: '第 2 個檔案，第 2 個單字格式錯誤：word 必須是非空字串。' })
    expect(existing).toEqual({ version: 1, sets: [], items: [] })
  })

  test('相同單字可存在於不同題庫，但同一題庫內只保留一次', () => {
    const result = importVocabularySets(
      [
        {
          text: JSON.stringify({
            title: 'N5｜用餐單字',
            jlptLevel: 'N5',
            items: [
              { word: '注文', reading: 'ちゅうもん', meaning: '點餐' },
              { word: '注文', reading: 'ちゅうもん', meaning: '訂購' },
            ],
          }),
          filename: 'meal.json',
        },
        {
          text: JSON.stringify({
            title: 'N5｜居酒屋單字',
            jlptLevel: 'N5',
            items: [{ word: '注文', reading: 'ちゅうもん', meaning: '點餐' }],
          }),
          filename: 'izakaya.json',
        },
      ],
      { version: 1, sets: [], items: [] },
    )

    expect(result).not.toHaveProperty('error')
    if ('error' in result) return
    expect(result.items).toHaveLength(2)
    expect(result.duplicates).toHaveLength(1)
  })
})

const seedVocabularyLibrary = async (
  page: import('@playwright/test').Page,
  library: {
    version: 1
    sets: Array<{ id: string; title: string; jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'; createdAt: string }>
    items: Array<{
      id: string
      setId: string
      jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
      word: string
      reading: string
      meaning: string
      source?: 'manual' | 'article'
      sourceTitle?: string
    }>
  },
) => {
  await page.goto('/')
  await page.evaluate((value) => {
    localStorage.removeItem('vocabularyItems')
    localStorage.setItem('vocabularyLibrary', JSON.stringify(value))
    localStorage.removeItem('currentVocabularySetId')
    localStorage.removeItem('practiceSource')
  }, library)
  await page.goto('/vocabulary')
}

const libraryFixture = {
  version: 1 as const,
  sets: [
    { id: 'n5-meal', title: 'N5｜用餐單字 100', jlptLevel: 'N5' as const, createdAt: '2026-08-26T00:00:00.000Z' },
    { id: 'n5-shop', title: 'N5｜購物單字 100', jlptLevel: 'N5' as const, createdAt: '2026-08-26T00:00:00.000Z' },
    { id: 'n5-hotel', title: 'N5｜飯店單字 60', jlptLevel: 'N5' as const, createdAt: '2026-08-26T00:00:00.000Z' },
  ],
  items: [
    {
      id: 'meal-order',
      setId: 'n5-meal',
      jlptLevel: 'N5' as const,
      word: '注文',
      reading: 'ちゅうもん',
      meaning: '點餐',
      source: 'manual' as const,
    },
    {
      id: 'shop-pay',
      setId: 'n5-shop',
      jlptLevel: 'N5' as const,
      word: '会計',
      reading: 'かいけい',
      meaning: '結帳',
      source: 'manual' as const,
    },
    {
      id: 'shop-bag',
      setId: 'n5-shop',
      jlptLevel: 'N5' as const,
      word: '袋',
      reading: 'ふくろ',
      meaning: '袋子',
      source: 'article' as const,
      sourceTitle: '便利商店會話',
    },
    {
      id: 'hotel-room',
      setId: 'n5-hotel',
      jlptLevel: 'N5' as const,
      word: '部屋',
      reading: 'へや',
      meaning: '房間',
      source: 'article' as const,
    },
  ],
}

const polyphonicVocabularyFixture = {
  version: 1 as const,
  sets: [{ id: 'polyphonic-vocabulary', title: 'N5｜多音漢字朗讀回歸', jlptLevel: 'N5' as const, createdAt: '2026-08-26T00:00:00.000Z' }],
  items: [
    {
      id: 'ten-too',
      setId: 'polyphonic-vocabulary',
      jlptLevel: 'N5' as const,
      word: '十',
      reading: 'とお',
      meaning: '十',
      source: 'manual' as const,
    },
    {
      id: 'ten-ji',
      setId: 'polyphonic-vocabulary',
      jlptLevel: 'N5' as const,
      word: '十時',
      reading: 'じゅうじ',
      meaning: '十點',
      source: 'manual' as const,
    },
    {
      id: 'first-day-tsuitachi',
      setId: 'polyphonic-vocabulary',
      jlptLevel: 'N5' as const,
      word: '一日',
      reading: 'ついたち',
      meaning: '一日',
      source: 'manual' as const,
    },
    {
      id: 'first-day-ichinichi',
      setId: 'polyphonic-vocabulary',
      jlptLevel: 'N5' as const,
      word: '一日',
      reading: 'いちにち',
      meaning: '一天',
      source: 'manual' as const,
    },
    {
      id: 'moon-tsuki',
      setId: 'polyphonic-vocabulary',
      jlptLevel: 'N5' as const,
      word: '月',
      reading: 'つき',
      meaning: '月亮',
      source: 'manual' as const,
    },
    {
      id: 'january',
      setId: 'polyphonic-vocabulary',
      jlptLevel: 'N5' as const,
      word: '一月',
      reading: 'いちがつ',
      meaning: '一月',
      source: 'manual' as const,
    },
    {
      id: 'four-ji',
      setId: 'polyphonic-vocabulary',
      jlptLevel: 'N5' as const,
      word: '四時',
      reading: 'よじ',
      meaning: '四點',
      source: 'manual' as const,
    },
    {
      id: 'seven-ji',
      setId: 'polyphonic-vocabulary',
      jlptLevel: 'N5' as const,
      word: '七時',
      reading: 'しちじ',
      meaning: '七點',
      source: 'manual' as const,
    },
    {
      id: 'nine-ji',
      setId: 'polyphonic-vocabulary',
      jlptLevel: 'N5' as const,
      word: '九時',
      reading: 'くじ',
      meaning: '九點',
      source: 'manual' as const,
    },
    {
      id: 'twentieth',
      setId: 'polyphonic-vocabulary',
      jlptLevel: 'N5' as const,
      word: '二十日',
      reading: 'はつか',
      meaning: '二十日',
      source: 'manual' as const,
    },
    {
      id: 'vacant-suku',
      setId: 'polyphonic-vocabulary',
      jlptLevel: 'N5' as const,
      word: '空く',
      reading: 'すく',
      meaning: '變空、不擁擠',
      source: 'manual' as const,
    },
  ],
}

test.describe('Vocabulary Library UI', () => {
  test.beforeEach(async ({ page }) => seedVocabularyLibrary(page, libraryFixture))

  test('首頁只顯示 JLPT 的題庫與單字總數，分類頁只顯示有名稱題庫', async ({ page }) => {
    await expect(page.getByRole('link', { name: '單字庫' })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('button', { name: /^N5/ })).toContainText('3 個題庫・4 個單字')
    await expect(page.getByTestId('vocabulary-item-card')).toHaveCount(0)

    await page.getByRole('button', { name: /^N5/ }).click()
    await expect(page.getByRole('heading', { name: 'N5 單字題庫' })).toBeVisible()
    await expect(page.getByTestId('vocabulary-set-card')).toHaveCount(3)
    await expect(page.getByText('N5｜用餐單字 100', { exact: true })).toBeVisible()
    await expect(page.getByText('N5｜購物單字 100', { exact: true })).toBeVisible()
    await expect(page.getByText('N5｜飯店單字 60', { exact: true })).toBeVisible()
    await expect(page.getByTestId('vocabulary-item-card')).toHaveCount(0)
    await expect(page.getByText(/Set A|Set B|Batch 1/)).toHaveCount(0)
  })

  test('管理頁將來源篩選限制在目前題庫且 dark mode 文字可讀', async ({ page }) => {
    await page.goto('/ja/vocabulary/manage?level=N5')
    const shoppingSet = page.getByTestId('vocabulary-set-card').filter({ hasText: 'N5｜購物單字 100' })
    await shoppingSet.getByRole('button', { name: '編輯' }).click()
    await expect(page.getByTestId('vocabulary-item-card')).toHaveCount(2)
    await page.getByRole('button', { name: '來自文章' }).click()
    await expect(page.getByRole('button', { name: '來自文章' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('vocabulary-item-card')).toHaveCount(1)
    await expect(page.getByTestId('vocabulary-item-card')).toContainText('袋')

    await page.evaluate(() => document.documentElement.classList.add('dark'))
    const activeColor = await page.getByRole('button', { name: '來自文章' }).evaluate((element) => getComputedStyle(element).color)
    const inactiveColor = await page.getByRole('button', { name: '手動新增' }).evaluate((element) => getComputedStyle(element).color)
    expect(activeColor).not.toBe('rgb(0, 0, 0)')
    expect(inactiveColor).not.toBe('rgb(0, 0, 0)')
  })

  test('題庫 CRUD 與單字 CRUD 固定在目前 setId，刪除題庫會 cascade', async ({ page }) => {
    await page.getByRole('button', { name: '新增題庫' }).click()
    await page.getByLabel('題庫名稱').fill('N4｜車站與轉乘單字')
    await page.getByLabel('JLPT 等級').selectOption('N4')
    await page.getByRole('button', { name: '建立題庫' }).click()
    await page.goto('/ja/vocabulary/manage?level=N4')
    const setCard = page.getByTestId('vocabulary-set-card').filter({ hasText: 'N4｜車站與轉乘單字' })
    await setCard.getByRole('button', { name: '編輯' }).click()
    await page.getByRole('button', { name: '新增單字' }).click()
    await page.getByLabel('單字', { exact: true }).fill('予定')
    await page.getByLabel('讀音').fill('よてい')
    await page.getByLabel('意思').fill('預定、計畫')
    await page.getByRole('button', { name: '儲存單字' }).click()
    const itemCard = page.getByTestId('vocabulary-item-card')
    const itemId = await itemCard.getAttribute('data-vocabulary-id')
    await itemCard.getByRole('button', { name: '編輯' }).click()
    await page.getByLabel('意思').fill('行程、預定')
    await page.getByRole('button', { name: '儲存變更' }).click()
    await expect(itemCard).toHaveAttribute('data-vocabulary-id', itemId ?? '')
    await expect(itemCard).toContainText('行程、預定')
    await itemCard.getByRole('button', { name: '刪除' }).click()
    await page.getByRole('button', { name: '確認刪除' }).click()
    await expect(page.getByTestId('vocabulary-item-card')).toHaveCount(0)
    await page.getByRole('button', { name: '新增單字' }).click()
    await page.getByLabel('單字', { exact: true }).fill('駅')
    await page.getByLabel('讀音').fill('えき')
    await page.getByLabel('意思').fill('車站')
    await page.getByRole('button', { name: '儲存單字' }).click()

    await expect(page.getByRole('button', { name: '返回題庫管理' })).toBeVisible()
    await page.getByRole('button', { name: '返回題庫管理' }).click()
    await setCard.getByRole('button', { name: '刪除' }).click()
    await page.getByRole('button', { name: '確認刪除題庫' }).click()
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('vocabularyLibrary') ?? 'null'))
    expect(saved.sets.some((set: { title: string }) => set.title === 'N4｜車站與轉乘單字')).toBe(false)
    expect(saved.items.some((item: { id: string }) => item.id === itemId)).toBe(false)
  })

  test('舊 pasted array 必須輸入題庫名稱，multi-file 每檔建立獨立題庫並可 reload', async ({ page }) => {
    await page.getByRole('button', { name: '匯入題庫' }).click()
    await page.getByLabel('單字 JSON').fill(JSON.stringify([n4Vocabulary]))
    await page.getByRole('button', { name: '驗證題庫' }).click()
    await expect(page.getByRole('alert')).toContainText('請輸入題庫名稱')
    await page.getByLabel('題庫名稱').fill('N4｜旅行規劃單字')
    await page.getByRole('button', { name: '驗證題庫' }).click()
    await expect(page.getByText('單字題庫驗證成功')).toBeVisible()
    await page.getByRole('button', { name: '匯入題庫' }).last().click()

    await page.getByRole('button', { name: '匯入題庫' }).click()
    await page.getByLabel('選擇 JSON 檔案').setInputFiles([
      {
        name: 'N5_車站單字_100.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify([{ ...n4Vocabulary, jlptLevel: 'N5', word: '駅', reading: 'えき' }])),
      },
      {
        name: 'ignored.json',
        mimeType: 'application/json',
        buffer: Buffer.from(
          JSON.stringify({ title: 'N5｜飯店入住單字', jlptLevel: 'N5', items: [{ word: '部屋', reading: 'へや', meaning: '房間' }] }),
        ),
      },
    ])
    await page.getByRole('button', { name: '驗證題庫' }).click()
    await expect(page.getByText('已驗證 2 個題庫・2 個單字')).toBeVisible()
    await page.getByRole('button', { name: '匯入題庫' }).last().click()
    await page.reload()
    await page.getByRole('button', { name: /^N5/ }).click()
    await expect(page.getByText('N5_車站單字_100', { exact: true })).toBeVisible()
    await expect(page.getByText('N5｜飯店入住單字', { exact: true })).toBeVisible()
  })
})

test.describe('Vocabulary migration UI', () => {
  test('localStorage 舊 N4 100 筆 migration 後 reload 不重複建立題庫', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('vocabularyLibrary')
      localStorage.setItem(
        'vocabularyItems',
        JSON.stringify(
          Array.from({ length: 100 }, (_, index) => ({
            id: `legacy-${index}`,
            jlptLevel: 'N4',
            word: `單字${index}`,
            reading: `たんご${index}`,
            meaning: `意思${index}`,
          })),
        ),
      )
    })
    await page.goto('/vocabulary')
    await expect(page.getByRole('button', { name: /^N4/ })).toContainText('1 個題庫・100 個單字')
    await page.reload()
    await page.getByRole('button', { name: /^N4/ }).click()
    await expect(page.getByText('N4｜實用自由行單字 100', { exact: true })).toHaveCount(1)
  })
})

test.describe('Vocabulary shared typing shell', () => {
  test.beforeEach(async ({ page }) => seedVocabularyLibrary(page, libraryFixture))

  test('只練所選題庫並使用 Article 的 Header、Letter 與 physical-key 流程', async ({ page }) => {
    await page.getByRole('button', { name: /^N5/ }).click()
    const shoppingSet = page.getByTestId('vocabulary-set-card').filter({ hasText: 'N5｜購物單字 100' })
    await shoppingSet.getByRole('button', { name: '開始練習' }).click()
    await expect(page).toHaveURL(/\/typing$/)
    await expect(page.getByTestId('practice-header-title')).toHaveText('N5｜購物單字 100')
    await expect(page.getByText('目前 1 / 2', { exact: true })).toBeVisible()
    await expect(page.getByTestId('vocabulary-current-word')).toContainText('会計')
    await expect(page.locator('input[aria-label="單字練習輸入"]')).toHaveCount(0)
    await expect(page.getByTestId('practice-romaji-typing-row')).toHaveText('kaikei')
    await expect(page.getByRole('button', { name: '新詞自動朗讀' })).toBeVisible()
    await expect(page.getByRole('button', { name: '音效', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '顯示讀音' })).toBeVisible()
    await page.getByRole('button', { name: '繼續' }).click()
    await page.evaluate(() =>
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Process', code: 'KeyK', isComposing: true }),
      ),
    )
    await expect
      .poll(() =>
        page.getByTestId('practice-romaji-typing-row').locator('[data-current-letter="true"]').getAttribute('data-global-letter-index'),
      )
      .toBe('1')
    await typeVocabularyTarget(page, 'aikei', 1)
    await expect(page.getByText('目前 2 / 2', { exact: true })).toBeVisible()
    await expect(page.getByTestId('vocabulary-current-word')).toContainText('袋')
  })

  test('Restart 回目前題庫第一個單字並重設進度與統計，完成畫面沿用同一風格', async ({ page }) => {
    await page.getByRole('button', { name: /^N5/ }).click()
    await page.getByTestId('vocabulary-set-card').filter({ hasText: 'N5｜購物單字 100' }).getByRole('button', { name: '開始練習' }).click()
    await page.getByRole('button', { name: '繼續' }).click()
    await typeVocabularyTarget(page, 'kaikei')
    await expect(page.getByText('目前 2 / 2', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '暫停' }).click()
    await page.getByRole('button', { name: '繼續' }).hover()
    await page.getByRole('button', { name: '重新' }).click()
    await expect(page.getByText('目前 1 / 2', { exact: true })).toBeVisible()
    await expect(page.getByTestId('vocabulary-current-word')).toContainText('会計')
    await expect(page.getByTestId('practice-romaji-typing-row')).toHaveText('kaikei')

    await typeVocabularyTarget(page, 'kaikei')
    await expect(page.getByText('目前 2 / 2', { exact: true })).toBeVisible()
    await expect(page.getByTestId('practice-romaji-typing-row')).toHaveText('fukuro')
    await expect(page.getByTestId('practice-romaji-typing-row').locator('[data-current-letter="true"]')).toHaveAttribute(
      'data-global-letter-index',
      '0',
    )
    await typeVocabularyTarget(page, 'fukuro')
    const result = page.getByTestId('vocabulary-result-screen')
    await expect(result).toBeVisible()
    await expect(result.getByRole('heading', { name: 'N5｜購物單字 100' })).toBeVisible()
    await expect(result.getByText('2 個單字', { exact: true })).toBeVisible()
    await expect(result.getByText('完成時間', { exact: true })).toBeVisible()
    await expect(result.getByText('速度', { exact: true })).toBeVisible()
    await expect(result.getByText('正確率', { exact: true })).toBeVisible()
    await expect(result.getByText('錯誤數', { exact: true })).toBeVisible()
    await expect(result.getByRole('button', { name: '再練一次' })).toBeVisible()
    await expect(result.getByRole('button', { name: '返回單字庫' })).toBeVisible()
  })
})

test.describe('Vocabulary shared speech', () => {
  test('多音漢字的自動、手動、換詞與重新開始朗讀都忠實使用目前 item.reading', async ({ page }) => {
    await page.addInitScript(() => {
      const events: Array<{ type: 'speak' | 'cancel'; text?: string }> = []
      class TestSpeechSynthesisUtterance {
        text: string
        lang = ''
        voice: unknown = null
        rate = 1
        constructor(text: string) {
          this.text = text
        }
        addEventListener() {}
        removeEventListener() {}
      }
      const synth = {
        getVoices: () => [{ lang: 'ja-JP', name: 'Japanese', voiceURI: 'ja-test', localService: true }],
        speak: (utterance: TestSpeechSynthesisUtterance) => events.push({ type: 'speak', text: utterance.text }),
        cancel: () => events.push({ type: 'cancel' }),
      }
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: TestSpeechSynthesisUtterance })
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synth })
      ;(window as unknown as { __vocabularySpeechEvents: typeof events }).__vocabularySpeechEvents = events
    })
    await seedVocabularyLibrary(page, polyphonicVocabularyFixture)
    await page.evaluate(() => localStorage.removeItem('articleSpeechConfig'))
    await page.reload()
    await page.getByRole('button', { name: /^N5/ }).click()
    await page
      .getByTestId('vocabulary-set-card')
      .filter({ hasText: 'N5｜多音漢字朗讀回歸' })
      .getByRole('button', { name: '開始練習' })
      .click()

    const expected = [
      ['十', 'とお', 'too'],
      ['十時', 'じゅうじ', 'juuji'],
      ['一日', 'ついたち', 'tsuitachi'],
      ['一日', 'いちにち', 'ichinichi'],
      ['月', 'つき', 'tsuki'],
      ['一月', 'いちがつ', 'ichigatsu'],
      ['四時', 'よじ', 'yoji'],
      ['七時', 'しちじ', 'shichiji'],
      ['九時', 'くじ', 'kuji'],
      ['二十日', 'はつか', 'hatsuka'],
      ['空く', 'すく', 'suku'],
    ] as const
    const readSpokenTexts = () =>
      page.evaluate(() =>
        (window as Window & { __vocabularySpeechEvents: Array<{ type: string; text?: string }> }).__vocabularySpeechEvents
          .filter((event) => event.type === 'speak')
          .map((event) => event.text),
      )

    await page.getByRole('button', { name: '繼續' }).click()
    await expect.poll(readSpokenTexts).toEqual(['とお'])
    await expect(page.getByTestId('vocabulary-current-word')).toContainText(expected[0][0])
    await expect(page.getByTestId('vocabulary-current-word')).toContainText(expected[0][1])
    await expect(page.getByTestId('practice-romaji-typing-row')).toHaveText(expected[0][2])

    await page.getByRole('button', { name: '朗讀目前單字' }).click()
    await expect.poll(readSpokenTexts).toEqual(['とお', 'とお'])
    await page.getByRole('button', { name: '暫停' }).click()
    await page.getByRole('button', { name: '繼續' }).click()
    await page.waitForTimeout(50)
    await expect(readSpokenTexts()).resolves.toEqual(['とお', 'とお'])

    for (const [index, [word, reading, typing]] of expected.entries()) {
      await expect(page.getByTestId('vocabulary-current-word')).toContainText(word)
      await expect(page.getByTestId('vocabulary-current-word')).toContainText(reading)
      await expect(page.getByTestId('practice-romaji-typing-row')).toHaveText(typing)
      if (index < expected.length - 1) {
        await typeVocabularyTarget(page, typing)
        await expect.poll(readSpokenTexts).toEqual(['とお', 'とお', ...expected.slice(1, index + 2).map(([, nextReading]) => nextReading)])
      }
    }

    await page.getByRole('button', { name: '暫停' }).click()
    await page.getByRole('button', { name: '繼續' }).hover()
    await page.getByRole('button', { name: '重新' }).click()
    await expect(page.getByTestId('vocabulary-current-word')).toContainText('十')
    await expect.poll(readSpokenTexts).toEqual(['とお', 'とお', ...expected.slice(1).map(([, reading]) => reading), 'とお'])
  })

  test('auto-read、手動朗讀、Pause/Resume 與快速換詞共用 latest-wins speech', async ({ page }) => {
    await page.addInitScript(() => {
      const events: Array<{ type: 'speak' | 'cancel' | 'dropped'; text?: string }> = []
      class TestSpeechSynthesisUtterance {
        text: string
        lang = ''
        voice: unknown = null
        rate = 1
        constructor(text: string) {
          this.text = text
        }
        addEventListener() {}
        removeEventListener() {}
      }
      let cancelPending = false
      const synth = {
        getVoices: () => [{ lang: 'ja-JP', name: 'Japanese', voiceURI: 'ja-test', localService: true }],
        speak: (utterance: TestSpeechSynthesisUtterance) => {
          events.push(cancelPending ? { type: 'dropped', text: utterance.text } : { type: 'speak', text: utterance.text })
        },
        cancel: () => {
          cancelPending = true
          events.push({ type: 'cancel' })
          setTimeout(() => {
            cancelPending = false
          }, 0)
        },
      }
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: TestSpeechSynthesisUtterance })
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synth })
      ;(window as unknown as { __vocabularySpeechEvents: typeof events }).__vocabularySpeechEvents = events
    })
    await seedVocabularyLibrary(page, libraryFixture)
    await page.evaluate(() => localStorage.removeItem('articleSpeechConfig'))
    await page.reload()
    await page.getByRole('button', { name: /^N5/ }).click()
    await page.getByTestId('vocabulary-set-card').filter({ hasText: 'N5｜購物單字 100' }).getByRole('button', { name: '開始練習' }).click()
    await page.getByRole('button', { name: '繼續' }).click()
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as Window & { __vocabularySpeechEvents: Array<{ type: string; text?: string }> }).__vocabularySpeechEvents
            .filter((event) => event.type === 'speak')
            .map((event) => event.text),
        ),
      )
      .toEqual(['かいけい'])

    await page.getByRole('button', { name: '朗讀目前單字' }).click()
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as Window & { __vocabularySpeechEvents: Array<{ type: string; text?: string }> }).__vocabularySpeechEvents
            .filter((event) => event.type === 'speak')
            .map((event) => event.text),
        ),
      )
      .toEqual(['かいけい', 'かいけい'])
    await page.getByRole('button', { name: '暫停' }).click()
    await page.getByRole('button', { name: '繼續' }).click()
    await page.waitForTimeout(50)
    expect(
      await page.evaluate(
        () =>
          (window as Window & { __vocabularySpeechEvents: Array<{ type: string }> }).__vocabularySpeechEvents.filter(
            (event) => event.type === 'speak',
          ).length,
      ),
    ).toBe(2)

    await typeVocabularyTarget(page, 'kaikei')
    await expect(page.getByText('目前 2 / 2', { exact: true })).toBeVisible()
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as Window & { __vocabularySpeechEvents: Array<{ type: string; text?: string }> }).__vocabularySpeechEvents
            .filter((event) => event.type === 'speak')
            .map((event) => event.text),
        ),
      )
      .toEqual(['かいけい', 'かいけい', 'ふくろ'])
    expect(
      await page.evaluate(() =>
        (window as Window & { __vocabularySpeechEvents: Array<{ type: string }> }).__vocabularySpeechEvents.some(
          (event) => event.type === 'dropped',
        ),
      ),
    ).toBe(false)
  })
})

test.describe('Vocabulary shared sound', () => {
  test('正確與錯誤按鍵沿用既有音效，按鍵音 150% 使用 6.0 gain 並持久化', async ({ page }) => {
    await page.addInitScript(() => {
      const originalCreateGain = BaseAudioContext.prototype.createGain
      const gainValues: number[] = []
      Object.defineProperty(window, '__vocabularyGainValues', { configurable: true, value: gainValues })
      BaseAudioContext.prototype.createGain = function () {
        const node = originalCreateGain.call(this)
        const originalSetValueAtTime = node.gain.setValueAtTime.bind(node.gain)
        node.gain.setValueAtTime = (value, startTime) => {
          gainValues.push(value)
          return originalSetValueAtTime(value, startTime)
        }
        return node
      }
    })
    await seedVocabularyLibrary(page, libraryFixture)
    await page.evaluate(() => {
      localStorage.removeItem('keySoundsConfig')
      localStorage.removeItem('hintSoundsConfig')
    })
    await page.reload()
    await page.getByRole('button', { name: /^N5/ }).click()
    await page.getByTestId('vocabulary-set-card').filter({ hasText: 'N5｜購物單字 100' }).getByRole('button', { name: '開始練習' }).click()
    await page.getByRole('button', { name: '音效', exact: true }).click()
    await page.getByLabel('按鍵音音量').fill('150')
    await page.getByRole('button', { name: '音效', exact: true }).click()
    await page.getByRole('button', { name: '繼續' }).click()
    await page.waitForTimeout(200)
    await page.evaluate(() => {
      ;(window as Window & { __vocabularyGainValues: number[] }).__vocabularyGainValues.length = 0
    })
    await page.keyboard.press('k')
    await expect
      .poll(() => page.evaluate(() => (window as Window & { __vocabularyGainValues: number[] }).__vocabularyGainValues))
      .toContain(6)

    await page.evaluate(() => {
      ;(window as Window & { __vocabularyGainValues: number[] }).__vocabularyGainValues.length = 0
    })
    await page.keyboard.press('z')
    await expect
      .poll(() => page.evaluate(() => (window as Window & { __vocabularyGainValues: number[] }).__vocabularyGainValues))
      .toContain(1)
    await expect
      .poll(() => page.evaluate(() => (window as Window & { __vocabularyGainValues: number[] }).__vocabularyGainValues))
      .not.toContain(6)
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('keySoundsConfig') ?? 'null')?.volume)).toBe(1.5)
  })
})
