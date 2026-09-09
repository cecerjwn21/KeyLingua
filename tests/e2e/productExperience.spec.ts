import { expect, test, type Page } from '@playwright/test'

const expectNoHorizontalOverflow = async (page: Page) => {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
}

const installSpeechMock = async (page: Page) => {
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

      addEventListener() {
        return undefined
      }

      removeEventListener() {
        return undefined
      }
    }

    const synth = {
      getVoices: () => [
        { lang: 'ja-JP', name: 'Japanese', voiceURI: 'ja-test', localService: true },
        { lang: 'en-US', name: 'English', voiceURI: 'en-test', localService: true },
      ],
      speak: (utterance: TestSpeechSynthesisUtterance) => events.push({ type: 'speak', text: utterance.text }),
      cancel: () => events.push({ type: 'cancel' }),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }

    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: TestSpeechSynthesisUtterance })
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synth })
    ;(window as unknown as { __productSpeechEvents: typeof events }).__productSpeechEvents = events
  })
}

const openDictationSettings = async (page: Page) => {
  await page.getByRole('button', { name: '練習設定' }).click()
  const panel = page.getByRole('dialog', { name: '練習設定' })
  await expect(panel).toBeVisible()
  await panel.getByRole('switch', { name: '默寫模式' }).click()
  await expect(panel.getByRole('switch', { name: '默寫模式' })).toBeChecked()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
}

const expectTypingAnswerHidden = async (page: Page) => {
  await expect(page.getByTestId('dictation-prompt')).toBeVisible()
  const letters = page.getByTestId('practice-romaji-typing-row').getByTestId('practice-editable-letter')
  await expect(letters.first()).toHaveText('_')
}

test.describe('全站產品體驗與默寫模式', () => {
  test.beforeEach(async ({ page }) => {
    await installSpeechMock(page)
    await page.addInitScript(() => {
      localStorage.setItem('isOpenDarkModeAtom', JSON.stringify(false))
      if (localStorage.getItem('wordDictationConfig') === null) {
        localStorage.setItem(
          'wordDictationConfig',
          JSON.stringify({ isOpen: false, type: 'hideAll', openBy: 'user' }),
        )
      }
    })
  })

  test('手機寬度仍停留在正式 Library，兩層導覽與 actions 不溢位', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 })
    await page.goto('/en/dialogues')

    await expect(page).toHaveURL(/\/en\/dialogues$/)
    await expect(page.getByRole('navigation', { name: '語言選擇' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: '資料庫入口' })).toBeVisible()
    await expect(page.getByRole('button', { name: '匯入' })).toBeVisible()
    await expect(page.getByRole('link', { name: '管理' })).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('English Dialogue 默寫隱藏答案但保留 TTS、target、下一句、Pause 與 Restart', async ({ page }) => {
    await page.addInitScript(() => {
      const document = {
        id: 'dictation-dialogue',
        title: 'A1｜默寫對話',
        level: 'A1',
        source: 'manual',
        createdAt: '2026-08-27T00:00:00.000Z',
        sentences: [
          { text: 'Hi!', meaning: '嗨！' },
          { text: 'OK.', meaning: '好。' },
        ],
      }
      localStorage.setItem('englishPracticeDocuments', JSON.stringify([document]))
      localStorage.setItem('englishPracticeDocumentId', JSON.stringify(document.id))
      localStorage.setItem(
        'practiceSource',
        JSON.stringify({ language: 'english', practiceType: 'dialogue', id: document.id }),
      )
    })

    await page.goto('/en/typing')
    await openDictationSettings(page)
    await expect(page.getByTestId('practice-english-display')).toBeHidden()
    await expectTypingAnswerHidden(page)

    await page.getByRole('button', { name: '朗讀目前句' }).click()
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as unknown as { __productSpeechEvents: Array<{ type: string; text?: string }> }).__productSpeechEvents
            .filter((event) => event.type === 'speak')
            .at(-1)?.text,
        ),
      )
      .toBe('Hi!')

    await page.getByRole('button', { name: '繼續' }).click()
    await page.keyboard.press('Shift+H')
    await page.keyboard.press('i')
    await page.keyboard.press('Shift+1')
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 2 / 2')
    await expectTypingAnswerHidden(page)

    await page.getByRole('button', { name: '暫停' }).click()
    await expect(page.getByRole('button', { name: '繼續' })).toBeVisible()
    await page.getByRole('button', { name: '繼續' }).hover()
    await page.getByRole('button', { name: '重新' }).click()
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 1 / 2')
    await expectTypingAnswerHidden(page)
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('wordDictationConfig') ?? 'null')?.isOpen))
      .toBe(true)
  })

  test('Japanese Article 默寫只改 presentation，IME Romaji target 仍可輸入', async ({ page }) => {
    await page.addInitScript(() => {
      const document = {
        id: 'dictation-article',
        title: 'N5｜車站默寫',
        source: 'pasted',
        language: 'ja',
        jlptLevel: 'N5',
        sentences: [{ name: '駅です。', notation: '駅(えき)です。', trans: ['是車站。'] }],
      }
      localStorage.setItem('pastedPracticeDocuments', JSON.stringify([document]))
      localStorage.setItem('practiceDocumentId', JSON.stringify(document.id))
      localStorage.setItem(
        'practiceSource',
        JSON.stringify({ language: 'japanese', practiceType: 'article', id: document.id }),
      )
    })

    await page.goto('/ja/typing')
    await openDictationSettings(page)
    await expect(page.getByTestId('practice-japanese-display')).toBeHidden()
    await expectTypingAnswerHidden(page)

    await page.getByRole('button', { name: '繼續' }).click()
    await page.keyboard.press('e')
    await expect(
      page.getByTestId('practice-romaji-typing-row').locator('[data-current-letter="true"]'),
    ).toHaveAttribute('data-global-letter-index', '1')
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('wordDictationConfig') ?? 'null')?.isOpen))
      .toBe(true)
  })

  test('Japanese 與 English Vocabulary 共用默寫設定且不改各自 target', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'vocabularyLibrary',
        JSON.stringify({
          version: 1,
          sets: [{ id: 'ja-set', title: 'N5｜數量詞', jlptLevel: 'N5', createdAt: '2026-08-27T00:00:00.000Z' }],
          items: [{ id: 'ja-item', setId: 'ja-set', word: '十', reading: 'とお', meaning: '十個', source: 'manual' }],
        }),
      )
      localStorage.setItem('currentVocabularySetId', JSON.stringify('ja-set'))
      localStorage.setItem(
        'englishVocabularyLibrary',
        JSON.stringify({
          version: 1,
          sets: [{ id: 'en-set', title: 'A1｜動物', level: 'A1', createdAt: '2026-08-27T00:00:00.000Z' }],
          items: [{ id: 'en-item', setId: 'en-set', word: 'Cat', meaning: '貓', source: 'manual' }],
        }),
      )
      localStorage.setItem(
        'practiceSource',
        JSON.stringify({ language: 'japanese', practiceType: 'vocabulary', id: 'ja-set' }),
      )
    })

    await page.goto('/ja/typing')
    await openDictationSettings(page)
    await expect(page.getByTestId('vocabulary-current-word').getByText('十', { exact: true })).toBeHidden()
    await expectTypingAnswerHidden(page)
    await page.getByRole('button', { name: '繼續' }).click()
    await page.keyboard.press('t')
    await expect(
      page.getByTestId('practice-romaji-typing-row').locator('[data-current-letter="true"]'),
    ).toHaveAttribute('data-global-letter-index', '1')

    await page.goto('/en/vocabulary')
    await page.getByRole('button', { name: /^A1/ }).click()
    await page.getByTestId('english-vocabulary-card-en-set').getByRole('button', { name: '開始練習' }).click()
    await expect(page).toHaveURL(/\/en\/typing$/)
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('wordDictationConfig') ?? 'null')?.isOpen))
      .toBe(true)
    await expect(page.getByTestId('vocabulary-current-word').getByText('Cat', { exact: true })).toBeHidden()
    await expectTypingAnswerHidden(page)
    await page.getByRole('button', { name: '繼續' }).click()
    await page.keyboard.press('c')
    await expect(
      page.getByTestId('practice-romaji-typing-row').locator('[data-current-letter="true"]'),
    ).toHaveAttribute('data-global-letter-index', '1')
  })
})
