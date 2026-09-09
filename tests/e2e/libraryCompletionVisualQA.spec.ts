import { expect, test } from '@playwright/test'
import type { Page, TestInfo } from '@playwright/test'

const japaneseArticles = Array.from({ length: 5 }, (_, index) => ({
  id: `visual-ja-article-${index + 1}`,
  title: index === 4 ? 'N5｜在車站詢問轉乘方式與月台位置的長繁體中文情境標題' : `N5｜完成狀態文章 ${index + 1}`,
  source: 'pasted',
  language: 'ja',
  jlptLevel: 'N5',
  scenario: '日本自由行・車站與日常情境',
  sentences:
    index === 0
      ? [
          { name: 'あ', notation: 'あ', trans: ['短句'] },
          { name: 'い', notation: 'い', trans: ['目前句'] },
          { name: '放課後に図書館へ行く予定はありますか', notation: '放課後に図書館へ行く予定はありますか', trans: ['很長的下一句翻譯內容'] },
        ]
      : [{ name: 'あ', notation: 'あ', trans: ['測試'] }],
}))

const japaneseVocabularySets = Array.from({ length: 5 }, (_, index) => ({
  id: `visual-ja-vocabulary-${index + 1}`,
  title: index === 4 ? 'N5｜便利商店、餐廳與車站實用長標題單字題庫' : `N5｜完成狀態單字 ${index + 1}`,
  jlptLevel: 'N5',
  createdAt: '2026-08-28T00:00:00.000Z',
}))

const japaneseVocabularyItems = japaneseVocabularySets.flatMap((set, setIndex) =>
  Array.from({ length: setIndex === 0 ? 3 : 1 }, (_, itemIndex) => ({
    id: `${set.id}-item-${itemIndex + 1}`,
    setId: set.id,
    jlptLevel: 'N5',
    word: ['亜', '伊', '宇'][itemIndex] ?? '絵',
    reading: ['あ', 'い', 'う'][itemIndex] ?? 'え',
    meaning: `測試單字 ${itemIndex + 1}`,
  })),
)

const englishDialogues = Array.from({ length: 5 }, (_, index) => ({
  id: `visual-en-dialogue-${index + 1}`,
  title:
    index === 4 ? 'A1｜Asking for directions and platform information at a busy railway station' : `A1｜Completion dialogue ${index + 1}`,
  level: 'A1',
  source: 'manual',
  createdAt: '2026-08-28T00:00:00.000Z',
  sentences:
    index === 0
      ? [
          { text: 'a', meaning: 'Short sentence' },
          { text: 'b', meaning: 'Current sentence' },
          { text: 'What do you need to do there after school?', meaning: 'A deliberately long next-sentence translation' },
        ]
      : [{ text: 'a', meaning: '測試' }],
}))

const englishVocabularySets = Array.from({ length: 5 }, (_, index) => ({
  id: `visual-en-vocabulary-${index + 1}`,
  title:
    index === 4
      ? 'A1｜Everyday restaurant, hotel, and railway station vocabulary with a deliberately long title'
      : `A1｜Completion vocabulary ${index + 1}`,
  level: 'A1',
  createdAt: '2026-08-28T00:00:00.000Z',
}))

const englishVocabularyItems = englishVocabularySets.flatMap((set, setIndex) =>
  Array.from({ length: setIndex === 0 ? 3 : 1 }, (_, itemIndex) => ({
    id: `${set.id}-item-${itemIndex + 1}`,
    setId: set.id,
    word: ['a', 'b', 'c'][itemIndex] ?? 'd',
    meaning: `測試單字 ${itemIndex + 1}`,
  })),
)

const completion = {
  ...Object.fromEntries(japaneseArticles.slice(0, 3).map(({ id }) => [`japanese:article:${id}`, true])),
  ...Object.fromEntries(japaneseVocabularySets.slice(0, 3).map(({ id }) => [`japanese:vocabulary:${id}`, true])),
  ...Object.fromEntries(englishDialogues.slice(0, 3).map(({ id }) => [`english:dialogue:${id}`, true])),
  ...Object.fromEntries(englishVocabularySets.slice(0, 3).map(({ id }) => [`english:vocabulary:${id}`, true])),
}

const seedStorage = async (page: Page, dark: boolean) => {
  await page.goto('/')
  await page.evaluate(
    ({
      dark,
      japaneseArticles,
      japaneseVocabularySets,
      japaneseVocabularyItems,
      englishDialogues,
      englishVocabularySets,
      englishVocabularyItems,
      completion,
    }) => {
      localStorage.clear()
      localStorage.setItem('isOpenDarkModeAtom', JSON.stringify(dark))
      localStorage.setItem('pastedPracticeDocuments', JSON.stringify(japaneseArticles))
      localStorage.setItem(
        'vocabularyLibrary',
        JSON.stringify({ version: 1, sets: japaneseVocabularySets, items: japaneseVocabularyItems }),
      )
      localStorage.setItem('englishPracticeDocuments', JSON.stringify(englishDialogues))
      localStorage.setItem(
        'englishVocabularyLibrary',
        JSON.stringify({ version: 1, sets: englishVocabularySets, items: englishVocabularyItems }),
      )
      localStorage.setItem('libraryCompletion', JSON.stringify(completion))
    },
    {
      dark,
      japaneseArticles,
      japaneseVocabularySets,
      japaneseVocabularyItems,
      englishDialogues,
      englishVocabularySets,
      englishVocabularyItems,
      completion,
    },
  )
}

const expectNoOverflowOrControlOverlap = async (page: Page) => {
  const layout = await page.evaluate(() => {
    const cards = [...document.querySelectorAll<HTMLElement>('[data-completed]')]
    const cardBounds = cards.map((card) => {
      const bounds = card.getBoundingClientRect()
      const controls = [...card.querySelectorAll<HTMLElement>('[data-testid="library-card-actions"] > *')]
        .filter((control) => getComputedStyle(control).visibility !== 'hidden')
        .map((control) => {
          const rect = control.getBoundingClientRect()
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }
        })
      return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom, controls }
    })
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      cardBounds,
    }
  })

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth)
  for (const card of layout.cardBounds) {
    expect(card.left).toBeGreaterThanOrEqual(0)
    expect(card.right).toBeLessThanOrEqual(layout.viewportWidth)
    for (const control of card.controls) {
      expect(control.left).toBeGreaterThanOrEqual(card.left)
      expect(control.right).toBeLessThanOrEqual(card.right)
      expect(control.top).toBeGreaterThanOrEqual(card.top)
      expect(control.bottom).toBeLessThanOrEqual(card.bottom)
    }
    for (let leftIndex = 0; leftIndex < card.controls.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < card.controls.length; rightIndex += 1) {
        const left = card.controls[leftIndex]
        const right = card.controls[rightIndex]
        const overlaps = left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top
        expect(overlaps).toBe(false)
      }
    }
  }
}

const verifyLibraryRoute = async ({
  page,
  testInfo,
  route,
  level,
  screenshotName,
  manage,
}: {
  page: Page
  testInfo: TestInfo
  route: string
  level: 'N5' | 'A1'
  screenshotName: string
  manage: boolean
}) => {
  await page.goto(route)
  if (!manage) await page.getByRole('button', { name: new RegExp(`^${level}`) }).click()
  await expect(page.locator('[data-completed]')).toHaveCount(5)
  await expect(page.locator('[data-completed="true"]')).toHaveCount(3)
  await expect(page.locator('[data-completed="false"]')).toHaveCount(2)
  await expectNoOverflowOrControlOverlap(page)
  await page.locator('[data-completed="true"]').first().hover()
  await page.screenshot({ path: testInfo.outputPath(`${screenshotName}.png`), fullPage: true })
}

const verifyTypingRoute = async ({
  page,
  testInfo,
  mode,
  screenshotName,
}: {
  page: Page
  testInfo: TestInfo
  mode: 'japanese-article' | 'japanese-vocabulary' | 'english-dialogue' | 'english-vocabulary'
  screenshotName: string
}) => {
  const route =
    mode === 'japanese-article'
      ? '/ja/articles'
      : mode === 'japanese-vocabulary'
      ? '/ja/vocabulary'
      : mode === 'english-dialogue'
      ? '/en/dialogues'
      : '/en/vocabulary'
  const level = mode.startsWith('japanese') ? 'N5' : 'A1'
  await page.goto(route)
  await page.getByRole('button', { name: new RegExp(`^${level}`) }).click()
  const firstCard =
    mode === 'japanese-article'
      ? page.getByTestId(`article-card-${japaneseArticles[0].id}`)
      : mode === 'japanese-vocabulary'
      ? page.getByTestId('vocabulary-set-card').filter({ hasText: japaneseVocabularySets[0].title })
      : mode === 'english-dialogue'
      ? page.getByTestId(`english-dialogue-card-${englishDialogues[0].id}`)
      : page.getByTestId(`english-vocabulary-card-${englishVocabularySets[0].id}`)
  await firstCard.getByRole('button', { name: '開始練習' }).click()
  await page.getByRole('button', { name: '繼續' }).click()
  if (mode !== 'japanese-article') await page.keyboard.press('Control+Shift+ArrowRight')

  if (mode === 'japanese-article') {
    await expectNoOverflowOrControlOverlap(page)
    await page.screenshot({ path: testInfo.outputPath(`${screenshotName}.png`), fullPage: true })
    return
  }

  const previous = page.getByTestId('practice-prev-word')
  const next = page.getByTestId('practice-next-word')
  await expect(previous).toHaveAttribute('aria-label', /^上一個：.+/)
  await expect(next).toHaveAttribute('aria-label', /^下一個：.+/)
  for (const control of [previous, next]) {
    await expect(control).toBeVisible()
    await expect(control).toHaveCSS('opacity', '1')
    const box = await control.boundingBox()
    expect(box).not.toBeNull()
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0)
  }
  await expectNoOverflowOrControlOverlap(page)
  await page.screenshot({ path: testInfo.outputPath(`${screenshotName}.png`), fullPage: true })
}

for (const { width, height, dark } of [
  { width: 1366, height: 768, dark: true },
  { width: 1366, height: 768, dark: false },
  { width: 390, height: 844, dark: true },
  { width: 390, height: 844, dark: false },
]) {
  const theme = dark ? 'dark' : 'light'
  test(`Library completion visual QA ${width}px ${theme}`, async ({ page }, testInfo) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width, height })
    await seedStorage(page, dark)

    for (const target of [
      { route: '/ja/articles', level: 'N5' as const, name: 'ja-article-library', manage: false },
      { route: '/ja/articles/manage?level=N5', level: 'N5' as const, name: 'ja-article-manage', manage: true },
      { route: '/ja/vocabulary', level: 'N5' as const, name: 'ja-vocabulary-library', manage: false },
      { route: '/ja/vocabulary/manage?level=N5', level: 'N5' as const, name: 'ja-vocabulary-manage', manage: true },
      { route: '/en/dialogues', level: 'A1' as const, name: 'en-dialogue-library', manage: false },
      { route: '/en/dialogues/manage?level=A1', level: 'A1' as const, name: 'en-dialogue-manage', manage: true },
      { route: '/en/vocabulary', level: 'A1' as const, name: 'en-vocabulary-library', manage: false },
      { route: '/en/vocabulary/manage?level=A1', level: 'A1' as const, name: 'en-vocabulary-manage', manage: true },
    ]) {
      await verifyLibraryRoute({
        page,
        testInfo,
        route: target.route,
        level: target.level,
        screenshotName: `${width}-${theme}-${target.name}`,
        manage: target.manage,
      })
    }

    for (const mode of ['japanese-article', 'japanese-vocabulary', 'english-dialogue', 'english-vocabulary'] as const) {
      await verifyTypingRoute({ page, testInfo, mode, screenshotName: `${width}-${theme}-${mode}-typing` })
    }
  })
}
