import {
  createEnglishDialogueTypingSession,
  importEnglishDialogueDocuments,
  importEnglishVocabularySets,
  normalizeEnglishTypingText,
} from '../../src/pages/English/utils/englishPractice'
import { getPhysicalAsciiCharacter } from '../../src/pages/Typing/components/WordPanel/components/KeyEventHandler/physicalAscii'
import { processCommittedText } from '../../src/pages/Typing/components/WordPanel/components/Word/processCommittedText'
import { initialWordState } from '../../src/pages/Typing/components/WordPanel/components/Word/type'
import { getEnglishVoices, resolveEnglishVoice } from '../../src/utils/englishVoices'
import { formatSpeechVoiceLabel } from '../../src/utils/speechVoiceLabel'
import { expect, test } from '@playwright/test'

const emptyVocabularyLibrary = { version: 1 as const, sets: [], items: [] }
const jsonFile = (name: string, value: unknown) => ({
  name,
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify(value)),
})

test.describe('English practice data contract', () => {
  test('Dialogue import 保留大小寫、space 與標點，只正規化 smart quotes', () => {
    const result = importEnglishDialogueDocuments([
      {
        text: JSON.stringify({
          title: 'A1｜餐廳點餐基本對話',
          level: 'A1',
          sentences: [
            { text: 'Are you ready to order?', meaning: '您準備好點餐了嗎？' },
            { text: 'Yes, I’d like “this one”.', meaning: '好了，我想要這個。' },
          ],
        }),
      },
    ])

    expect(result).not.toHaveProperty('error')
    if ('error' in result) return
    expect(result.documents).toHaveLength(1)
    expect(result.documents[0]).toMatchObject({ title: 'A1｜餐廳點餐基本對話', level: 'A1' })
    expect(result.documents[0].sentences.map(({ text }) => text)).toEqual(['Are you ready to order?', 'Yes, I\'d like "this one".'])
  })

  test('Dialogue multi-file 任一 sentence 無效時整批拒絕', () => {
    const result = importEnglishDialogueDocuments([
      {
        filename: 'valid.json',
        text: JSON.stringify({
          title: 'A1｜飯店入住',
          level: 'A1',
          sentences: [{ text: 'I have a reservation.', meaning: '我有預約。' }],
        }),
      },
      {
        filename: 'invalid.json',
        text: JSON.stringify({ title: 'A2｜錯誤資料', level: 'A2', sentences: [{ text: '', meaning: '空白。' }] }),
      },
    ])

    expect(result).toEqual({ error: '第 2 個檔案（invalid.json），第 1 句格式錯誤：text 必須是非空字串。' })
  })

  test('Vocabulary import 使用 CEFR named set，且同 set 內才去重', () => {
    const result = importEnglishVocabularySets(
      [
        {
          text: JSON.stringify({
            title: 'A1｜用餐單字',
            level: 'A1',
            items: [
              { word: 'menu', meaning: '菜單', source: 'manual' },
              { word: 'menu', meaning: '菜單' },
            ],
          }),
        },
        {
          text: JSON.stringify({
            title: 'A1｜飯店單字',
            level: 'A1',
            items: [{ word: 'menu', meaning: '菜單' }],
          }),
        },
      ],
      emptyVocabularyLibrary,
    )

    expect(result).not.toHaveProperty('error')
    if ('error' in result) return
    expect(result.sets.map(({ title }) => title)).toEqual(['A1｜用餐單字', 'A1｜飯店單字'])
    expect(result.items).toHaveLength(2)
    expect(result.duplicates).toHaveLength(1)
    expect(result.items.every((item) => !('reading' in item))).toBe(true)
  })

  test('Vocabulary multi-file validation 是 atomic', () => {
    const existing = {
      version: 1 as const,
      sets: [{ id: 'existing', title: 'A1｜既有題庫', level: 'A1' as const, createdAt: '2026-08-26T00:00:00.000Z' }],
      items: [{ id: 'existing-item', setId: 'existing', word: 'water', meaning: '水', source: 'manual' as const }],
    }
    const snapshot = structuredClone(existing)
    const result = importEnglishVocabularySets(
      [
        {
          text: JSON.stringify({
            title: 'A1｜有效題庫',
            level: 'A1',
            items: [{ word: 'bill', meaning: '帳單' }],
          }),
        },
        {
          text: JSON.stringify({
            title: 'A1｜無效題庫',
            level: 'A1',
            items: [{ word: 'reservation', meaning: '' }],
          }),
        },
      ],
      existing,
    )

    expect(result).toEqual({ error: '第 2 個檔案，第 1 個單字格式錯誤：meaning 必須是非空字串。' })
    expect(existing).toEqual(snapshot)
  })

  test('Dialogue session 將每句英文原文投影為獨立 target，不加入句間 separator', () => {
    const session = createEnglishDialogueTypingSession({
      id: 'dialogue-a1',
      title: 'A1｜餐廳基本對話',
      level: 'A1',
      source: 'manual',
      createdAt: '2026-08-26T00:00:00.000Z',
      sentences: [
        { text: 'Are you ready to order?', meaning: '您準備好點餐了嗎？' },
        { text: "Yes, I'd like this one.", meaning: '好了，我想要這個。' },
      ],
    })

    expect(session.typingItems).toEqual([
      { name: 'Are you ready to order?', trans: ['您準備好點餐了嗎？'] },
      { name: "Yes, I'd like this one.", trans: ['好了，我想要這個。'] },
    ])
    expect(session.sentencePresentations).toEqual([
      { targetStart: 0, targetEnd: 23 },
      { targetStart: 0, targetEnd: 23 },
    ])
  })

  test('Dialogue 逐句保留句中空白、apostrophe 與句尾標點，不加入尾端空白', () => {
    const texts = ['Hello.', 'Really?', 'Yes!', 'Excuse me, where is the station?', "I'm fine."]
    const session = createEnglishDialogueTypingSession({
      id: 'english-punctuation-contract',
      title: 'A1｜標點契約',
      level: 'A1',
      source: 'manual',
      createdAt: '2026-08-27T00:00:00.000Z',
      sentences: texts.map((text) => ({ text, meaning: '測試翻譯' })),
    })

    expect(session.typingItems.map((item) => item.name)).toEqual(texts)
    expect(session.typingItems.map((item) => item.name.endsWith(' '))).toEqual([false, false, false, false, false])
  })

  test('English target normalization 不會折疊大小寫或移除標點與 space', () => {
    expect(normalizeEnglishTypingText('  Could I get the bill, please?  ')).toBe('Could I get the bill, please?')
    expect(normalizeEnglishTypingText('Don’t worry!')).toBe("Don't worry!")
  })
})

test.describe('English physical keyboard and voice selection', () => {
  for (const [target, input] of [
    ['A', 'a'],
    ['A', 'A'],
    ['a', 'a'],
    ['a', 'A'],
  ] as const) {
    test(`target ${target} 接受 ${input} 且保留顯示大小寫`, () => {
      const state = structuredClone(initialWordState)
      state.displayWord = target
      state.letterStates = ['normal']
      const result = processCommittedText(state, input, {
        isPracticeMode: true,
        isIgnoreCase: true,
        explicitSpace: ' ',
        timestamp: 1,
      })

      expect(result.nextState.displayWord).toBe(target)
      expect(result.nextState.letterStates).toEqual(['correct'])
      expect(result.nextState.wrongCount).toBe(0)
      expect(result.wrongDelta).toBeUndefined()
    })
  }

  test('Shift + letter 產生 uppercase，Quote 支援 apostrophe 與雙引號', () => {
    const keyboardEvent = (code: string, shiftKey = false) => ({ code, shiftKey, altKey: false, ctrlKey: false, metaKey: false })
    expect(getPhysicalAsciiCharacter(keyboardEvent('KeyH', true))).toBe('H')
    expect(getPhysicalAsciiCharacter(keyboardEvent('KeyH'))).toBe('h')
    expect(getPhysicalAsciiCharacter(keyboardEvent('Quote'))).toBe("'")
    expect(getPhysicalAsciiCharacter(keyboardEvent('Quote', true))).toBe('"')
    expect(getPhysicalAsciiCharacter(keyboardEvent('Space'))).toBe(' ')
  })

  test('English voice selector 只列 en-* 並保留 language-specific preference', () => {
    const voices = [
      { name: 'Japanese', lang: 'ja-JP', voiceURI: 'ja', localService: true },
      { name: 'English UK', lang: 'en-GB', voiceURI: 'en-gb', localService: true },
      { name: 'English US', lang: 'en-US', voiceURI: 'en-us', localService: true },
    ] as SpeechSynthesisVoice[]

    expect(getEnglishVoices(voices).map(({ voiceURI }) => voiceURI)).toEqual(['en-us', 'en-gb'])
    expect(resolveEnglishVoice(voices, 'en-gb')?.voiceURI).toBe('en-gb')
    expect(resolveEnglishVoice(voices, 'ja')?.voiceURI).toBe('en-us')
  })

  test('voice label 依 lang、Natural 與 localService 中文化而不改 identity', () => {
    const voices = [
      {
        name: 'Microsoft Ava Online (Natural) - English (United States)',
        lang: 'en-US',
        voiceURI: 'ava-cloud',
        localService: false,
      },
      {
        name: 'Microsoft David - English (United Kingdom)',
        lang: 'en-GB',
        voiceURI: 'david-local',
        localService: true,
      },
      {
        name: 'Microsoft 七海 Online (Natural) - Japanese (Japan)',
        lang: 'ja-JP',
        voiceURI: 'nanami-cloud',
        localService: false,
      },
    ] as SpeechSynthesisVoice[]

    expect(voices.map(formatSpeechVoiceLabel)).toEqual([
      'Ava｜美式英語｜自然語音｜雲端',
      'David｜英式英語｜本機',
      '七海｜日語｜自然語音｜雲端',
    ])
    expect(voices.map(({ voiceURI }) => voiceURI)).toEqual(['ava-cloud', 'david-local', 'nanami-cloud'])
  })
})

const clearEnglishStorage = async (page: import('@playwright/test').Page) => {
  // 先完成內建題庫初始化，再建立使用者已清空題庫的測試情境。
  await page.goto('/')
  await page.addInitScript(() => {
    for (const key of [
      'englishPracticeDocuments',
      'englishVocabularyLibrary',
      'englishPracticeDocumentId',
      'englishVocabularySetId',
      'practiceSource',
      'englishSpeechConfig',
    ]) {
      localStorage.removeItem(key)
    }
  })
}

const pressEnglishTarget = async (page: import('@playwright/test').Page, target: string, startIndex = 0) => {
  await expect
    .poll(() =>
      page.getByTestId('practice-romaji-typing-row').locator('[data-current-letter="true"]').getAttribute('data-global-letter-index'),
    )
    .toBe(String(startIndex))
  const punctuation: Record<string, [string, boolean]> = {
    ',': ['Comma', false],
    '.': ['Period', false],
    '?': ['Slash', true],
    '!': ['Digit1', true],
    "'": ['Quote', false],
    '"': ['Quote', true],
    ' ': ['Space', false],
  }
  for (const [index, character] of Array.from(target).entries()) {
    const [code, shiftKey] = /^[a-z]$/.test(character)
      ? [`Key${character.toUpperCase()}`, false]
      : /^[A-Z]$/.test(character)
      ? [`Key${character}`, true]
      : punctuation[character]
    await page.evaluate(
      ({ code, shiftKey, character }) =>
        window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, code, key: character, shiftKey })),
      { code, shiftKey, character },
    )
    if (index < target.length - 1) {
      await expect
        .poll(() =>
          page.getByTestId('practice-romaji-typing-row').locator('[data-current-letter="true"]').getAttribute('data-global-letter-index'),
        )
        .toBe(String(startIndex + index + 1))
    }
  }
}

const installEnglishSpeechMock = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    const events: Array<{ type: 'speak' | 'cancel'; text?: string; lang?: string; voiceURI?: string; rate?: number }> = []
    class TestSpeechSynthesisUtterance {
      text: string
      lang = ''
      voice: unknown = null
      rate = 1
      private listeners = new Map<string, Set<() => void>>()

      constructor(text: string) {
        this.text = text
      }

      addEventListener(type: string, listener: () => void) {
        const listeners = this.listeners.get(type) ?? new Set()
        listeners.add(listener)
        this.listeners.set(type, listeners)
      }
    }
    const voices = [
      { lang: 'ja-JP', name: 'Japanese', voiceURI: 'ja', localService: true },
      { lang: 'en-US', name: 'Microsoft David - English (United States)', voiceURI: 'en-us', localService: true },
      {
        lang: 'en-GB',
        name: 'Microsoft Ava Online (Natural) - English (United Kingdom)',
        voiceURI: 'en-gb',
        localService: false,
      },
    ]
    const synth = {
      getVoices: () => voices,
      speak: (utterance: TestSpeechSynthesisUtterance) => {
        events.push({
          type: 'speak',
          text: utterance.text,
          lang: utterance.lang,
          voiceURI: (utterance.voice as { voiceURI?: string } | null)?.voiceURI,
          rate: utterance.rate,
        })
      },
      cancel: () => events.push({ type: 'cancel' }),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: TestSpeechSynthesisUtterance })
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synth })
    ;(window as unknown as { __englishSpeechEvents: typeof events }).__englishSpeechEvents = events
  })
}

test.describe('English language routes and libraries', () => {
  test.beforeEach(async ({ page }) => clearEnglishStorage(page))

  test('Japanese 與 English selector 可切換，reload 與 back/forward 保持 route', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'English' })).toBeVisible()
    await expect(page.getByRole('link', { name: '日本語' })).toHaveAttribute('aria-current', 'page')

    await page.getByRole('link', { name: 'English' }).click()
    await expect(page).toHaveURL(/\/en\/dialogues$/)
    await expect(page.getByRole('heading', { name: '對話庫' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'English' })).toHaveAttribute('aria-current', 'page')
    await page.reload()
    await expect(page).toHaveURL(/\/en\/dialogues$/)

    await page.getByRole('link', { name: '單字庫' }).click()
    await expect(page).toHaveURL(/\/en\/vocabulary$/)
    await page.goBack()
    await expect(page).toHaveURL(/\/en\/dialogues$/)
    await page.getByRole('link', { name: '日本語' }).click()
    await expect(page).toHaveURL(/\/ja\/articles$/)
    await expect(page.getByRole('heading', { name: '文章庫' })).toBeVisible()
  })

  test('Language selector 僅顯示 English 與日本語，不渲染國旗', async ({ page }) => {
    await page.goto('/en/dialogues')
    const selector = page.getByRole('navigation', { name: '語言選擇' })
    await expect(selector.getByRole('link', { name: 'English' })).toHaveAttribute('aria-current', 'page')
    await expect(selector.getByRole('link', { name: '日本語' })).toBeVisible()
    await expect(selector.locator('img')).toHaveCount(0)

    await selector.getByRole('link', { name: '日本語' }).click()
    await expect(page).toHaveURL(/\/ja\/articles$/)
    await expect(selector.getByRole('link', { name: '日本語' })).toHaveAttribute('aria-current', 'page')
  })

  test('English Library 僅保留匯入與管理，且 Library back control 可鍵盤返回', async ({ page }) => {
    await page.goto('/en/dialogues')
    await expect(page.getByRole('button', { name: '新增' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '匯入' })).toBeVisible()
    await expect(page.getByRole('button', { name: '管理' })).toBeDisabled()
    await page.getByRole('button', { name: /A2/ }).click()
    const dialogueBack = page.getByTestId('library-back-button')
    await expect(dialogueBack).toHaveText('返回 CEFR 等級')
    await dialogueBack.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: '選擇 CEFR 等級' })).toBeVisible()

    await page.goto('/en/vocabulary')
    await expect(page.getByRole('button', { name: '新增' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '匯入' })).toBeVisible()
    await expect(page.getByRole('button', { name: '管理' })).toBeDisabled()
    await page.getByRole('button', { name: /A2/ }).click()
    await expect(page.getByTestId('library-back-button')).toHaveText('返回 CEFR 等級')
  })

  test('Library back control 在 reduced motion 下仍可互動且不產生 runtime error', async ({ page }) => {
    const runtimeErrors: Error[] = []
    page.on('pageerror', (error) => runtimeErrors.push(error))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/en/dialogues')
    await page.getByRole('button', { name: /A1/ }).hover()
    await page.getByRole('button', { name: /A1/ }).click()
    const backButton = page.getByTestId('library-back-button')
    await expect(backButton.locator('svg')).toBeVisible()
    await backButton.hover()
    await backButton.click()
    await expect(page.getByRole('heading', { name: '選擇 CEFR 等級' })).toBeVisible()
    expect(runtimeErrors).toEqual([])
  })

  test('四個 Library routes 的 compact segmented navigation 保持同一定位與尺寸', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    const readNavigationMetrics = async (route: string, heading: string) => {
      await page.goto(route)
      const languageBox = await page.getByRole('navigation', { name: '語言選擇' }).boundingBox()
      const libraryBox = await page.getByRole('navigation', { name: '資料庫入口' }).boundingBox()
      const headingBox = await page.getByRole('heading', { name: heading }).boundingBox()
      expect(languageBox).not.toBeNull()
      expect(libraryBox).not.toBeNull()
      expect(headingBox).not.toBeNull()
      return {
        language: languageBox,
        library: libraryBox,
        heading: headingBox,
        rowGap: Math.round(libraryBox!.y - (languageBox!.y + languageBox!.height)),
        headingGap: Math.round(headingBox!.y - (libraryBox!.y + libraryBox!.height)),
      }
    }

    const metrics = [
      await readNavigationMetrics('/ja/articles', '文章庫'),
      await readNavigationMetrics('/ja/vocabulary', '單字庫'),
      await readNavigationMetrics('/en/dialogues', '對話庫'),
      await readNavigationMetrics('/en/vocabulary', '單字庫'),
    ]
    for (const current of metrics.slice(1)) {
      expect(current.language).toEqual(metrics[0].language)
      expect(current.library).toEqual(metrics[0].library)
      expect(current.heading?.x).toBe(metrics[0].heading?.x)
      expect(current.rowGap).toBe(metrics[0].rowGap)
      expect(current.headingGap).toBe(metrics[0].headingGap)
    }
  })

  test('Dialogue 可 atomic import、依 CEFR 查看、編輯、刪除並開始目前單元', async ({ page }) => {
    await page.goto('/en/dialogues')
    await expect(page.getByRole('button', { name: /A1/ })).toContainText('0 個單元')
    await page.getByRole('button', { name: '匯入' }).click()
    await expect(page.getByRole('heading', { name: '匯入英文對話' })).toBeVisible()
    await page.getByLabel('對話 JSON', { exact: true }).fill(
      JSON.stringify({
        title: 'A1｜餐廳基本對話',
        level: 'A1',
        sentences: [
          { text: 'Are you ready to order?', meaning: '您準備好點餐了嗎？' },
          { text: "Yes, I'd like this one.", meaning: '好了，我想要這個。' },
        ],
      }),
    )
    await page.getByRole('button', { name: '驗證對話' }).click()
    await expect(page.getByText('對話驗證成功')).toBeVisible()
    await page.getByRole('button', { name: '確認匯入對話' }).click()
    await expect(page.getByRole('status')).toHaveText('已匯入 1 個英文對話單元')
    await page.getByRole('button', { name: /A1/ }).click()
    await expect(page.getByRole('heading', { name: 'A1｜餐廳基本對話' })).toBeVisible()

    await page.getByRole('link', { name: '管理' }).click()
    await expect(page).toHaveURL(/\/en\/dialogues\/manage\?level=A1$/)
    await expect(page.getByRole('heading', { name: '管理英文對話' })).toBeVisible()
    const dialogueCard = page.getByTestId(/english-dialogue-card-/).filter({ hasText: 'A1｜餐廳基本對話' })
    await dialogueCard.getByRole('button', { name: '編輯' }).click()
    const editDialog = page.getByRole('dialog', { name: '編輯英文對話' })
    await editDialog.getByLabel('對話 JSON').fill(
      JSON.stringify({
        title: 'A1｜餐廳點餐對話',
        level: 'A1',
        sentences: [{ text: 'Hello!', meaning: '你好！' }],
      }),
    )
    await editDialog.getByRole('button', { name: '儲存變更' }).click()
    await expect(page.getByRole('heading', { name: 'A1｜餐廳點餐對話' })).toBeVisible()
    await page
      .getByTestId(/english-dialogue-card-/)
      .filter({ hasText: 'A1｜餐廳點餐對話' })
      .getByRole('button', { name: '刪除' })
      .click()
    await page.getByRole('dialog', { name: '刪除英文對話' }).getByRole('button', { name: '確認刪除' }).click()
    await expect(page.getByText('目前沒有英文對話')).toBeVisible()
  })

  test('Dialogue JSON single/multi-file 匯入共用 atomic validation', async ({ page }) => {
    const dialogue = (title: string, text: string) => ({
      title,
      level: 'A1',
      sentences: [{ text, meaning: '測試翻譯' }],
    })
    await page.goto('/en/dialogues')

    await page.getByRole('button', { name: '匯入' }).click()
    await page.getByLabel('選擇 JSON 檔案').setInputFiles([jsonFile('single-dialogue.json', dialogue('A1｜單檔對話', 'Hello.'))])
    await page.getByRole('button', { name: '驗證對話' }).click()
    await page.getByRole('button', { name: '確認匯入對話' }).click()
    await expect(page.getByRole('status')).toHaveText('已匯入 1 個英文對話單元')

    await page.getByRole('button', { name: '匯入' }).click()
    await page
      .getByLabel('選擇 JSON 檔案')
      .setInputFiles([
        jsonFile('first-dialogue.json', dialogue('A1｜多檔對話一', 'Good morning.')),
        jsonFile('second-dialogue.json', dialogue('A1｜多檔對話二', 'Good evening.')),
      ])
    await page.getByRole('button', { name: '驗證對話' }).click()
    await page.getByRole('button', { name: '確認匯入對話' }).click()
    await expect(page.getByRole('status')).toHaveText('已匯入 2 個英文對話單元')
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('englishPracticeDocuments') ?? '[]').length)).toBe(3)

    await page.getByRole('button', { name: '匯入' }).click()
    await page.getByLabel('選擇 JSON 檔案').setInputFiles([
      jsonFile('valid-dialogue.json', dialogue('A1｜不可部分寫入', 'Still valid.')),
      jsonFile('broken-dialogue.json', {
        title: 'A1｜壞檔',
        level: 'A1',
        sentences: [{ text: '', meaning: '缺少原文' }],
      }),
    ])
    await page.getByRole('button', { name: '驗證對話' }).click()
    await expect(page.getByRole('alert')).toContainText('第 2 個檔案（broken-dialogue.json），第 1 句格式錯誤')
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('englishPracticeDocuments') ?? '[]').length)).toBe(3)
  })

  test('VocabularySet import 保持 set scope，並能進入目前題庫練習', async ({ page }) => {
    await page.goto('/en/vocabulary')
    await page.getByRole('button', { name: '匯入' }).click()
    await page.getByLabel('單字題庫 JSON', { exact: true }).fill(
      JSON.stringify({
        title: 'A1｜用餐單字測試',
        level: 'A1',
        items: [
          { word: 'menu', meaning: '菜單' },
          { word: 'bill', meaning: '帳單' },
          { word: 'water', meaning: '水' },
          { word: 'reservation', meaning: '預約' },
        ],
      }),
    )
    await page.getByRole('button', { name: '驗證題庫' }).click()
    await expect(page.getByText('單字題庫驗證成功')).toBeVisible()
    await page.getByRole('button', { name: '確認匯入題庫' }).click()
    await expect(page.getByRole('status')).toHaveText('已匯入 1 個英文單字題庫')
    await page.getByRole('button', { name: /A1/ }).click()
    const setCard = page.getByTestId(/english-vocabulary-card-/).filter({ hasText: 'A1｜用餐單字測試' })
    await expect(setCard).toContainText('4 個單字')
    await setCard.getByRole('button', { name: '開始練習' }).click()
    await expect(page).toHaveURL(/\/en\/typing$/)
    await expect(page.getByTestId('english-vocabulary-practice')).toContainText('menu')
    await expect(page.getByTestId('english-vocabulary-practice')).not.toContainText('reading')
    await page.getByRole('button', { name: '繼續' }).click()
    for (const [index, target] of ['menu', 'bill', 'water', 'reservation'].entries()) {
      await pressEnglishTarget(page, target)
      if (index < 3) {
        await expect(page.getByTestId('english-vocabulary-practice')).toContainText(['bill', 'water', 'reservation'][index])
      }
    }
    const result = page.getByTestId('english-vocabulary-result-screen')
    await expect(result).toBeVisible()
    await expect(result).toContainText('4 個單字')
    await expect(result.getByRole('button', { name: '返回英文單字庫' })).toBeVisible()
  })

  test('Vocabulary JSON single/multi-file 匯入遇到壞檔時零寫入', async ({ page }) => {
    const vocabulary = (title: string, word: string) => ({
      title,
      level: 'A1',
      items: [{ word, meaning: '測試翻譯' }],
    })
    await page.goto('/en/vocabulary')

    await page.getByRole('button', { name: '匯入' }).click()
    await page.getByLabel('選擇 JSON 檔案').setInputFiles([jsonFile('single-vocabulary.json', vocabulary('A1｜單檔單字', 'menu'))])
    await page.getByRole('button', { name: '驗證題庫' }).click()
    await page.getByRole('button', { name: '確認匯入題庫' }).click()
    await expect(page.getByRole('status')).toHaveText('已匯入 1 個英文單字題庫')

    await page.getByRole('button', { name: '匯入' }).click()
    await page
      .getByLabel('選擇 JSON 檔案')
      .setInputFiles([
        jsonFile('first-vocabulary.json', vocabulary('A1｜多檔單字一', 'bill')),
        jsonFile('second-vocabulary.json', vocabulary('A1｜多檔單字二', 'water')),
      ])
    await page.getByRole('button', { name: '驗證題庫' }).click()
    await page.getByRole('button', { name: '確認匯入題庫' }).click()
    await expect(page.getByRole('status')).toHaveText('已匯入 2 個英文單字題庫')
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('englishVocabularyLibrary') ?? '{"sets":[]}').sets.length))
      .toBe(3)

    await page.getByRole('button', { name: '匯入' }).click()
    await page.getByLabel('選擇 JSON 檔案').setInputFiles([
      jsonFile('valid-vocabulary.json', vocabulary('A1｜不可部分寫入', 'reservation')),
      jsonFile('broken-vocabulary.json', {
        title: 'A1｜壞檔',
        level: 'A1',
        items: [{ word: 'broken', meaning: '' }],
      }),
    ])
    await page.getByRole('button', { name: '驗證題庫' }).click()
    await expect(page.getByRole('alert')).toContainText('第 2 個檔案（broken-vocabulary.json），第 1 個單字格式錯誤')
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('englishVocabularyLibrary') ?? '{"sets":[]}').sets.length))
      .toBe(3)
  })
})

test.describe('English shared Typing shell', () => {
  test('英文對話句尾問號輸入後立刻進入下一句，不要求額外空白', async ({ page }) => {
    const firstSentence = 'Do you have any plans after school?'
    await page.addInitScript(
      ({ firstSentence }) => {
        localStorage.setItem(
          'englishPracticeDocuments',
          JSON.stringify([
            {
              id: 'english-dialogue-no-trailing-space',
              title: 'A1｜句尾空白回歸',
              level: 'A1',
              source: 'manual',
              createdAt: '2026-08-27T00:00:00.000Z',
              sentences: [
                { text: firstSentence, meaning: '放學後有什麼安排嗎？' },
                { text: 'Hello.', meaning: '你好。' },
              ],
            },
          ]),
        )
        localStorage.setItem('englishPracticeDocumentId', JSON.stringify('english-dialogue-no-trailing-space'))
        localStorage.setItem(
          'practiceSource',
          JSON.stringify({ language: 'english', practiceType: 'dialogue', id: 'english-dialogue-no-trailing-space' }),
        )
      },
      { firstSentence },
    )

    await page.goto('/en/typing')
    await page.getByRole('button', { name: '繼續' }).click()
    await pressEnglishTarget(page, firstSentence)

    await expect(page.getByTestId('practice-english-display')).toHaveText('Hello.')
    await expect(page.getByTestId('practice-romaji-typing-row').getByTestId('practice-editable-letter').first()).toHaveText('H')
  })

  test('Dialogue 大小寫不影響正確性，原文、space 與 punctuation 保持不變', async ({ page }) => {
    const target = 'Are you ready to order?'
    await page.addInitScript(() => {
      localStorage.setItem(
        'englishPracticeDocuments',
        JSON.stringify([
          {
            id: 'english-dialogue-typing',
            title: 'A1｜Typing 驗收',
            level: 'A1',
            source: 'manual',
            createdAt: '2026-08-26T00:00:00.000Z',
            sentences: [{ text: 'Are you ready to order?', meaning: '您準備好點餐了嗎？' }],
          },
        ]),
      )
      localStorage.setItem('englishPracticeDocumentId', JSON.stringify('english-dialogue-typing'))
      localStorage.setItem(
        'practiceSource',
        JSON.stringify({ language: 'english', practiceType: 'dialogue', id: 'english-dialogue-typing' }),
      )
    })

    await page.goto('/en/typing')
    await expect(page.getByTestId('practice-header-title')).toHaveText('A1｜Typing 驗收')
    await expect(page.getByLabel('英文語音')).toBeVisible()
    await expect(page.getByRole('button', { name: '顯示讀音' })).toHaveCount(0)
    await expect(page.getByTestId('practice-english-display')).toHaveText(target)
    await page.getByRole('button', { name: '繼續' }).click()

    await page.keyboard.press('a')
    const letters = page.getByTestId('practice-romaji-typing-row').getByTestId('practice-editable-letter')
    await expect(letters.nth(0)).toHaveText('A')
    await expect(letters.nth(0)).toHaveClass(/text-green-/)
    await expect(page.getByTestId('practice-romaji-typing-row').locator('[data-current-letter="true"]')).toHaveAttribute(
      'data-global-letter-index',
      '1',
    )
    await pressEnglishTarget(page, target.slice(1), 1)

    const result = page.getByTestId('english-dialogue-result-screen')
    await expect(result).toBeVisible()
    await expect(result).toContainText('CEFR：A1')
    await expect(result).toContainText('1 句')
    await expect(result.getByRole('button', { name: '再練一次' })).toBeVisible()
    await expect(result.getByRole('button', { name: '返回英文對話庫' })).toBeVisible()
  })

  test('English 真正錯字保留紅色 feedback 與錯誤統計，正確大小寫不製造假錯誤', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'englishPracticeDocuments',
        JSON.stringify([
          {
            id: 'english-dialogue-wrong-key',
            title: 'A1｜錯字回歸',
            level: 'A1',
            source: 'manual',
            createdAt: '2026-08-26T00:00:00.000Z',
            sentences: [{ text: 'A?', meaning: '測試' }],
          },
        ]),
      )
      localStorage.setItem('englishPracticeDocumentId', JSON.stringify('english-dialogue-wrong-key'))
      localStorage.setItem(
        'practiceSource',
        JSON.stringify({ language: 'english', practiceType: 'dialogue', id: 'english-dialogue-wrong-key' }),
      )
    })

    await page.goto('/en/typing')
    await page.getByRole('button', { name: '繼續' }).click()
    const letters = page.getByTestId('practice-romaji-typing-row').getByTestId('practice-editable-letter')
    await page.keyboard.press('x')
    await expect(letters.nth(0)).toHaveClass(/text-red-/)
    await expect(letters.nth(0)).toHaveAttribute('data-current-letter', 'true')

    await page.keyboard.press('Shift+A')
    await expect(letters.nth(0)).toHaveClass(/text-green-/)
    await page.keyboard.press('Shift+?')
    const result = page.getByTestId('english-dialogue-result-screen')
    await expect(result).toBeVisible()
    await expect(result.getByText('錯誤數', { exact: true }).locator('..').locator('dd')).toHaveText('1')
  })

  test('English 句中缺少 space 或輸錯 punctuation 仍記為錯誤', () => {
    const initial = () => ({
      ...structuredClone(initialWordState),
      displayWord: 'Excuse me, where is the station?',
      letterStates: new Array('Excuse me, where is the station?'.length).fill('normal'),
    })
    const options = { isPracticeMode: true, isIgnoreCase: true, explicitSpace: ' ', timestamp: 1 }

    expect(processCommittedText(initial(), 'Excuseme', options).wrongDelta).toBeDefined()
    expect(processCommittedText(initial(), 'Excuse me. ', options).wrongDelta).toBeDefined()
  })

  test('How are you? 的完整 physical-key space 與 punctuation 流程正常', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'englishPracticeDocuments',
        JSON.stringify([
          {
            id: 'english-dialogue-space-punctuation',
            title: 'A1｜空格標點回歸',
            level: 'A1',
            source: 'manual',
            createdAt: '2026-08-26T00:00:00.000Z',
            sentences: [{ text: 'How are you?', meaning: '你好嗎？' }],
          },
        ]),
      )
      localStorage.setItem('englishPracticeDocumentId', JSON.stringify('english-dialogue-space-punctuation'))
      localStorage.setItem(
        'practiceSource',
        JSON.stringify({ language: 'english', practiceType: 'dialogue', id: 'english-dialogue-space-punctuation' }),
      )
    })

    await page.goto('/en/typing')
    await expect(page.getByTestId('practice-english-display')).toHaveText('How are you?')
    await page.getByRole('button', { name: '繼續' }).click()
    await pressEnglishTarget(page, 'how are you?')
    await expect(page.getByTestId('english-dialogue-result-screen')).toBeVisible()
  })

  test('English voice preference、auto/manual speech、Pause/Resume 與 Restart 沿用 latest-wins', async ({ page }) => {
    await installEnglishSpeechMock(page)
    await page.addInitScript(() => {
      localStorage.setItem(
        'englishPracticeDocuments',
        JSON.stringify([
          {
            id: 'english-dialogue-speech',
            title: 'A1｜Speech 驗收',
            level: 'A1',
            source: 'manual',
            createdAt: '2026-08-26T00:00:00.000Z',
            sentences: [
              { text: 'Hi!', meaning: '嗨！' },
              { text: "I'm ready.", meaning: '我準備好了。' },
            ],
          },
        ]),
      )
      localStorage.setItem('englishPracticeDocumentId', JSON.stringify('english-dialogue-speech'))
      localStorage.setItem(
        'practiceSource',
        JSON.stringify({ language: 'english', practiceType: 'dialogue', id: 'english-dialogue-speech' }),
      )
    })

    await page.goto('/en/typing')
    await expect(page.getByLabel('英文語音').locator('option')).toHaveText(['David｜美式英語｜本機', 'Ava｜英式英語｜自然語音｜雲端'])
    await page.getByLabel('英文語音').selectOption('en-gb')
    await page.getByLabel('英文語速').selectOption('1.1')
    await page.getByRole('button', { name: '繼續' }).click()
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as unknown as { __englishSpeechEvents: Array<Record<string, unknown>> }).__englishSpeechEvents
            .filter((event) => event.type === 'speak')
            .at(-1),
        ),
      )
      .toMatchObject({ text: 'Hi!', lang: 'en-US', voiceURI: 'en-gb', rate: 1.1 })

    await page.getByRole('button', { name: '朗讀目前句' }).click()
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { __englishSpeechEvents: Array<Record<string, unknown>> }).__englishSpeechEvents.filter(
              (event) => event.type === 'speak',
            ).length,
        ),
      )
      .toBe(2)

    await pressEnglishTarget(page, 'Hi!')
    await expect(page.getByTestId('practice-english-display')).toHaveText("I'm ready.")
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as unknown as { __englishSpeechEvents: Array<Record<string, unknown>> }).__englishSpeechEvents
            .filter((event) => event.type === 'speak')
            .at(-1),
        ),
      )
      .toMatchObject({ text: "I'm ready.", lang: 'en-US', voiceURI: 'en-gb' })

    const speakCount = await page.evaluate(
      () =>
        (window as unknown as { __englishSpeechEvents: Array<Record<string, unknown>> }).__englishSpeechEvents.filter(
          (event) => event.type === 'speak',
        ).length,
    )
    await page.getByRole('button', { name: '暫停' }).click()
    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as { __englishSpeechEvents: Array<Record<string, unknown>> }).__englishSpeechEvents.at(-1)),
      )
      .toEqual({ type: 'cancel' })
    await page.getByRole('button', { name: '繼續' }).click()
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { __englishSpeechEvents: Array<Record<string, unknown>> }).__englishSpeechEvents.filter(
              (event) => event.type === 'speak',
            ).length,
        ),
      )
      .toBe(speakCount)

    await page.getByRole('button', { name: '暫停' }).click()
    await page.getByRole('button', { name: '繼續' }).hover()
    await page.getByRole('button', { name: '重新' }).click()
    await expect(page.getByTestId('practice-english-display')).toHaveText('Hi!')
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as unknown as { __englishSpeechEvents: Array<Record<string, unknown>> }).__englishSpeechEvents
            .filter((event) => event.type === 'speak')
            .at(-1),
        ),
      )
      .toMatchObject({ text: 'Hi!', lang: 'en-US' })

    await page.reload()
    await expect(page.getByLabel('英文語音')).toHaveValue('en-gb')
    await expect(page.getByLabel('英文語速')).toHaveValue('1.1')
  })
})
