import { expect, test } from '@playwright/test'

const chatGPTImportJson = JSON.stringify({
  title: '居酒屋裡的第一次聊天',
  jlptLevel: 'N4',
  scenario: 'izakaya',
  sentences: [
    { name: 'おすすめの料理はありますか。', notation: 'おすすめの料理(りょうり)はありますか。', trans: ['有推薦的料理嗎？'] },
    { name: 'これは人気の料理です。', notation: 'これは人気(にんき)の料理(りょうり)です。', trans: ['這是很受歡迎的料理。'] },
    { name: 'ありがとうございます。', notation: 'ありがとうございます。', trans: ['謝謝您。'] },
  ],
})

const n5DialogueImportJson = JSON.stringify({
  title: 'N5 車站對話',
  jlptLevel: 'N5',
  scenario: '車站問路',
  format: 'dialogue',
  sentences: Array.from({ length: 13 }, (_, index) => ({
    name: `これは${index + 1}番目です。`,
    notation: `これは${index + 1}番目(ばんめ)です。`,
    trans: [`這是第 ${index + 1} 句。`],
  })),
})

const saveChatGPTArticle = async (page: import('@playwright/test').Page, json: string) => {
  await page.getByRole('button', { name: '匯入文章' }).click()
  await page.getByLabel('文章 JSON').fill(json)
  await page.getByRole('button', { name: '驗證文章' }).click()
  await expect(page.getByText('文章驗證成功', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '匯入文章' }).last().click()
  const n4Level = page.getByRole('button', { name: /^N4/ })
  if (await n4Level.isVisible()) await n4Level.click()
}

test.describe('Article Library', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('practiceDocumentId')
      localStorage.removeItem('pastedPracticeDocuments')
      localStorage.removeItem('chatGPTPracticeDocumentIds')
    })
    await page.reload()
  })

  test('首頁只顯示固定 JLPT 分類與零篇數，不呈現內建文章', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '文章庫' })).toBeVisible()
    await expect(page.getByText('選擇 JLPT 等級', { exact: true })).toBeVisible()
    for (const level of ['N5', 'N4', 'N3', 'N2', 'N1']) {
      await expect(page.getByRole('button', { name: new RegExp(`^${level}`) })).toContainText('0 篇文章')
    }
    await expect(page.getByRole('button', { name: '匯入文章' })).toBeVisible()
    await expect(page.getByTestId('practice-romaji-typing-row')).toHaveCount(0)
    await expect(page.getByText('內建文章', { exact: true })).toHaveCount(0)
    await expect(page.getByText('第一次到日本旅行', { exact: true })).toHaveCount(0)
    await expect(page.getByText('居酒屋的晚餐', { exact: true })).toHaveCount(0)
    await expect(page.getByText('旅途中和陌生人閒聊', { exact: true })).toHaveCount(0)
  })

  test('Article 與 Vocabulary 的 JLPT cards 使用同一套視覺規格', async ({ page }) => {
    const readCardStyle = async (route: string) => {
      await page.goto(route)
      const card = page.getByRole('button', { name: /^N5/ })
      const title = card.getByText('N5', { exact: true })
      return {
        card: await card.evaluate((element) => {
          const style = getComputedStyle(element)
          return {
            padding: style.padding,
            borderRadius: style.borderRadius,
            borderWidth: style.borderWidth,
          }
        }),
        titleFontSize: await title.evaluate((element) => getComputedStyle(element).fontSize),
        gridGap: await card.locator('..').evaluate((element) => getComputedStyle(element).gap),
      }
    }

    const articleStyle = await readCardStyle('/ja/articles')
    const vocabularyStyle = await readCardStyle('/ja/vocabulary')
    expect(articleStyle).toEqual(vocabularyStyle)
  })

  test('direct typing route without a valid article redirects to the Library', async ({ page }) => {
    await page.goto('/typing')
    await expect(page).toHaveURL(/\/ja\/articles$/)
    await expect(page.getByRole('heading', { name: '文章庫' })).toBeVisible()
  })

  test('invalid persisted article id redirects to the Library', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('practiceDocumentId', JSON.stringify('missing-document')))
    await page.goto('/typing')
    await expect(page).toHaveURL(/\/ja\/articles$/)
    await expect(page.getByRole('heading', { name: '文章庫' })).toBeVisible()
  })

  test('正式 Article Library 不恢復已移除的自由貼上入口', async ({ page }) => {
    await expect(page.getByRole('button', { name: '貼上自己的文章' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '匯入文章' })).toBeVisible()
  })

  test('單篇 JSON 會依 jlptLevel 保存、分類並在 reload 後存在', async ({ page }) => {
    await page.getByRole('button', { name: '匯入文章' }).click()
    await page.getByLabel('文章 JSON').fill(chatGPTImportJson)
    await page.getByRole('button', { name: '驗證文章' }).click()
    await expect(page.getByText('文章驗證成功', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '匯入文章' }).last().click()

    await expect(page).toHaveURL(/\/$/)
    await page.getByRole('button', { name: /^N4/ }).click()
    await expect(page.getByText('居酒屋裡的第一次聊天', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page).toHaveURL(/\?level=N4$/)
    await expect(page.getByText('居酒屋裡的第一次聊天', { exact: true })).toBeVisible()

    const card = page.locator('[data-testid^="article-card-generated-"]').filter({ hasText: '居酒屋裡的第一次聊天' })
    await card.getByRole('button', { name: '開始練習' }).click()
    await expect(page).toHaveURL(/\/typing$/)
    await expect(page.getByTestId('practice-article-title')).toHaveText('居酒屋裡的第一次聊天')
  })

  test('分類頁只呈現對應 JLPT 的我的文章，且卡片不顯示 dialogue', async ({ page }) => {
    await page.getByRole('button', { name: '匯入文章' }).click()
    await page.getByLabel('文章 JSON').fill(n5DialogueImportJson)
    await page.getByRole('button', { name: '驗證文章' }).click()
    await expect(page.getByText('文章驗證成功', { exact: true })).toBeVisible()
    await expect(page.getByText('程度：N5', { exact: true })).toBeVisible()
    await expect(page.getByText('句數：13', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '匯入文章' }).last().click()

    await page.getByRole('button', { name: /^N5/ }).click()
    const card = page.locator('[data-testid^="article-card-generated-"]').filter({ hasText: 'N5 車站對話' })
    await expect(card).toBeVisible()
    await expect(card.getByText('dialogue', { exact: true })).toHaveCount(0)
    await card.getByRole('button', { name: '開始練習' }).click()
    await expect(page).toHaveURL(/\/typing$/)
    await expect(page.getByTestId('practice-article-title')).toHaveText('N5 車站對話')
  })

  test('空分類顯示空狀態並可返回文章庫', async ({ page }) => {
    await page.getByRole('button', { name: /^N3/ }).click()
    await expect(page.getByRole('heading', { name: 'N3 對話文章' })).toBeVisible()
    await expect(page.getByText('目前沒有 N3 文章', { exact: true })).toBeVisible()
    const backButton = page.getByTestId('library-back-button')
    await expect(backButton).toHaveText('返回文章庫')
    await backButton.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByText('選擇 JLPT 等級', { exact: true })).toBeVisible()
  })

  test('JSON array 批次匯入會原子保存並自動分到各 JLPT', async ({ page }) => {
    const n5 = { ...JSON.parse(n5DialogueImportJson), title: 'N5 批次文章' }
    const n4 = { ...JSON.parse(chatGPTImportJson), title: 'N4 批次文章' }
    const n3 = { ...JSON.parse(chatGPTImportJson), title: 'N3 批次文章', jlptLevel: 'N3' }
    await page.getByRole('button', { name: '匯入文章' }).click()
    await page.getByLabel('文章 JSON').fill(JSON.stringify([n5, n4, n3]))
    await page.getByRole('button', { name: '驗證文章' }).click()
    await expect(page.getByText('已驗證 3 篇文章', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '匯入文章' }).last().click()
    await expect(page.getByText('已匯入 3 篇文章', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /^N3/ }).click()
    await expect(page.getByText('N3 批次文章', { exact: true })).toBeVisible()
    await expect(page.getByText('N4 批次文章', { exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: '返回文章庫' }).click()
    await expect(page.getByRole('button', { name: /^N5/ })).toContainText('1 篇文章')
    await expect(page.getByRole('button', { name: /^N4/ })).toContainText('1 篇文章')
    await expect(page.getByRole('button', { name: /^N3/ })).toContainText('1 篇文章')
    await page.reload()
    await page.getByRole('button', { name: /^N4/ }).click()
    await expect(page.getByText('N4 批次文章', { exact: true })).toBeVisible()
  })

  test('多檔批次匯入遇到第 2 篇無效文章時不寫入任何文章', async ({ page }) => {
    await page.getByRole('button', { name: '匯入文章' }).click()
    await page.getByLabel('選擇 JSON 檔案').setInputFiles([
      { name: 'n4.json', mimeType: 'application/json', buffer: Buffer.from(chatGPTImportJson) },
      { name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{ invalid') },
      { name: 'n5.json', mimeType: 'application/json', buffer: Buffer.from(n5DialogueImportJson) },
    ])
    await page.getByRole('button', { name: '驗證文章' }).click()
    await expect(page.getByRole('alert')).toContainText('第 2 篇文章格式錯誤')
    await expect(page.getByText('居酒屋裡的第一次聊天', { exact: true })).toHaveCount(0)
    await expect(page.getByText('N5 車站對話', { exact: true })).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('pastedPracticeDocuments') ?? '[]'))).toEqual([])
  })

  test('文章管理頁顯示編輯與刪除，編輯會驗證後以原 id 覆寫並持久化', async ({ page }) => {
    await saveChatGPTArticle(page, chatGPTImportJson)
    await page.goto('/ja/articles/manage?level=N4')

    const myCard = page.locator('[data-testid^="article-card-generated-"]').filter({ hasText: '居酒屋裡的第一次聊天' })
    await expect(myCard.getByRole('button', { name: '編輯' })).toBeVisible()
    await expect(myCard.getByRole('button', { name: '刪除' })).toBeVisible()
    await expect(page.getByTestId('article-card-japanese-travel-n4').getByRole('button', { name: '編輯' })).toHaveCount(0)
    await expect(page.getByTestId('article-card-japanese-travel-n4').getByRole('button', { name: '刪除' })).toHaveCount(0)

    await myCard.getByRole('button', { name: '編輯' }).click()
    const editor = page.getByLabel('文章 JSON')
    const editedDocument = {
      ...JSON.parse(chatGPTImportJson),
      title: '居酒屋裡的更新對話',
      sentences: [
        { name: '予約をお願いします。', notation: '予約(よやく)をお願(ねが)いします。', trans: ['我想預約。'] },
        { name: '何名様ですか。', notation: '何名様(なんめいさま)ですか。', trans: ['請問幾位？'] },
        { name: '二人です。', notation: '二人(ふたり)です。', trans: ['兩位。'] },
      ],
    }
    await editor.fill(JSON.stringify(editedDocument))
    await page.getByRole('button', { name: '驗證文章' }).click()
    await expect(page.getByText('文章驗證成功', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '儲存變更' }).click()

    await expect(page.getByText('居酒屋裡的更新對話', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('居酒屋裡的更新對話', { exact: true })).toBeVisible()
    await page.goto('/ja/articles')
    await page.getByRole('button', { name: /^N4/ }).click()
    const updatedCard = page.locator('[data-testid^="article-card-generated-"]').filter({ hasText: '居酒屋裡的更新對話' })
    await expect(updatedCard).toBeVisible()
    await updatedCard.getByRole('button', { name: '開始練習' }).click()
    await expect(page.getByTestId('practice-article-title')).toHaveText('居酒屋裡的更新對話')
    await expect(page.getByTestId('practice-japanese-display')).toContainText('予約')
  })

  test('無效編輯不覆寫原文章，取消刪除保留文章，刪除 current 後 route guard 導回文章庫', async ({ page }) => {
    await saveChatGPTArticle(page, chatGPTImportJson)
    await saveChatGPTArticle(page, n5DialogueImportJson)
    await page.goto('/ja/articles/manage?level=N4')
    const myCard = page.locator('[data-testid^="article-card-generated-"]').filter({ hasText: '居酒屋裡的第一次聊天' })
    await myCard.getByRole('button', { name: '編輯' }).click()
    await page.getByLabel('文章 JSON').fill('{ invalid')
    await page.getByRole('button', { name: '驗證文章' }).click()
    await expect(page.getByRole('alert')).toHaveText('無法讀取文章格式，請確認貼上的是 ChatGPT 產生的 JSON。')
    await page.getByRole('button', { name: '取消' }).click()
    await expect(myCard).toBeVisible()
    await page.reload()
    await expect(myCard).toBeVisible()

    await page.goto('/ja/articles')
    await page.getByRole('button', { name: /^N4/ }).click()
    await myCard.getByRole('button', { name: '開始練習' }).click()
    await expect(page).toHaveURL(/\/typing$/)
    await page.goto('/ja/articles/manage?level=N4')
    await myCard.getByRole('button', { name: '刪除' }).click()
    await expect(page.getByText('確定要刪除這篇文章嗎？', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '取消' }).click()
    await expect(myCard).toBeVisible()

    await myCard.getByRole('button', { name: '刪除' }).click()
    await page.getByRole('button', { name: '確認刪除' }).click()
    await expect(myCard).toHaveCount(0)
    await page.getByRole('link', { name: '返回文章庫' }).click()
    await page.getByRole('button', { name: '返回文章庫' }).click()
    await page.getByRole('button', { name: /^N5/ }).click()
    await expect(page.getByText('N5 車站對話', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('居酒屋裡的第一次聊天', { exact: true })).toHaveCount(0)
    await expect(page).toHaveURL(/\?level=N5$/)
    await expect(page.getByText('N5 車站對話', { exact: true })).toBeVisible()
    await page.goto('/typing')
    await expect(page).toHaveURL(/\/ja\/articles$/)
  })
})
