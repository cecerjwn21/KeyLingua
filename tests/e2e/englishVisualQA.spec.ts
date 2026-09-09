import { expect, test } from '@playwright/test'

const longTitle = 'A1｜餐廳、飯店與機場情境的超長英文對話標題，用來確認繁體中文與 English title 在窄畫面安全換行'
const longMeaning = '這是一段刻意拉長的繁體中文翻譯，用來確認文字不會跑出容器、壓住按鈕或造成水平方向溢位。'

const seedVisualContent = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(
    ({ title, meaning }) => {
      if (localStorage.getItem('isOpenDarkModeAtom') === null) {
        localStorage.setItem('isOpenDarkModeAtom', JSON.stringify(false))
      }
      localStorage.setItem(
        'englishPracticeDocuments',
        localStorage.getItem('englishVisualQAMode') === 'empty'
          ? JSON.stringify([])
          : JSON.stringify([
          {
            id: 'english-visual-dialogue',
            title,
            level: 'A1',
            source: 'manual',
            createdAt: '2026-08-26T00:00:00.000Z',
            sentences: [{ text: 'Hello!', meaning }],
          },
            ]),
      )
      localStorage.setItem(
        'englishVocabularyLibrary',
        JSON.stringify({
          version: 1,
          sets: [{ id: 'english-visual-set', title: `${title} VocabularySet`, level: 'A1', createdAt: '2026-08-26T00:00:00.000Z' }],
          items: [
            { id: 'english-visual-item-1', setId: 'english-visual-set', word: 'reservation', meaning, source: 'manual' },
            { id: 'english-visual-item-2', setId: 'english-visual-set', word: 'extraordinarily-long-hyphenated-vocabulary-word', meaning, source: 'manual' },
          ],
        }),
      )
      localStorage.setItem('englishPracticeDocumentId', JSON.stringify('english-visual-dialogue'))
      localStorage.setItem('englishVocabularySetId', JSON.stringify(null))
      localStorage.setItem('practiceSource', JSON.stringify({ language: 'english', practiceType: 'dialogue', id: 'english-visual-dialogue' }))
    },
    { title: longTitle, meaning: longMeaning },
  )
}

const expectNoHorizontalOverflow = async (page: import('@playwright/test').Page) => {
  const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }))
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
}

test.describe('English Chromium visual QA', () => {
  test.describe.configure({ timeout: 180_000 })

  test('1366px light/dark：Library、Manage、Typing、dropdown 與 ResultScreen', async ({ page }, testInfo) => {
    await seedVisualContent(page)
    await page.setViewportSize({ width: 1366, height: 768 })

    await page.goto('/en/dialogues')
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('dialogue-cefr-light.png'), fullPage: true })

    await page.goto('/ja/articles')
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('japanese-article-jlpt-light.png'), fullPage: true })

    await page.goto('/ja/vocabulary')
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('japanese-vocabulary-jlpt-light.png'), fullPage: true })

    await page.goto('/en/dialogues')
    await page.getByRole('button', { name: /A1/ }).click()
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('dialogue-list-light.png'), fullPage: true })

    await page.goto('/en/vocabulary')
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('vocabulary-cefr-light.png'), fullPage: true })
    await page.getByRole('button', { name: /A1/ }).click()
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('vocabulary-list-light.png'), fullPage: true })

    await page.goto('/en/dialogues/manage')
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('dialogue-manage-light.png'), fullPage: true })

    await page.goto('/en/typing')
    await expect(page.getByTestId('practice-english-display')).toHaveText('Hello!')
    await expectNoHorizontalOverflow(page)
    await page.getByRole('button', { name: '音效' }).click()
    await expect(page.getByLabel('按鍵音色')).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath('typing-dropdown-light.png') })
    await page.keyboard.press('Escape')
    await expect(page.getByLabel('按鍵音色')).toBeHidden()

    await page.getByRole('button', { name: '繼續' }).click()
    await page.keyboard.press('Shift+H')
    await page.keyboard.type('ello')
    await page.keyboard.press('Shift+1')
    await expect(page.getByTestId('english-dialogue-result-screen')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('result-light.png') })

    await page.evaluate(() => localStorage.setItem('isOpenDarkModeAtom', JSON.stringify(true)))
    await page.reload()
    await expect(page.getByTestId('practice-english-display')).toBeVisible()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('typing-dark.png') })

    await page.goto('/en/dialogues')
    await page.getByRole('button', { name: /A1/ }).click()
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('dialogue-list-dark.png'), fullPage: true })

    await page.goto('/en/vocabulary')
    await page.getByRole('button', { name: /A1/ }).click()
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('vocabulary-list-dark.png'), fullPage: true })

    await page.goto('/en/dialogues/manage')
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('dialogue-manage-dark.png'), fullPage: true })

    await page.goto('/ja/articles')
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('japanese-article-jlpt-dark.png'), fullPage: true })

    await page.goto('/ja/vocabulary')
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('japanese-vocabulary-jlpt-dark.png'), fullPage: true })

    await page.goto('/en/typing')
    await page.getByRole('button', { name: '繼續' }).click()
    await page.keyboard.press('Shift+H')
    await page.keyboard.type('ello')
    await page.keyboard.press('Shift+1')
    await expect(page.getByTestId('english-dialogue-result-screen')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('result-dark.png') })
  })

  test('820px：長字串、Header 換行與 empty states 不溢位', async ({ page }, testInfo) => {
    await seedVisualContent(page)
    await page.setViewportSize({ width: 820, height: 760 })

    await page.goto('/en/dialogues/manage')
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('dialogue-manage-narrow.png'), fullPage: true })

    await page.goto('/ja/articles')
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('japanese-article-jlpt-narrow.png'), fullPage: true })

    await page.goto('/ja/vocabulary')
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('japanese-vocabulary-jlpt-narrow.png'), fullPage: true })

    await page.goto('/en/typing')
    await expect(page).toHaveURL(/\/en\/typing$/)
    await expect(page.getByTestId('practice-english-display')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('typing-narrow.png'), fullPage: true })

    await page.evaluate(() => localStorage.setItem('englishVisualQAMode', 'empty'))
    await page.goto('/en/dialogues/manage')
    await expect(page.getByText('目前沒有英文對話')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('dialogue-empty-narrow.png'), fullPage: true })

    await page.evaluate(() => localStorage.setItem('isOpenDarkModeAtom', JSON.stringify(true)))
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByText('目前沒有英文對話')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('dialogue-empty-narrow-dark.png'), fullPage: true })
  })

  test('1920px 與手機寬度：正式 Library、練習設定與默寫狀態不溢位', async ({ page }, testInfo) => {
    await seedVisualContent(page)
    await page.setViewportSize({ width: 1920, height: 1080 })

    await page.goto('/en/dialogues')
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('dialogue-library-1920-light.png'), fullPage: true })

    await page.goto('/en/typing')
    await page.getByRole('button', { name: '練習設定' }).click()
    await expect(page.getByRole('dialog', { name: '練習設定' })).toBeVisible()
    await page.getByRole('switch', { name: '默寫模式' }).click()
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('typing-settings-1920-light.png'), fullPage: true })

    await page.keyboard.press('Escape')
    await page.evaluate(() => localStorage.setItem('isOpenDarkModeAtom', JSON.stringify(true)))
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByTestId('dictation-prompt')).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('typing-dictation-1920-dark.png'), fullPage: true })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.evaluate(() => {
      localStorage.setItem('isOpenDarkModeAtom', JSON.stringify(false))
      localStorage.setItem('wordDictationConfig', JSON.stringify({ isOpen: false, type: 'hideAll' }))
    })
    await page.goto('/en/dialogues')
    await expect(page).toHaveURL(/\/en\/dialogues$/)
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('dialogue-library-mobile-light.png'), fullPage: true })

    await page.goto('/en/typing')
    await page.getByRole('button', { name: '練習設定' }).click()
    await expect(page.getByRole('dialog', { name: '練習設定' })).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('typing-settings-mobile-light.png'), fullPage: true })

    await page.keyboard.press('Escape')
    await page.evaluate(() => localStorage.setItem('isOpenDarkModeAtom', JSON.stringify(true)))
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath('typing-mobile-dark.png'), fullPage: true })
  })
})
