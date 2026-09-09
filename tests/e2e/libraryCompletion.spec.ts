import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const articleDocuments = Array.from({ length: 5 }, (_, index) => ({
  id: `completion-article-${index + 1}`,
  title: `N5｜完成狀態文章 ${index + 1}`,
  source: 'pasted' as const,
  language: 'ja' as const,
  jlptLevel: 'N5' as const,
  scenario: '完成狀態測試',
  sentences: [{ name: 'あ', notation: 'あ', trans: ['測試'] }],
}))

const japaneseVocabularyLibrary = {
  version: 1 as const,
  sets: [{ id: 'completion-ja-vocabulary', title: 'N5｜完成狀態單字', jlptLevel: 'N5' as const, createdAt: '2026-08-28T00:00:00.000Z' }],
  items: [
    {
      id: 'completion-ja-vocabulary-item',
      setId: 'completion-ja-vocabulary',
      jlptLevel: 'N5' as const,
      word: '亜',
      reading: 'あ',
      meaning: '測試',
    },
  ],
}

const englishDialogue = {
  id: 'completion-en-dialogue',
  title: 'A1｜Completion dialogue',
  level: 'A1' as const,
  source: 'manual' as const,
  createdAt: '2026-08-28T00:00:00.000Z',
  sentences: [{ text: 'a', meaning: '測試' }],
}

const englishVocabularyLibrary = {
  version: 1 as const,
  sets: [
    { id: 'completion-en-vocabulary', title: 'A1｜Completion vocabulary', level: 'A1' as const, createdAt: '2026-08-28T00:00:00.000Z' },
  ],
  items: [{ id: 'completion-en-vocabulary-item', setId: 'completion-en-vocabulary', word: 'a', meaning: '測試' }],
}

const seedStorage = async (page: Page, values: Record<string, unknown>) => {
  await page.goto('/')
  await page.evaluate((entries) => {
    localStorage.clear()
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, JSON.stringify(value))
  }, values)
}

const openLevel = async (page: Page, route: string, level: 'N5' | 'A1') => {
  await page.goto(route)
  await page.getByRole('button', { name: new RegExp(`^${level}`) }).click()
}

const finishCurrentPractice = async (page: Page) => {
  await page.getByRole('button', { name: '繼續' }).click()
  await page.keyboard.press('a')
}

const expectCompletedCard = async (card: ReturnType<Page['locator']>) => {
  await expect(card).toHaveAttribute('data-completed', 'true')
  await expect(card.getByTestId('library-completion-status')).toContainText('已完成')
  await expect(card.getByTestId('library-completion-status')).toContainText('完成 1/1')
}

test.describe('Library completion persistence', () => {
  test('Japanese Article 完整進入 ResultScreen 後返回與 refresh 仍顯示 completed', async ({ page }) => {
    await seedStorage(page, { pastedPracticeDocuments: articleDocuments.slice(0, 2) })
    await openLevel(page, '/ja/articles', 'N5')

    const completedCard = page.getByTestId(`article-card-${articleDocuments[1].id}`)
    await completedCard.getByRole('button', { name: '開始練習' }).click()
    await finishCurrentPractice(page)
    await expect(page.getByTestId('article-result-screen')).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('libraryCompletion') ?? '{}')))
      .toMatchObject({ [`japanese:article:${articleDocuments[1].id}`]: true })

    await page.getByRole('button', { name: '返回文章庫' }).click()
    await page.getByRole('button', { name: /^N5/ }).click()
    await expectCompletedCard(page.getByTestId(`article-card-${articleDocuments[1].id}`))

    await page.reload()
    await expectCompletedCard(page.getByTestId(`article-card-${articleDocuments[1].id}`))
  })

  test('Japanese Article 未完成 session 返回 Library 不得標記 completed', async ({ page }) => {
    await seedStorage(page, { pastedPracticeDocuments: articleDocuments.slice(0, 1) })
    await openLevel(page, '/ja/articles', 'N5')

    const card = page.getByTestId(`article-card-${articleDocuments[0].id}`)
    await card.getByRole('button', { name: '開始練習' }).click()
    await page.getByRole('button', { name: '繼續' }).click()
    await page.getByRole('link', { name: '返回文章庫' }).click()
    await page.getByRole('button', { name: /^N5/ }).click()

    await expect(page.getByTestId(`article-card-${articleDocuments[0].id}`)).toHaveAttribute('data-completed', 'false')
    await expect(page.getByTestId(`article-card-${articleDocuments[0].id}`).getByText('已完成', { exact: true })).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('libraryCompletion'))).toBeNull()
  })

  test('Japanese Vocabulary 完成後顯示 completed', async ({ page }) => {
    await seedStorage(page, { vocabularyLibrary: japaneseVocabularyLibrary })
    await openLevel(page, '/ja/vocabulary', 'N5')
    const card = page.getByTestId('vocabulary-set-card').filter({ hasText: japaneseVocabularyLibrary.sets[0].title })
    await card.getByRole('button', { name: '開始練習' }).click()
    await finishCurrentPractice(page)
    await page.getByRole('button', { name: '返回單字庫' }).click()
    await page.getByRole('button', { name: /^N5/ }).click()
    await expectCompletedCard(page.getByTestId('vocabulary-set-card').filter({ hasText: japaneseVocabularyLibrary.sets[0].title }))
  })

  test('English Dialogue 完成後顯示 completed', async ({ page }) => {
    await seedStorage(page, { englishPracticeDocuments: [englishDialogue] })
    await openLevel(page, '/en/dialogues', 'A1')
    const card = page.getByTestId(`english-dialogue-card-${englishDialogue.id}`)
    await card.getByRole('button', { name: '開始練習' }).click()
    await finishCurrentPractice(page)
    await page.getByRole('button', { name: '返回英文對話庫' }).click()
    await page.getByRole('button', { name: /^A1/ }).click()
    await expectCompletedCard(page.getByTestId(`english-dialogue-card-${englishDialogue.id}`))
  })

  test('English Vocabulary 完成後顯示 completed', async ({ page }) => {
    await seedStorage(page, { englishVocabularyLibrary })
    await openLevel(page, '/en/vocabulary', 'A1')
    const card = page.getByTestId(`english-vocabulary-card-${englishVocabularyLibrary.sets[0].id}`)
    await card.getByRole('button', { name: '開始練習' }).click()
    await finishCurrentPractice(page)
    await page.getByRole('button', { name: '返回英文單字庫' }).click()
    await page.getByRole('button', { name: /^A1/ }).click()
    await expectCompletedCard(page.getByTestId(`english-vocabulary-card-${englishVocabularyLibrary.sets[0].id}`))
  })

  test('刪除其他 card 後 completion identity 不會錯位', async ({ page }) => {
    await seedStorage(page, {
      pastedPracticeDocuments: articleDocuments.slice(0, 2),
      libraryCompletion: { [`japanese:article:${articleDocuments[1].id}`]: true },
    })
    await page.goto('/ja/articles/manage?level=N5')

    await page.getByTestId(`article-card-${articleDocuments[0].id}`).getByRole('button', { name: '刪除' }).click()
    await page.getByRole('button', { name: '確認刪除' }).click()

    await expect(page.getByTestId(`article-card-${articleDocuments[0].id}`)).toHaveCount(0)
    await page.getByRole('link', { name: '返回文章庫' }).click()
    await expectCompletedCard(page.getByTestId(`article-card-${articleDocuments[1].id}`))
  })
})

test.describe('Library completion card interaction', () => {
  test.beforeEach(async ({ page }) => {
    await seedStorage(page, {
      pastedPracticeDocuments: articleDocuments,
      libraryCompletion: Object.fromEntries(articleDocuments.slice(0, 3).map((document) => [`japanese:article:${document.id}`, true])),
    })
    await openLevel(page, '/ja/articles', 'N5')
  })

  test('hover 只啟動目前 completed card，其他 completed card 保持靜止', async ({ page }) => {
    const first = page.getByTestId(`article-card-${articleDocuments[0].id}`)
    const second = page.getByTestId(`article-card-${articleDocuments[1].id}`)
    await first.hover()

    await expect(first.getByTestId('library-completion-sparkles')).toHaveCSS('opacity', '1')
    await expect(second.getByTestId('library-completion-sparkles')).toHaveCSS('opacity', '0')
    await page.waitForTimeout(500)
    await expect(first.getByTestId('library-completion-sparkles')).toHaveCSS('opacity', '1')

    await second.hover()
    await expect(first.getByTestId('library-completion-sparkles')).toHaveCSS('opacity', '0')
    await expect(second.getByTestId('library-completion-sparkles')).toHaveCSS('opacity', '1')

    await page.mouse.move(0, 0)
    await expect(second.getByTestId('library-completion-sparkles')).toHaveCSS('opacity', '0')
  })

  test('prefers-reduced-motion 下不播放動畫，但 completed card hover 仍提供靜態回饋', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const card = page.getByTestId(`article-card-${articleDocuments[0].id}`)
    await card.hover()

    await expect(card.getByTestId('library-completion-icon')).toHaveCSS('animation-name', 'none')
    await expect(card.getByTestId('library-completion-sparkles')).toHaveCSS('opacity', '1')
  })

  test('顯示 3 / 5 篇總完成進度且 incomplete card 維持低調', async ({ page }) => {
    await expect(page.getByTestId('library-completion-progress')).toHaveText('完成進度：3 / 5 篇')
    await expect(page.getByTestId(`article-card-${articleDocuments[3].id}`)).toHaveAttribute('data-completed', 'false')
    await expect(page.getByTestId(`article-card-${articleDocuments[3].id}`).getByTestId('library-completion-sparkles')).toHaveCount(0)
  })

  test('completed chip 是 CTA 右側的附加狀態，未完成卡不保留空白 slot', async ({ page }) => {
    const completedCard = page.getByTestId(`article-card-${articleDocuments[0].id}`)
    const incompleteCard = page.getByTestId(`article-card-${articleDocuments[3].id}`)
    const [completedCta, completionStatus, incompleteCta] = await Promise.all([
      completedCard.getByRole('button', { name: '開始練習' }).boundingBox(),
      completedCard.getByTestId('library-completion-status').boundingBox(),
      incompleteCard.getByRole('button', { name: '開始練習' }).boundingBox(),
    ])

    expect(completedCta?.x).toBe(incompleteCta?.x)
    expect((completionStatus?.x ?? 0) - ((completedCta?.x ?? 0) + (completedCta?.width ?? 0))).toBe(8)
    await expect(incompleteCard.locator('.library-completion-status')).toHaveCount(0)

    await page.goto('/ja/articles/manage?level=N5')
    const manageCard = page.getByTestId(`article-card-${articleDocuments[0].id}`)
    const manageControls = [manageCard.getByRole('button', { name: '刪除' }), manageCard.getByRole('button', { name: '編輯' })]
    const manageBoxes = await Promise.all(manageControls.map((control) => control.boundingBox()))

    for (const box of manageBoxes) {
      expect(box?.width).toBe(112)
      expect(box?.height).toBe(40)
    }
    expect((manageBoxes[1]?.x ?? 0) - ((manageBoxes[0]?.x ?? 0) + (manageBoxes[0]?.width ?? 0))).toBe(8)
    expect(manageBoxes[0]?.y ?? 0).toBe(manageBoxes[1]?.y)
  })
})
