import { expect, test } from '@playwright/test'

const libraryKeys = ['pastedPracticeDocuments', 'vocabularyLibrary', 'englishPracticeDocuments', 'englishVocabularyLibrary']

test('全新使用者第一次開啟就有四類各 75 個可選單元', async ({ page }) => {
  await page.goto('/')
  const counts = await page.evaluate(
    (keys) =>
      keys.map((key) => {
        const value = JSON.parse(localStorage.getItem(key) ?? 'null')
        return Array.isArray(value) ? value.length : value?.sets?.length ?? 0
      }),
    libraryKeys,
  )
  expect(counts).toEqual([75, 75, 75, 75])
  for (const [route, level] of [
    ['/ja/articles', 'N5'],
    ['/ja/vocabulary', 'N5'],
    ['/en/dialogues', 'A1'],
    ['/en/vocabulary', 'A1'],
  ]) {
    await page.goto(route)
    await expect(page.getByRole('button', { name: new RegExp(`^${level}`) })).toContainText('15')
    await page.getByRole('button', { name: new RegExp(`^${level}`) }).click()
    await expect(page.getByRole('button', { name: '開始練習', exact: true })).toHaveCount(15)
  }
})

test('既有四類題庫、completion、progress 與自訂設定皆保留，重開不重複', async ({ page }) => {
  const values = {
    pastedPracticeDocuments: [
      {
        id: 'user-article',
        title: '我的文章',
        source: 'pasted',
        language: 'ja',
        jlptLevel: 'N5',
        sentences: [{ name: 'あ', notation: 'あ', trans: ['測試'] }],
      },
    ],
    englishPracticeDocuments: [
      {
        id: 'user-dialogue',
        title: 'My dialogue',
        level: 'A1',
        source: 'manual',
        createdAt: '2020-01-01',
        sentences: [{ text: 'Hi!', meaning: '嗨！' }],
      },
    ],
    vocabularyLibrary: {
      version: 1,
      sets: [{ id: 'user-ja-set', title: '我的日文詞庫', jlptLevel: 'N5', createdAt: '2020-01-01' }],
      items: [{ id: 'user-ja-word', setId: 'user-ja-set', jlptLevel: 'N5', word: '猫', reading: 'ねこ', meaning: '貓' }],
    },
    englishVocabularyLibrary: {
      version: 1,
      sets: [{ id: 'user-en-set', title: '我的英文詞庫', level: 'A1', createdAt: '2020-01-01' }],
      items: [{ id: 'user-en-word', setId: 'user-en-set', word: 'cat', meaning: '貓' }],
    },
    libraryCompletion: { 'japanese:article:user-article': true },
    libraryImportRules: { japaneseArticle: '保留我的文章規則', englishDialogue: 'Keep my rules' },
    articleSpeechConfig: { enabled: false, rate: 0.8, voiceURI: 'Nanami-custom' },
    keySoundsConfig: { isOpen: false, volume: 0.21 },
    customProgress: { 'user-article': 4 },
  }
  await page.addInitScript((entries) => {
    if (localStorage.getItem('starter-test-user')) return
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, JSON.stringify(value))
    localStorage.setItem('starter-test-user', '1')
  }, values)
  await page.goto('/')
  for (const route of ['/ja/vocabulary', '/en/dialogues', '/en/vocabulary', '/']) await page.goto(route)
  const snapshot = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)])))
  for (const key of libraryKeys) {
    const original = values[key as keyof typeof values] as any
    const merged = JSON.parse(snapshot[key]!)
    if (Array.isArray(original)) {
      expect(merged).toHaveLength(76)
      expect(merged[0]).toEqual(original[0])
    } else {
      expect(merged.sets).toHaveLength(76)
      expect(merged.items).toHaveLength(3751)
      expect(merged.sets[0]).toEqual(original.sets[0])
      expect(merged.items[0]).toEqual(original.items[0])
    }
  }
  for (const [key, value] of Object.entries(values)) {
    if (!libraryKeys.includes(key)) expect(snapshot[key], key).toBe(JSON.stringify(value))
  }
  await page.reload()
  const reloaded = await page.evaluate((keys) => keys.map((key) => localStorage.getItem(key)), libraryKeys)
  expect(reloaded).toEqual(libraryKeys.map((key) => snapshot[key]))
})

test('保留舊版日文 vocabularyItems 的 ID 與內容', async ({ page }) => {
  const legacy = [{ id: 'legacy-my-cat', jlptLevel: 'N5', word: '猫', reading: 'ねこ', meaning: '我家的貓' }]
  await page.addInitScript((items) => {
    if (!localStorage.getItem('vocabularyItems')) localStorage.setItem('vocabularyItems', JSON.stringify(items))
  }, legacy)
  await page.goto('/ja/vocabulary')
  const result = await page.evaluate(() => JSON.parse(localStorage.getItem('vocabularyLibrary')!))
  expect(result.sets).toHaveLength(76)
  expect(result.items[0]).toMatchObject(legacy[0])
  await page.reload()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('vocabularyLibrary')!).items.length)).toBe(3751)
})

for (const [route, level, key] of [
  ['/ja/articles', 'N5', 'pastedPracticeDocuments'],
  ['/ja/vocabulary', 'N5', 'vocabularyLibrary'],
  ['/en/dialogues', 'A1', 'englishPracticeDocuments'],
  ['/en/vocabulary', 'A1', 'englishVocabularyLibrary'],
]) {
  test(`${route} 的內建單元可開始打字、暫停、重新開始`, async ({ page }) => {
    await page.goto(route)
    await page.getByRole('button', { name: new RegExp(`^${level}`) }).click()
    await page.getByRole('button', { name: '開始練習', exact: true }).first().click()
    await expect(page.getByTestId('practice-header-title')).toBeVisible()
    await page.getByRole('button', { name: '繼續', exact: true }).click()
    const currentLetter = page.getByTestId('practice-romaji-typing-row').locator('[data-current-letter="true"]')
    const firstLetter = await currentLetter.textContent()
    expect(firstLetter).toMatch(/^[A-Za-z]$/)
    await page.keyboard.press(firstLetter!)
    await expect(currentLetter).toHaveAttribute('data-global-letter-index', '1')
    await page.getByRole('button', { name: '暫停', exact: true }).click()
    await page.keyboard.press('x')
    await expect(currentLetter).toHaveAttribute('data-global-letter-index', '1')
    await page.getByRole('button', { name: '繼續', exact: true }).click()
    await expect(currentLetter).toHaveAttribute('data-global-letter-index', '1')
    await page.getByRole('button', { name: '暫停', exact: true }).click()
    await page.getByRole('button', { name: '繼續', exact: true }).hover()
    await page.getByRole('button', { name: '重新', exact: true }).click()
    await expect(page.getByRole('button', { name: '暫停', exact: true })).toBeVisible()
    await expect(page.getByTestId('practice-romaji-typing-row').locator('[data-current-letter="true"]')).toHaveAttribute(
      'data-global-letter-index',
      '0',
    )
  })
  test(`${route} 刪除內建單元後重開維持刪除`, async ({ page }) => {
    await page.goto(`${route}/manage?level=${level}`)
    await page.getByRole('button', { name: '刪除', exact: true }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('button', { name: /^確認刪除(?:題庫)?$/ })).toBeVisible()
    await dialog.getByRole('button', { name: /^確認刪除(?:題庫)?$/ }).click()
    await expect(page.getByRole('button', { name: '刪除', exact: true })).toHaveCount(14)
    await page.reload()
    const count = await page.evaluate((storageKey) => {
      const value = JSON.parse(localStorage.getItem(storageKey)!)
      return Array.isArray(value) ? value.length : value.sets.length
    }, key)
    expect(count).toBe(74)
  })
}

for (const width of [1366, 768]) {
  for (const dark of [false, true]) {
    test(`Starter Library Chromium 版面 ${width}px ${dark ? 'dark' : 'light'}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript((enabled) => localStorage.setItem('isOpenDarkModeAtom', JSON.stringify(enabled)), dark)
      for (const [route, level] of [
        ['/ja/articles', 'N1'],
        ['/ja/vocabulary', 'N1'],
        ['/en/dialogues', 'C1'],
        ['/en/vocabulary', 'C1'],
      ]) {
        await page.goto(route)
        await page.getByRole('button', { name: new RegExp(`^${level}`) }).click()
        await expect(page.getByRole('button', { name: '開始練習', exact: true })).toHaveCount(15)
        const layout = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('article')).map((element) => {
            const r = element.getBoundingClientRect()
            const title = element.querySelector('h3')
            const t = title?.getBoundingClientRect()
            const style = title && getComputedStyle(title)
            return {
              left: r.left,
              right: r.right,
              top: r.top,
              bottom: r.bottom,
              titleInside: !t || (t.left >= r.left && t.right <= r.right && t.bottom <= r.bottom),
              color: style?.color,
            }
          })
          return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, cards }
        })
        expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width + 1)
        expect(layout.cards.length).toBeGreaterThan(0)
        for (const card of layout.cards) {
          expect(card.left).toBeGreaterThanOrEqual(0)
          expect(card.right).toBeLessThanOrEqual(width + 1)
          expect(card.titleInside).toBe(true)
          expect(card.color).toBe(dark ? 'rgb(243, 244, 246)' : 'rgb(17, 24, 39)')
        }
        for (let i = 0; i < layout.cards.length; i++) {
          for (let j = i + 1; j < layout.cards.length; j++) {
            const a = layout.cards[i],
              b = layout.cards[j]
            expect(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top).toBe(true)
          }
        }
        await page.screenshot({ path: testInfo.outputPath(`${route.replace(/\//g, '-')}.png`), fullPage: true })
      }
    })
  }
}
