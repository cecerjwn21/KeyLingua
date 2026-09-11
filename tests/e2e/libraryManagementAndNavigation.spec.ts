import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const article = {
  id: 'management-ja-article',
  title: 'N5｜管理模式文章',
  source: 'pasted',
  language: 'ja',
  jlptLevel: 'N5',
  scenario: '管理模式測試',
  sentences: [{ name: 'あ', notation: 'あ', trans: ['測試'] }],
}

const vocabularyLibrary = {
  version: 1,
  sets: [{ id: 'management-ja-vocabulary', title: 'N5｜管理模式單字', jlptLevel: 'N5', createdAt: '2026-08-28T00:00:00.000Z' }],
  items: [
    { id: 'management-ja-item-1', setId: 'management-ja-vocabulary', jlptLevel: 'N5', word: '亜', reading: 'あ', meaning: '測試一' },
    { id: 'management-ja-item-2', setId: 'management-ja-vocabulary', jlptLevel: 'N5', word: '伊', reading: 'い', meaning: '測試二' },
    { id: 'management-ja-item-3', setId: 'management-ja-vocabulary', jlptLevel: 'N5', word: '宇', reading: 'う', meaning: '測試三' },
  ],
}

const englishVocabularyLibrary = {
  version: 1,
  sets: [{ id: 'navigation-en-vocabulary', title: 'A1｜Navigation vocabulary', level: 'A1', createdAt: '2026-08-28T00:00:00.000Z' }],
  items: [
    { id: 'navigation-en-item-1', setId: 'navigation-en-vocabulary', word: 'a', meaning: '測試一' },
    { id: 'navigation-en-item-2', setId: 'navigation-en-vocabulary', word: 'b', meaning: '測試二' },
    { id: 'navigation-en-item-3', setId: 'navigation-en-vocabulary', word: 'c', meaning: '測試三' },
  ],
}

const navigationJapaneseVocabularyLibrary = {
  version: 1,
  sets: [{ id: 'navigation-ja-vocabulary', title: 'N5｜導覽 hit area', jlptLevel: 'N5', createdAt: '2026-08-28T00:00:00.000Z' }],
  items: [
    { id: 'navigation-ja-item-1', setId: 'navigation-ja-vocabulary', jlptLevel: 'N5', word: '短', reading: 'a', meaning: '短翻譯' },
    { id: 'navigation-ja-item-2', setId: 'navigation-ja-vocabulary', jlptLevel: 'N5', word: '中', reading: 'b', meaning: '中翻譯' },
    {
      id: 'navigation-ja-item-3',
      setId: 'navigation-ja-vocabulary',
      jlptLevel: 'N5',
      word: '長いナビゲーション項目の表示内容',
      reading: 'c',
      meaning: '很長的下一個項目翻譯內容',
    },
    { id: 'navigation-ja-item-4', setId: 'navigation-ja-vocabulary', jlptLevel: 'N5', word: '次', reading: 'd', meaning: '次翻譯' },
    { id: 'navigation-ja-item-5', setId: 'navigation-ja-vocabulary', jlptLevel: 'N5', word: '尾', reading: 'e', meaning: '尾翻譯' },
  ],
}

const navigationEnglishVocabularyLibrary = {
  version: 1,
  sets: [{ id: 'navigation-en-vocabulary', title: 'A1｜Navigation hit area', level: 'A1', createdAt: '2026-08-28T00:00:00.000Z' }],
  items: [
    { id: 'navigation-en-item-1', setId: 'navigation-en-vocabulary', word: 'a', meaning: 'Short translation' },
    { id: 'navigation-en-item-2', setId: 'navigation-en-vocabulary', word: 'b', meaning: 'Middle translation' },
    {
      id: 'navigation-en-item-3',
      setId: 'navigation-en-vocabulary',
      word: 'a deliberately long navigation vocabulary item',
      meaning: 'A deliberately long next-item translation',
    },
    { id: 'navigation-en-item-4', setId: 'navigation-en-vocabulary', word: 'd', meaning: 'Next translation' },
    { id: 'navigation-en-item-5', setId: 'navigation-en-vocabulary', word: 'e', meaning: 'Tail translation' },
  ],
}

const navigationEnglishDialogue = {
  id: 'navigation-en-dialogue',
  title: 'A2｜放學後計畫',
  level: 'A2',
  source: 'manual',
  createdAt: '2026-08-28T00:00:00.000Z',
  sentences: [
    { text: 'a', meaning: '短句' },
    { text: 'b', meaning: '目前句' },
    { text: 'What do you need to do there?', meaning: '很長的下一句翻譯內容' },
    { text: 'd', meaning: '短句' },
    { text: 'e', meaning: '尾句' },
  ],
}

const scopedArticles = [article, { ...article, id: 'management-ja-article-n4', title: 'N4｜不應出現在 N5 管理頁', jlptLevel: 'N4' }]

const scopedJapaneseVocabularyLibrary = {
  ...vocabularyLibrary,
  sets: [
    ...vocabularyLibrary.sets,
    { id: 'management-ja-vocabulary-n4', title: 'N4｜不應出現在 N5 管理頁', jlptLevel: 'N4', createdAt: '2026-08-28T00:00:00.000Z' },
  ],
}

const scopedEnglishDialogues = [
  {
    id: 'management-en-dialogue-a2',
    title: 'A2｜管理模式對話',
    level: 'A2',
    source: 'manual',
    createdAt: '2026-08-28T00:00:00.000Z',
    sentences: [{ text: 'a', meaning: '測試' }],
  },
  {
    id: 'management-en-dialogue-b1',
    title: 'B1｜不應出現在 A2 管理頁',
    level: 'B1',
    source: 'manual',
    createdAt: '2026-08-28T00:00:00.000Z',
    sentences: [{ text: 'b', meaning: '測試' }],
  },
]

const scopedEnglishVocabularyLibrary = {
  ...englishVocabularyLibrary,
  sets: [
    { ...englishVocabularyLibrary.sets[0], level: 'B1', title: 'B1｜管理模式單字' },
    { id: 'management-en-vocabulary-a2', title: 'A2｜不應出現在 B1 管理頁', level: 'A2', createdAt: '2026-08-28T00:00:00.000Z' },
  ],
}

const seedStorage = async (page: Page, values: Record<string, unknown>) => {
  await page.goto('/')
  await page.evaluate((entries) => {
    // 保留已提供的內建 ID，讓 fixture 表示使用者移除內建內容後的自訂題庫。
    const starterEntries = Object.entries(localStorage).filter(([key]) => key.startsWith('keylinguaStarter:'))
    localStorage.clear()
    for (const [key, value] of starterEntries) localStorage.setItem(key, value)
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, JSON.stringify(value))
  }, values)
}

test.describe('Japanese Library management parity', () => {
  test('Article 一般頁只顯示開始練習，管理頁才顯示編輯與刪除', async ({ page }) => {
    await seedStorage(page, { pastedPracticeDocuments: [article] })
    await page.goto('/ja/articles')
    await page.getByRole('button', { name: /^N5/ }).click()
    await expect(page.getByRole('link', { name: '管理' })).toHaveAttribute('href', '/ja/articles/manage?level=N5')

    const normalCard = page.getByTestId(`article-card-${article.id}`)
    await expect(normalCard.getByRole('button', { name: '開始練習' })).toBeVisible()
    await expect(normalCard.getByRole('button', { name: '編輯' })).toHaveCount(0)
    await expect(normalCard.getByRole('button', { name: '刪除' })).toHaveCount(0)

    await page.goto('/ja/articles/manage?level=N5')
    await expect(page.getByRole('heading', { name: '管理日文文章' })).toBeVisible()
    await expect(page.getByRole('link', { name: '返回文章庫' })).toHaveAttribute('href', '/ja/articles?level=N5')
    const manageCard = page.getByTestId(`article-card-${article.id}`)
    await expect(manageCard.getByRole('button', { name: '開始練習' })).toHaveCount(0)
    await expect(manageCard.getByRole('button', { name: '編輯' })).toBeVisible()
    await expect(manageCard.getByRole('button', { name: '刪除' })).toBeVisible()
  })

  test('Vocabulary 一般頁只顯示開始練習，管理頁才顯示編輯與刪除', async ({ page }) => {
    await seedStorage(page, { vocabularyLibrary })
    await page.goto('/ja/vocabulary')
    await page.getByRole('button', { name: /^N5/ }).click()
    await expect(page.getByRole('link', { name: '管理' })).toHaveAttribute('href', '/ja/vocabulary/manage?level=N5')

    const normalCard = page.getByTestId('vocabulary-set-card').filter({ hasText: vocabularyLibrary.sets[0].title })
    await expect(normalCard.getByRole('button', { name: '開始練習' })).toBeVisible()
    await expect(normalCard.getByRole('button', { name: '管理' })).toHaveCount(0)
    await expect(normalCard.getByRole('button', { name: '刪除題庫' })).toHaveCount(0)

    await page.goto('/ja/vocabulary/manage?level=N5')
    await expect(page.getByRole('heading', { name: '管理日文單字題庫' })).toBeVisible()
    await expect(page.getByRole('link', { name: '返回單字庫' })).toHaveAttribute('href', '/ja/vocabulary?level=N5')
    const manageCard = page.getByTestId('vocabulary-set-card').filter({ hasText: vocabularyLibrary.sets[0].title })
    await expect(manageCard.getByRole('button', { name: '開始練習' })).toHaveCount(0)
    await expect(manageCard.getByRole('button', { name: '編輯' })).toBeVisible()
    await expect(manageCard.getByRole('button', { name: '刪除' })).toBeVisible()

    await manageCard.getByRole('button', { name: '編輯' }).click()
    await expect(page.getByRole('heading', { name: vocabularyLibrary.sets[0].title })).toBeVisible()
    await expect(page.getByTestId('vocabulary-item-card')).toHaveCount(3)
  })

  test('English 既有一般頁與管理頁互動保持不變', async ({ page }) => {
    await seedStorage(page, { englishVocabularyLibrary })
    await page.goto('/en/vocabulary')
    await page.getByRole('button', { name: /^A1/ }).click()
    await expect(page.getByRole('link', { name: '管理' })).toHaveAttribute('href', '/en/vocabulary/manage?level=A1')
    await expect(
      page.getByTestId(`english-vocabulary-card-${englishVocabularyLibrary.sets[0].id}`).getByRole('button', { name: '開始練習' }),
    ).toBeVisible()

    await page.goto('/en/vocabulary/manage?level=A1')
    const manageCard = page.getByTestId(`english-vocabulary-card-${englishVocabularyLibrary.sets[0].id}`)
    await expect(manageCard.getByRole('button', { name: '編輯' })).toBeVisible()
    await expect(manageCard.getByRole('button', { name: '刪除' })).toBeVisible()
  })
})

test.describe('Library management level context', () => {
  test('四種 Library 從 level 進管理後，route、refresh 與返回都保留該 level', async ({ page }) => {
    await seedStorage(page, {
      pastedPracticeDocuments: scopedArticles,
      vocabularyLibrary: scopedJapaneseVocabularyLibrary,
      englishPracticeDocuments: scopedEnglishDialogues,
      englishVocabularyLibrary: scopedEnglishVocabularyLibrary,
    })

    for (const scenario of [
      {
        libraryRoute: '/ja/articles',
        level: 'N5',
        allowed: scopedArticles[0].title,
        excluded: scopedArticles[1].title,
        backLabel: '返回文章庫',
      },
      {
        libraryRoute: '/ja/vocabulary',
        level: 'N5',
        allowed: scopedJapaneseVocabularyLibrary.sets[0].title,
        excluded: scopedJapaneseVocabularyLibrary.sets[1].title,
        backLabel: '返回單字庫',
      },
      {
        libraryRoute: '/en/dialogues',
        level: 'A2',
        allowed: scopedEnglishDialogues[0].title,
        excluded: scopedEnglishDialogues[1].title,
        backLabel: '返回對話庫',
      },
      {
        libraryRoute: '/en/vocabulary',
        level: 'B1',
        allowed: scopedEnglishVocabularyLibrary.sets[0].title,
        excluded: scopedEnglishVocabularyLibrary.sets[1].title,
        backLabel: '返回單字庫',
      },
    ]) {
      await page.goto(scenario.libraryRoute)
      await page.getByRole('button', { name: new RegExp(`^${scenario.level}`) }).click()
      const manageLink = page.getByRole('link', { name: '管理' })
      await expect(manageLink).toHaveAttribute('href', new RegExp(`/manage\\?level=${scenario.level}$`))
      await manageLink.click()
      await expect(page.getByText(scenario.allowed, { exact: true })).toBeVisible()
      await expect(page.getByText(scenario.excluded, { exact: true })).toHaveCount(0)
      const manageCard = page.getByText(scenario.allowed, { exact: true }).locator('xpath=ancestor::article')
      const [deleteBox, editBox] = await Promise.all([
        manageCard.getByRole('button', { name: '刪除' }).boundingBox(),
        manageCard.getByRole('button', { name: '編輯' }).boundingBox(),
      ])
      expect(deleteBox).not.toBeNull()
      expect(editBox).not.toBeNull()
      expect(deleteBox!.y).toBe(editBox!.y)
      expect(editBox!.x - (deleteBox!.x + deleteBox!.width)).toBe(8)
      await page.reload()
      await expect(page.getByText(scenario.allowed, { exact: true })).toBeVisible()
      await page.getByRole('link', { name: scenario.backLabel }).click()
      await expect(page).toHaveURL(new RegExp(`${scenario.libraryRoute}\\?level=${scenario.level}$`))
      await expect(page.getByText(scenario.allowed, { exact: true })).toBeVisible()
    }
  })
})

test.describe('Typing previous and next contrast', () => {
  const expectHighContrastNavigation = async (page: Page) => {
    const previous = page.getByTestId('practice-prev-word')
    const next = page.getByTestId('practice-next-word')
    await expect(previous).toBeVisible()
    await expect(next).toBeVisible()
    await expect(previous).toHaveCSS('color', 'rgb(241, 245, 249)')
    await expect(next).toHaveCSS('color', 'rgb(241, 245, 249)')
    await expect(previous).toHaveCSS('opacity', '1')
    await expect(next).toHaveCSS('opacity', '1')
    await expect(previous).toHaveAttribute('aria-label', /^上一句，快捷鍵：.+/)
    await expect(next).toHaveAttribute('aria-label', /^下一句，快捷鍵：.+/)
    for (const control of [previous, next]) {
      await expect(control.getByText(/^(上一句|下一句)$/)).toBeVisible()
      await expect(control.getByText(/^(上一句|下一句)$/)).not.toHaveText('')
      const box = await control.boundingBox()
      expect(box).not.toBeNull()
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390)
    }
  }

  test('Japanese Vocabulary 與 English Vocabulary 共用高對比 prev / next button', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await seedStorage(page, { vocabularyLibrary, isOpenDarkModeAtom: true })
    await page.goto('/ja/vocabulary')
    await page.getByRole('button', { name: /^N5/ }).click()
    await page.getByTestId('vocabulary-set-card').getByRole('button', { name: '開始練習' }).click()
    await page.getByRole('button', { name: '繼續' }).click()
    await page.keyboard.press('a')
    await expectHighContrastNavigation(page)

    await seedStorage(page, { englishVocabularyLibrary, isOpenDarkModeAtom: true })
    await page.goto('/en/vocabulary')
    await page.getByRole('button', { name: /^A1/ }).click()
    await page
      .getByTestId(`english-vocabulary-card-${englishVocabularyLibrary.sets[0].id}`)
      .getByRole('button', { name: '開始練習' })
      .click()
    await page.getByRole('button', { name: '繼續' }).click()
    await page.keyboard.press('a')
    await expectHighContrastNavigation(page)
  })
})

test.describe('Typing compact previous and next navigation', () => {
  const scenarios = [
    {
      language: 'Japanese',
      route: '/ja/vocabulary',
      level: 'N5',
      card: 'vocabulary-set-card',
      storage: { vocabularyLibrary: navigationJapaneseVocabularyLibrary },
      words: navigationJapaneseVocabularyLibrary.items,
    },
    {
      language: 'English',
      route: '/en/vocabulary',
      level: 'A1',
      card: `english-vocabulary-card-${navigationEnglishVocabularyLibrary.sets[0].id}`,
      storage: { englishVocabularyLibrary: navigationEnglishVocabularyLibrary },
      words: navigationEnglishVocabularyLibrary.items,
    },
  ] as const

  const openAtIndex = async (page: Page, scenario: (typeof scenarios)[number], index: number) => {
    await seedStorage(page, scenario.storage)
    await page.goto(scenario.route)
    await page.getByRole('button', { name: new RegExp(`^${scenario.level}`) }).click()
    await page.getByTestId(scenario.card).getByRole('button', { name: '開始練習' }).click()
    await page.getByRole('button', { name: '繼續' }).click()
    for (const word of scenario.words.slice(0, index)) await page.keyboard.type(word.reading ?? word.word)
  }

  test('Japanese / English 導覽只顯示固定的句級文案與 Morphicons，不洩漏相鄰項目內容', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })

    for (const scenario of scenarios) {
      await openAtIndex(page, scenario, 1)
      const previous = page.getByTestId('practice-prev-word')
      const next = page.getByTestId('practice-next-word')
      const navigation = page.getByTestId('practice-navigation')

      await expect(previous).toHaveText('上一句')
      await expect(next).toHaveText('下一句')
      await expect(previous.locator('svg')).toHaveCount(1)
      await expect(next.locator('svg')).toHaveCount(1)
      await expect(navigation).not.toContainText(scenario.words[0].word)
      await expect(navigation).not.toContainText(scenario.words[0].meaning)
      await expect(navigation).not.toContainText(scenario.words[2].word)
      await expect(navigation).not.toContainText(scenario.words[2].meaning)
    }
  })

  test('Japanese / English 導覽的箭頭、句級文字、鍵盤與內容外空白都遵守同一個 button 邊界', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 })

    for (const scenario of scenarios) {
      for (const type of ['prev', 'next'] as const) {
        for (const targetIndex of [0, 1]) {
          await openAtIndex(page, scenario, 1)
          const button = page.getByTestId(`practice-${type}-word`)
          const targets = [button.locator('svg').first(), button.getByText(type === 'prev' ? '上一句' : '下一句', { exact: true })]
          await targets[targetIndex].click()
          const expectedWord = type === 'prev' ? scenario.words[0].word : scenario.words[2].word
          await expect(page.getByTestId('vocabulary-current-word')).toContainText(expectedWord)
        }
      }

      await openAtIndex(page, scenario, 1)
      const previous = page.getByTestId('practice-prev-word')
      const beforeBlankClick = await page.getByTestId('vocabulary-current-word').textContent()
      const previousBox = await previous.boundingBox()
      expect(previousBox).not.toBeNull()
      await page.mouse.click(previousBox!.x + previousBox!.width + 12, previousBox!.y + previousBox!.height / 2)
      await expect(page.getByTestId('vocabulary-current-word')).toHaveText(beforeBlankClick ?? '')

      for (const key of ['Enter', 'Space']) {
        await openAtIndex(page, scenario, 1)
        const previousButton = page.getByTestId('practice-prev-word')
        await previousButton.focus()
        await page.keyboard.press(key)
        await expect(page.getByTestId('vocabulary-current-word')).toContainText(scenario.words[0].word)
      }
    }
  })

  const openEnglishDialogueAtIndex = async (page: Page, index: number) => {
    await seedStorage(page, { englishPracticeDocuments: [navigationEnglishDialogue] })
    await page.goto('/en/dialogues')
    await page.getByRole('button', { name: /^A2/ }).click()
    await page.getByTestId(`english-dialogue-card-${navigationEnglishDialogue.id}`).getByRole('button', { name: '開始練習' }).click()
    await page.getByRole('button', { name: '繼續' }).click()
    for (const sentence of navigationEnglishDialogue.sentences.slice(0, index)) await page.keyboard.type(sentence.text)
  }

  const expectNoOverlap = (
    first: { x: number; y: number; width: number; height: number },
    second: { x: number; y: number; width: number; height: number },
    label = 'elements',
  ) => {
    const overlaps =
      first.x < second.x + second.width &&
      first.x + first.width > second.x &&
      first.y < second.y + second.height &&
      first.y + first.height > second.y
    expect(overlaps, `${label}: ${JSON.stringify({ first, second })}`).toBe(false)
  }

  test('長 English Dialogue 不影響緊湊導覽列高度，且不侵入標題或 toolbar', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await openEnglishDialogueAtIndex(page, 1)

    const next = page.getByTestId('practice-next-word')
    const title = page.getByTestId('english-dialogue-title')
    const toolbar = page.getByTestId('practice-header-controls')
    const [nextBox, titleBox, toolbarBox, rightArrowBox, navigationHeight] = await Promise.all([
      next.boundingBox(),
      title.boundingBox(),
      toolbar.boundingBox(),
      next.locator('svg').boundingBox(),
      page.getByTestId('practice-navigation').evaluate((node) => node.getBoundingClientRect().height),
    ])
    expect(nextBox).not.toBeNull()
    expect(titleBox).not.toBeNull()
    expect(toolbarBox).not.toBeNull()
    expect(rightArrowBox).not.toBeNull()
    expect(nextBox!.x + nextBox!.width - (rightArrowBox!.x + rightArrowBox!.width)).toBeGreaterThanOrEqual(12)
    expect(navigationHeight).toBeLessThanOrEqual(52)
    expectNoOverlap(nextBox!, titleBox!)
    expectNoOverlap(nextBox!, toolbarBox!)

    await next.click()
    await page.getByTestId('practice-next-word').click()
    const previous = page.getByTestId('practice-prev-word')
    const [previousBox, leftArrowBox] = await Promise.all([previous.boundingBox(), previous.locator('svg').boundingBox()])
    expect(previousBox).not.toBeNull()
    expect(leftArrowBox).not.toBeNull()
    expect(leftArrowBox!.x - previousBox!.x).toBeGreaterThanOrEqual(12)
    expectNoOverlap(previousBox!, (await title.boundingBox()) as NonNullable<typeof titleBox>)
  })

  test('390px 緊湊 English Dialogue 導覽會並排，且 tooltip 不改變 layout 高度', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openEnglishDialogueAtIndex(page, 1)

    const previous = page.getByTestId('practice-prev-word')
    const next = page.getByTestId('practice-next-word')
    const title = page.getByTestId('english-dialogue-title')
    const toolbar = page.getByTestId('practice-header-controls')
    const [previousBox, nextBox, titleBox, toolbarBox] = await Promise.all([
      previous.boundingBox(),
      next.boundingBox(),
      title.boundingBox(),
      toolbar.boundingBox(),
    ])
    expect(previousBox).not.toBeNull()
    expect(nextBox).not.toBeNull()
    expect(titleBox).not.toBeNull()
    expect(toolbarBox).not.toBeNull()
    expect(previousBox!.x).toBeGreaterThanOrEqual(0)
    expect(nextBox!.x + nextBox!.width).toBeLessThanOrEqual(390)
    expectNoOverlap(previousBox!, nextBox!)
    expectNoOverlap(previousBox!, titleBox!)
    expectNoOverlap(nextBox!, titleBox!)

    await page.getByRole('button', { name: '暫停' }).click()
    const restartMenu = page.getByTestId('pause-actions')
    await expect(restartMenu).toBeVisible()
    const restartMenuBox = await restartMenu.boundingBox()
    expect(restartMenuBox).not.toBeNull()
    expectNoOverlap(restartMenuBox!, previousBox!, 'restart menu / previous button')
    expectNoOverlap(restartMenuBox!, nextBox!, 'restart menu / next button')
    await restartMenu.getByRole('button', { name: '繼續' }).click()

    const navigationHeightBeforeTooltip = await page
      .getByTestId('practice-navigation')
      .evaluate((node) => node.getBoundingClientRect().height)
    await next.hover()
    const tooltip = next.locator('xpath=ancestor::div[contains(@class, "practice-word-navigation")]').locator('.tooltip')
    const tooltipBox = await tooltip.boundingBox()
    expect(tooltipBox).not.toBeNull()
    expectNoOverlap(tooltipBox!, toolbarBox!, 'tooltip / toolbar')
    expectNoOverlap(tooltipBox!, nextBox!, 'tooltip / next button')
    expectNoOverlap(tooltipBox!, titleBox!, 'tooltip / title')
    await expect(page.getByTestId('practice-navigation')).toHaveJSProperty('offsetHeight', navigationHeightBeforeTooltip)
  })
})
