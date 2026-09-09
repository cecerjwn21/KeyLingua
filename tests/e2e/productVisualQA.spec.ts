import { expect, test } from '@playwright/test'

const expectNoHorizontalOverflow = async (page: import('@playwright/test').Page) => {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
}

test('Japanese 逐頁 visual QA：Library、列表、匯入、Typing、ResultScreen 與 Vocabulary', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('isOpenDarkModeAtom') === null) {
      localStorage.setItem('isOpenDarkModeAtom', JSON.stringify(false))
    }
    if (localStorage.getItem('productVisualQASeeded') === '1') return
    localStorage.setItem(
      'pastedPracticeDocuments',
      JSON.stringify([
        {
          id: 'product-visual-article',
          title: 'N4｜車站與日常情境的長標題文章',
          source: 'manual',
          language: 'ja',
          jlptLevel: 'N4',
          scenario: '車站',
          sentences: [{ name: '猫。', notation: '猫(ねこ)。', trans: ['貓。'] }],
        },
      ]),
    )
    localStorage.setItem(
      'vocabularyLibrary',
      JSON.stringify({
        version: 1,
        sets: [{ id: 'product-visual-vocabulary', title: 'N5｜日常生活單字', jlptLevel: 'N5', createdAt: '2026-08-27T00:00:00.000Z' }],
        items: [{ id: 'product-visual-word', setId: 'product-visual-vocabulary', jlptLevel: 'N5', word: '猫', reading: 'ねこ', meaning: '貓', source: 'manual' }],
      }),
    )
    localStorage.removeItem('practiceDocumentId')
    localStorage.removeItem('currentVocabularySetId')
    localStorage.removeItem('practiceSource')
    localStorage.setItem('productVisualQASeeded', '1')
  })
  await page.setViewportSize({ width: 1366, height: 768 })

  await page.goto('/ja/articles')
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: testInfo.outputPath('japanese-article-library-light.png'), fullPage: true })

  await page.getByRole('button', { name: /^N4/ }).click()
  await expect(page.getByText('N4｜車站與日常情境的長標題文章', { exact: true })).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: testInfo.outputPath('japanese-article-list-light.png'), fullPage: true })

  await page.getByRole('button', { name: '匯入文章' }).click()
  await expect(page.getByRole('heading', { name: '匯入文章' })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('japanese-import-dialog-light.png') })
  await page.keyboard.press('Escape')

  await page.getByTestId('article-card-product-visual-article').getByRole('button', { name: '開始練習' }).click()
  await expect(page).toHaveURL(/\/typing$/)
  await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 1 / 1')
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: testInfo.outputPath('japanese-article-typing-light.png'), fullPage: true })

  await page.getByRole('button', { name: '繼續' }).click()
  await page.keyboard.type('neko.')
  await expect(page.getByTestId('article-result-screen')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('japanese-article-result-light.png'), fullPage: true })

  await page.goto('/ja/vocabulary')
  await page.getByRole('button', { name: /^N5/ }).click()
  await expect(page.getByText('N5｜日常生活單字', { exact: true })).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: testInfo.outputPath('japanese-vocabulary-set-light.png'), fullPage: true })

  await page.getByTestId('vocabulary-set-card').getByRole('button', { name: '開始練習' }).click()
  await expect(page.getByRole('heading', { name: '猫', exact: true })).toBeVisible()
  await page.evaluate(() => localStorage.setItem('isOpenDarkModeAtom', JSON.stringify(true)))
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expectNoHorizontalOverflow(page)
  await page.screenshot({ path: testInfo.outputPath('japanese-vocabulary-typing-dark.png'), fullPage: true })
})
