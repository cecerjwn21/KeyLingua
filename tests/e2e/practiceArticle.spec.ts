import { createArticleTypingSession, MAX_ARTICLE_TYPING_LENGTH } from '../../src/pages/Typing/utils/practiceArticle'
import { getPracticeTypingTarget } from '../../src/pages/Typing/utils/practiceTypingTarget'
import { japanesePracticeDocument } from '../../src/resources/practiceDocuments'
import type { PracticeDocument } from '../../src/typings'
import { expect, Page, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const pressPhysicalText = async (page: Page, text: string, startIndex = 0, allowCompletion = false) => {
  await expect(page.getByRole('button', { name: '暫停' })).toBeVisible()
  for (const [offset, character] of Array.from(text).entries()) {
    const punctuation: Record<string, [string, boolean]> = {
      ',': ['Comma', false],
      '.': ['Period', false],
      '-': ['Minus', false],
      ';': ['Semicolon', false],
      ':': ['Semicolon', true],
      '"': ['Quote', true],
      '!': ['Digit1', true],
      '?': ['Slash', true],
      ' ': ['Space', false],
    }
    const [code, shiftKey] = /^[a-z]$/.test(character)
      ? [`Key${character.toUpperCase()}`, false]
      : /^[0-9]$/.test(character)
      ? [`Digit${character}`, false]
      : punctuation[character]

    await page.evaluate(
      ({ code, shiftKey }) => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Process', code, shiftKey, isComposing: true }),
        )
      },
      { code, shiftKey },
    )
    if (allowCompletion && offset === text.length - 1) continue
    await expect
      .poll(() =>
        page.getByTestId('practice-romaji-typing-row').locator('[data-current-letter="true"]').getAttribute('data-global-letter-index'),
      )
      .toBe(String(startIndex + offset + 1))
  }
}

const document: PracticeDocument = {
  id: 'article-adapter-fixture',
  title: '整篇測試文章',
  source: 'fixture',
  language: 'ja',
  jlptLevel: 'N4',
  scenario: '測試',
  sentences: [
    {
      name: '昨日、友達と映画を見に行きました。',
      notation: '昨日(きのう)、友達(ともだち)と映画(えいが)を見(み)に行(い)きました。',
      trans: ['昨天和朋友去看電影。'],
    },
    {
      name: 'そのあと、近くの居酒屋で晩ご飯を食べました。',
      notation: 'そのあと、近(ちか)くの居酒屋(いざかや)で晩(ばん)ご飯(はん)を食(た)べました。',
      trans: ['之後在附近的居酒屋吃晚餐。'],
    },
    {
      name: '最後に駅まで歩いて帰りました。',
      notation: '最後(さいご)に駅(えき)まで歩(ある)いて帰(かえ)りました。',
      trans: ['最後走到車站回家。'],
    },
  ],
}

const fourSentenceSpeechDocument: PracticeDocument = {
  ...document,
  id: 'article-four-sentence-speech-regression',
  title: '四句朗讀競爭測試',
  sentences: [
    ...document.sentences,
    {
      name: '明日は家で本を読みます。',
      notation: '明日(あした)は家(いえ)で本(ほん)を読(よ)みます。',
      trans: ['明天要在家看書。'],
    },
  ],
}

const cjkRegressionDocuments: PracticeDocument[] = [
  {
    id: 'article-cjk-seven-ji-regression',
    title: '七時與預約 regression',
    source: 'fixture',
    language: 'ja',
    jlptLevel: 'N4',
    scenario: '居酒屋',
    sentences: [
      {
        name: 'こんばんは、七時に予約しているチョンです。',
        notation: 'こんばんは、七時(しちじ)に予約(よやく)しているチョンです。',
        trans: ['晚安，我是晚上七點有預約的鍾。'],
      },
    ],
  },
  {
    id: 'article-cjk-nando-regression',
    title: '何度 regression',
    source: 'fixture',
    language: 'ja',
    jlptLevel: 'N5',
    scenario: '入境',
    sentences: [
      {
        name: '日本へは何度来ましたか。',
        notation: '日本(にほん)へは何度(なんど)来(き)ましたか。',
        trans: ['來日本幾次了？'],
      },
    ],
  },
  {
    id: 'article-cjk-ekiin-regression',
    title: '駅員 regression',
    source: 'fixture',
    language: 'ja',
    jlptLevel: 'N4',
    scenario: '車站',
    sentences: [
      {
        name: '駅員さんに出口を聞きました。',
        notation: '駅員(えきいん)さんに出口(でぐち)を聞(き)きました。',
        trans: ['我向站務員詢問出口。'],
      },
    ],
  },
]

const resultScreenDocument: PracticeDocument = {
  id: 'article-result-screen-regression',
  title: '車站會話完成測試',
  source: 'fixture',
  language: 'ja',
  jlptLevel: 'N4',
  scenario: '車站',
  sentences: [{ name: '駅です。', notation: '駅(えき)です。', trans: ['是車站。'] }],
}

const numericReadingCases: Array<{ name: string; notation: string; target: string }> = [
  { name: '1時', notation: '1時(じ)', target: 'ichiji' },
  { name: '4時', notation: '4時(じ)', target: 'yoji' },
  { name: '7時', notation: '7時(じ)', target: 'shichiji' },
  { name: '9時', notation: '9時(じ)', target: 'kuji' },
  { name: '10時', notation: '10時(じゅうじ)', target: 'juuji' },
  { name: '7時半', notation: '7時(じ)半(はん)', target: 'shichijihan' },
  { name: '1分', notation: '1分(ふん)', target: 'ippun' },
  { name: '3分', notation: '3分(ぷん)', target: 'sanpun' },
  { name: '6分', notation: '6分(ぷん)', target: 'roppun' },
  { name: '8分', notation: '8分(ぷん)', target: 'happun' },
  { name: '10分', notation: '10分(ぷん)', target: 'juppun' },
  { name: '1月', notation: '1月(がつ)', target: 'ichigatsu' },
  { name: '4月', notation: '4月(がつ)', target: 'shigatsu' },
  { name: '7月', notation: '7月(がつ)', target: 'shichigatsu' },
  { name: '9月', notation: '9月(がつ)', target: 'kugatsu' },
  { name: '12月', notation: '12月(がつ)', target: 'juunigatsu' },
  { name: '1年', notation: '1年(ねん)', target: 'ichinen' },
  { name: '4年', notation: '4年(ねん)', target: 'yonen' },
  { name: '7年', notation: '7年(ねん)', target: 'nananen' },
  { name: '10年', notation: '10年(ねん)', target: 'juunen' },
  { name: '1日', notation: '1日(にち)', target: 'tsuitachi' },
  { name: '2日', notation: '2日(にち)', target: 'futsuka' },
  { name: '4日', notation: '4日(にち)', target: 'yokka' },
  { name: '7日', notation: '7日(にち)', target: 'nanoka' },
  { name: '8日', notation: '8日(にち)', target: 'youka' },
  { name: '10日', notation: '10日(にち)', target: 'tooka' },
  { name: '14日', notation: '14日(にち)', target: 'juuyokka' },
  { name: '20日', notation: '20日(にち)', target: 'hatsuka' },
  { name: '24日', notation: '24日(にち)', target: 'nijuuyokka' },
  { name: '21日', notation: '21日(にち)', target: 'nijuuichinichi' },
  { name: '1人', notation: '1人(にん)', target: 'hitori' },
  { name: '2人', notation: '2人(にん)', target: 'futari' },
  { name: '4人', notation: '4人(にん)', target: 'yonin' },
  { name: '7人', notation: '7人(にん)', target: 'nananin' },
  { name: '10人', notation: '10人(にん)', target: 'juunin' },
  { name: '1個', notation: '1個(こ)', target: 'ikko' },
  { name: '6個', notation: '6個(こ)', target: 'rokko' },
  { name: '8個', notation: '8個(こ)', target: 'hakko' },
  { name: '10個', notation: '10個(こ)', target: 'jukko' },
]

const numericPhysicalKeyDocuments: PracticeDocument[] = [
  {
    id: 'article-arabic-seven-ji-physical-key',
    title: '阿拉伯數字七時 physical-key regression',
    source: 'fixture',
    language: 'ja',
    jlptLevel: 'N5',
    scenario: '約時間',
    sentences: [{ name: '7時くらいでいいんじゃない？', notation: '7時(じ)くらいでいいんじゃない？', trans: ['七點左右可以嗎？'] }],
  },
  {
    id: 'article-arabic-four-gatsu-physical-key',
    title: '阿拉伯數字四月 physical-key regression',
    source: 'fixture',
    language: 'ja',
    jlptLevel: 'N5',
    scenario: '日期',
    sentences: [{ name: '4月です。', notation: '4月(がつ)です。', trans: ['是四月。'] }],
  },
]

const containsJapaneseCharacters = (text: string) => /[\u3000-\u30ff\u3400-\u9fff\uf900-\ufaff]/u.test(text)

const articleStat = (page: Page, label: string) => page.getByText(label, { exact: true }).locator('..').locator('span').first()

const completeArticle = async (page: Page, value: PracticeDocument) => {
  const session = createArticleTypingSession(value)
  await selectPracticeArticle(page, value)
  await page.getByRole('button', { name: '繼續' }).click()
  await pressPhysicalText(page, session.typingTarget.slice(0, -1))
  await page.keyboard.press(session.typingTarget.at(-1) ?? '')
  return session
}

const selectPracticeArticle = async (page: Page, value: PracticeDocument) => {
  await page.goto('/')
  await page.evaluate((practiceDocument) => {
    localStorage.removeItem('articleSpeechConfig')
    localStorage.setItem('practiceDocumentId', JSON.stringify(practiceDocument.id))
    localStorage.setItem('pastedPracticeDocuments', JSON.stringify([practiceDocument]))
  }, value)
  await page.goto('/typing')
}

type SpeechVoiceFixture = Pick<SpeechSynthesisVoice, 'lang' | 'name' | 'voiceURI' | 'localService'>

const installSentenceSpeechMock = async (page: Page, voices?: SpeechVoiceFixture[]) => {
  await page.addInitScript(
    (availableVoices: SpeechVoiceFixture[]) => {
      const events: Array<{ type: 'speak' | 'cancel' | 'dropped'; text?: string; lang?: string; voiceURI?: string; rate?: number }> = []
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

        removeEventListener(type: string, listener: () => void) {
          this.listeners.get(type)?.delete(listener)
        }

        dispatch(type: 'end' | 'error') {
          this.listeners.get(type)?.forEach((listener) => listener())
        }
      }
      const utterances: TestSpeechSynthesisUtterance[] = []
      let cancelPending = false
      const synth = {
        speaking: false,
        getVoices: () => availableVoices,
        speak: (utterance: TestSpeechSynthesisUtterance) => {
          utterances.push(utterance)
          if (cancelPending) {
            events.push({ type: 'dropped', text: utterance.text })
            return
          }
          synth.speaking = true
          events.push({
            type: 'speak',
            text: utterance.text,
            lang: utterance.lang,
            voiceURI: (utterance.voice as { voiceURI?: string } | null)?.voiceURI,
            rate: utterance.rate,
          })
        },
        cancel: () => {
          synth.speaking = false
          cancelPending = true
          setTimeout(() => {
            cancelPending = false
          }, 0)
          events.push({ type: 'cancel' })
        },
      }

      Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: TestSpeechSynthesisUtterance })
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synth })
      ;(window as unknown as { __phaseD6SpeechEvents: typeof events }).__phaseD6SpeechEvents = events
      ;(
        window as unknown as {
          __phaseD6DispatchSpeechEvent: (utteranceIndex: number, type: 'end' | 'error') => void
        }
      ).__phaseD6DispatchSpeechEvent = (utteranceIndex, type) => utterances[utteranceIndex]?.dispatch(type)
    },
    voices ?? [
      { lang: 'ja-JP', name: 'Microsoft 圭太 - Japanese (Japan)', voiceURI: 'ja-local', localService: true },
      {
        lang: 'ja-JP',
        name: 'Microsoft 七海 Online (Natural) - Japanese (Japan)',
        voiceURI: 'ja-cloud',
        localService: false,
      },
      { lang: 'en-US', name: 'English', voiceURI: 'en-us', localService: true },
    ],
  )
}

test.describe('PracticeArticle adapter', () => {
  test('Article 對阿拉伯數字與明確 counter 套用 reading fallback，且完整 notation 優先', () => {
    const completeNotation = { name: '7時', notation: '7時(しちじ)', trans: [] }
    const incompleteNotation = { name: '7時', notation: '7時(じ)', trans: [] }

    expect(getPracticeTypingTarget(completeNotation)).toBe('shichiji')
    expect(getPracticeTypingTarget(incompleteNotation)).toBe('shichiji')
    expect(getPracticeTypingTarget({ name: '7', notation: '7', trans: [] })).toBe('7')

    for (const { name, notation, target } of numericReadingCases) {
      expect(getPracticeTypingTarget({ name, notation, trans: [] })).toBe(target)
    }
  })

  test('有 notation 的 Article typingTarget 對七時、何度、予約與駅員維持純 ASCII Romaji', () => {
    const targets = cjkRegressionDocuments.map((value) => createArticleTypingSession(value).typingTarget)

    expect(targets).toEqual(['konbanha,shichijiniyoyakushiteiruchondesu.', 'nihonhehanandokimashitaka.', 'ekiinsannideguchiwokikimashita.'])
    for (const target of targets) {
      expect(containsJapaneseCharacters(target)).toBe(false)
      expect(target).toMatch(/^[\x20-\x7e]+$/)
    }
  })

  test('將既有 sentences 投影成一個不增加句界字元的 typing session', () => {
    const session = createArticleTypingSession(document)
    const expectedTarget = document.sentences.map(getPracticeTypingTarget).join('')

    expect(session.article).toMatchObject({ id: document.id, title: document.title, format: 'prose' })
    expect(session.article.blocks).toHaveLength(3)
    expect(session.typingTarget).toBe(expectedTarget)
    expect(session.typingTarget).not.toContain('\n')
    expect(session.typingTarget).not.toContain('. ')
    expect(session.typingLength).toBe(expectedTarget.length)
    expect(session.typingItem).toEqual({ name: expectedTarget, trans: document.sentences.flatMap((sentence) => sentence.trans) })
    expect(session.typingItem.name).toBe(session.typingTarget)
  })

  test('全文使用 exact IME key sequence 且不加入 word 或 sentence spacing', () => {
    const exactDocument: PracticeDocument = {
      id: 'ime-spacing-regression',
      title: 'IME spacing regression',
      source: 'fixture',
      language: 'ja',
      sentences: [
        {
          name: '昨日、友達と映画を見に行きました。',
          notation: '昨日(きのう)、友達(ともだち)と映画(えいが)を見(み)に行(い)きました。',
          trans: [],
        },
        {
          name: '映画を見たあと、一緒に晩ご飯を食べました。',
          notation: '映画(えいが)を見(み)たあと、一緒(いっしょ)に晩(ばん)ご飯(はん)を食(た)べました。',
          trans: [],
        },
      ],
    }

    expect(createArticleTypingSession(exactDocument).typingTarget).toBe(
      'kinou,tomodachitoeigawominiikimashita.eigawomitaato,isshonibangohanwotabemashita.',
    )
  })

  test('只為精確 notation mapping 產生 sentence ranges 與 visual groups', () => {
    const session = createArticleTypingSession(document)
    const firstTarget = getPracticeTypingTarget(document.sentences[0])

    expect(session.sentencePresentations[0]).toMatchObject({ targetStart: 0, targetEnd: firstTarget.length })
    expect(session.sentencePresentations[1].targetStart).toBe(firstTarget.length)
    expect(session.sentencePresentations[0].visualGroups?.length).toBeGreaterThan(1)

    const unmapped = createArticleTypingSession({
      ...document,
      id: 'unmapped-visual-groups',
      sentences: [{ name: 'plain target', notation: '不相容(ふ)表記', trans: [] }],
    })
    expect(unmapped.sentencePresentations[0]).toMatchObject({ targetStart: 0, targetEnd: 'plain target'.length })
    expect(unmapped.sentencePresentations[0].visualGroups).toBeUndefined()
  })

  test('拒絕超過文章 typing target 上限而不拆成多個 item', () => {
    const tooLongDocument: PracticeDocument = {
      ...document,
      sentences: [{ name: 'a'.repeat(MAX_ARTICLE_TYPING_LENGTH + 1), trans: [] }],
    }

    expect(() => createArticleTypingSession(tooLongDocument)).toThrow('這篇文章太長，請先縮短內容後再開始練習。')
  })
})

test.describe('Article Typing session', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const dismissButton = page.getByLabel('关闭提示')
    if (await dismissButton.isVisible().catch(() => false)) await dismissButton.click()
  })

  test('Practice 保持完整文章 typing item，但預設只 render 目前句 Romaji', async ({ page }) => {
    const session = createArticleTypingSession(japanesePracticeDocument)

    await page.evaluate((value) => {
      localStorage.setItem('practiceDocumentId', JSON.stringify(value.id))
      localStorage.setItem('pastedPracticeDocuments', JSON.stringify([value]))
    }, japanesePracticeDocument)
    await page.goto('/typing')
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('practice-romaji-typing-row').locator('[data-testid="practice-editable-letter"]')).toHaveText(
      session.typingTarget.slice(session.sentencePresentations[0].targetStart, session.sentencePresentations[0].targetEnd).split(''),
    )
  })

  for (const regressionDocument of cjkRegressionDocuments.slice(0, 2)) {
    test(`${regressionDocument.title} 的 editable Letters 不含 CJK、等於 typingTarget 且可完整輸入`, async ({ page }) => {
      const session = createArticleTypingSession(regressionDocument)
      await selectPracticeArticle(page, regressionDocument)
      await page.getByRole('button', { name: '繼續' }).click()

      const row = page.getByTestId('practice-romaji-typing-row')
      const editableLetters = row.getByTestId('practice-editable-letter')
      const editableText = await editableLetters.evaluateAll((letters) => letters.map((letter) => letter.textContent).join(''))
      expect(editableText).toBe(session.typingTarget)
      expect(containsJapaneseCharacters(editableText)).toBe(false)
      await expect(row).not.toContainText(regressionDocument.title.startsWith('七時') ? '七時' : '何度')

      await pressPhysicalText(page, session.typingTarget.slice(0, -1))
      await expect(page.locator('div.fixed.inset-0.z-30')).toHaveCount(0)
      await page.keyboard.press(session.typingTarget.at(-1) ?? '')
      await expect(page.locator('div.fixed.inset-0.z-30')).toBeVisible()
    })
  }

  for (const regressionDocument of numericPhysicalKeyDocuments) {
    test(`${regressionDocument.title} 以 shared physical keyboard 完成並顯示 100%`, async ({ page }) => {
      const session = createArticleTypingSession(regressionDocument)
      await selectPracticeArticle(page, regressionDocument)
      await page.getByRole('button', { name: '繼續' }).click()
      await expect(page.getByTestId('practice-japanese-display')).toHaveAttribute('aria-label', regressionDocument.sentences[0].name)

      await pressPhysicalText(page, session.typingTarget, 0, true)

      const resultScreen = page.locator('div.fixed.inset-0.z-30')
      await expect(resultScreen).toBeVisible()
      await expect(resultScreen.getByText('100%', { exact: true })).toBeVisible()
    })
  }

  test('Japanese Article colon uses ASCII Semicolon key and completes without full-width target leakage', async ({ page }) => {
    const regressionDocument: PracticeDocument = {
      id: 'article-full-width-colon-regression',
      title: '全形冒號 punctuation regression',
      source: 'fixture',
      language: 'ja',
      jlptLevel: 'N5',
      scenario: '測試',
      sentences: [
        {
          name: '彼女：今日、晩ご飯どうする？',
          notation: '彼女(かのじょ)：今日(きょう)、晩(ばん)ご飯(はん)どうする？',
          trans: ['她說：今天晚餐要怎麼辦？'],
        },
      ],
    }
    const session = createArticleTypingSession(regressionDocument)
    expect(session.typingTarget).toBe('kanojo:kyou,bangohandousuru?')
    expect(session.typingItem.name).toBe(session.typingTarget)
    expect(session.typingTarget).not.toContain('：')
    expect(session.typingItem.name).not.toContain('：')

    await selectPracticeArticle(page, regressionDocument)
    await page.getByRole('button', { name: '繼續' }).click()
    await pressPhysicalText(page, session.typingTarget.slice(0, -1))
    await page.evaluate(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Process', code: 'Slash', shiftKey: true, isComposing: true }),
      )
    })

    const resultScreen = page.locator('div.fixed.inset-0.z-30')
    await expect(resultScreen).toBeVisible()
    await expect(resultScreen.getByText('100%', { exact: true })).toBeVisible()
  })

  test('Article 普通錯字一次或連續五次都不顯示插件衝突，修正後可繼續', async ({ page }) => {
    const regressionDocument = cjkRegressionDocuments[0]
    const session = createArticleTypingSession(regressionDocument)
    await selectPracticeArticle(page, regressionDocument)
    await page.getByRole('button', { name: '繼續' }).click()

    const firstLetter = page.getByTestId('practice-editable-letter').first()
    await expect(page.getByText(/插件冲突|插件衝突/)).toHaveCount(0)

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await page.keyboard.press('x')
      await expect(firstLetter).toHaveClass(/text-red-400/)
      await expect(articleStat(page, '輸入數')).toHaveText(String(attempt))
      await expect(articleStat(page, '正確數')).toHaveText('0')
      await expect(page.getByText(/插件冲突|插件衝突/)).toHaveCount(0)
      await page.waitForTimeout(350)
    }

    await page.keyboard.press(session.typingTarget[0])
    await expect(firstLetter).toHaveClass(/text-green-400/)
    await expect(articleStat(page, '輸入數')).toHaveText('6')
    await expect(articleStat(page, '正確數')).toHaveText('1')
    await expect(page.getByText(/插件冲突|插件衝突/)).toHaveCount(0)
    await expect(page.getByRole('button', { name: '暫停' })).toBeVisible()
  })

  test('完整文章 renderer 同時顯示 metadata、全文閱讀資料與目前句 Romaji target', async ({ page }) => {
    const session = createArticleTypingSession(document)

    await page.evaluate((value) => {
      localStorage.setItem('practiceDocumentId', JSON.stringify(value.id))
      localStorage.setItem('pastedPracticeDocuments', JSON.stringify([value]))
    }, document)
    await page.goto('/typing')
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('practice-article-title')).toHaveText(document.title)
    await expect(page.getByTestId('practice-article-jlpt')).toHaveText('JLPT：N4')
    await expect(page.getByTestId('practice-article-scenario')).toHaveText('情境：測試')

    await page.getByRole('button', { name: '顯示全文' }).click()
    const japaneseDisplay = page.getByTestId('practice-full-article')
    const japaneseSentences = page.getByTestId('practice-japanese-sentence')
    await expect(japaneseSentences).toHaveCount(document.sentences.length)
    for (const [index, sentence] of document.sentences.entries()) {
      await expect(japaneseSentences.nth(index)).toHaveAttribute('aria-label', sentence.name)
      await expect(page.getByTestId('practice-translation-display')).toContainText(sentence.trans[0])
    }
    expect(await japaneseDisplay.locator('rt').count()).toBeGreaterThan(0)

    const romajiRow = page.getByTestId('practice-romaji-typing-row')
    expect(await romajiRow.evaluate((node) => node.textContent)).toBe(
      session.typingTarget.slice(session.sentencePresentations[0].targetStart, session.sentencePresentations[0].targetEnd),
    )
    expect(session.typingTarget).not.toContain(' ')
  })

  test('中長文章會換行且以既有 inputWord 長度標示目前字元', async ({ page }) => {
    const longDocument: PracticeDocument = {
      ...document,
      id: 'long-article-renderer',
      title: '中長文章測試',
      sentences: Array.from({ length: 9 }, (_, index) => ({
        name: `今日は日本語を勉強します。${index + 1}`,
        notation: `今日(きょう)は日本語(にほんご)を勉強(べんきょう)します。${index + 1}`,
        trans: [`第 ${index + 1} 句翻譯。`],
      })),
    }
    const session = createArticleTypingSession(longDocument)
    await page.evaluate((value) => {
      localStorage.setItem('practiceDocumentId', JSON.stringify(value.id))
      localStorage.setItem('pastedPracticeDocuments', JSON.stringify([value]))
    }, longDocument)
    await page.goto('/typing')
    await page.getByRole('button', { name: '繼續' }).click()

    const row = page.getByTestId('practice-romaji-typing-row')
    expect(await row.evaluate((node) => node.textContent)).toBe(
      session.typingTarget.slice(session.sentencePresentations[0].targetStart, session.sentencePresentations[0].targetEnd),
    )
    const dimensions = await row.evaluate((node) => ({ scrollWidth: node.scrollWidth, clientWidth: node.clientWidth }))
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)

    await pressPhysicalText(page, session.typingTarget.slice(0, 40))
    await expect(row.locator('[data-current-letter="true"]')).toHaveCount(1)
    expect(await row.locator('[data-current-letter="true"]').getAttribute('data-global-letter-index')).toBe('40')
  })

  test('超過文章 target 上限時顯示繁中錯誤而不建立多個 typing item', async ({ page }) => {
    const tooLongDocument: PracticeDocument = {
      ...document,
      id: 'too-long-practice-article',
      sentences: [{ name: 'a'.repeat(MAX_ARTICLE_TYPING_LENGTH + 1), trans: [] }],
    }

    await page.evaluate((value) => {
      localStorage.setItem('practiceDocumentId', JSON.stringify(value.id))
      localStorage.setItem('pastedPracticeDocuments', JSON.stringify([value]))
    }, tooLongDocument)
    await page.goto('/typing')

    await expect(page.getByRole('alert')).toHaveText('這篇文章太長，請先縮短內容後再開始練習。')
    await expect(page.getByTestId('practice-romaji-typing-row')).toHaveCount(0)
  })

  test('跨句不增加輸入字元、保持同一鍵盤路徑並以字元比例推進到最後才完成', async ({ page }) => {
    const session = createArticleTypingSession(japanesePracticeDocument)
    const firstSentenceTarget = getPracticeTypingTarget(japanesePracticeDocument.sentences[0])

    await page.evaluate((value) => {
      localStorage.setItem('practiceDocumentId', JSON.stringify(value.id))
      localStorage.setItem('pastedPracticeDocuments', JSON.stringify([value]))
    }, japanesePracticeDocument)
    await page.goto('/typing')
    await page.getByRole('button', { name: '繼續' }).click()
    await expect(page.getByTestId('practice-japanese-display')).toHaveAttribute('aria-label', japanesePracticeDocument.sentences[0].name)

    await pressPhysicalText(page, firstSentenceTarget)
    await expect(page.locator('div.fixed.inset-0.z-30')).toHaveCount(0)
    const secondSentenceLetters = page.getByTestId('practice-romaji-typing-row').locator('[data-testid="practice-editable-letter"]')
    await expect(secondSentenceLetters.first()).toHaveText(session.typingTarget[firstSentenceTarget.length])
    await expect(page.getByTestId('practice-romaji-typing-row').locator('[data-current-letter="true"]')).toHaveAttribute(
      'data-global-letter-index',
      String(firstSentenceTarget.length),
    )
    await page.keyboard.press(session.typingTarget[firstSentenceTarget.length])
    await expect(secondSentenceLetters.first()).toHaveClass(/text-green-400/)
    await expect(page.getByText('錯誤次數', { exact: true })).toHaveCount(0)

    const expectedProgress = Math.floor(((firstSentenceTarget.length + 1) / session.typingLength) * 100)
    await expect(page.getByTestId('article-progress')).toHaveAttribute('aria-valuenow', String(expectedProgress))

    const mistakeIndex = firstSentenceTarget.length + 1
    await page.keyboard.press('x')
    await expect(secondSentenceLetters.nth(1)).toHaveClass(/text-red-400/)
    await page.waitForTimeout(350)
    await page.keyboard.press(session.typingTarget[mistakeIndex])
    await expect(secondSentenceLetters.nth(1)).toHaveClass(/text-green-400/)

    await pressPhysicalText(page, session.typingTarget.slice(mistakeIndex + 1, -1), mistakeIndex + 1)
    await expect(page.locator('div.fixed.inset-0.z-30')).toHaveCount(0)
    await page.keyboard.press(session.typingTarget.at(-1) ?? '')
    await expect(page.locator('div.fixed.inset-0.z-30')).toHaveCount(1)
  })
})

test.describe('Phase D.6 current sentence Romaji', () => {
  test('十句文章以 shared 導覽切換目前句，不改變全篇統計、進度或完成流程', async ({ page }) => {
    const sentenceNames = ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ']
    const navigationDocument: PracticeDocument = {
      ...document,
      id: 'article-sentence-navigation-regression',
      title: '十句導覽測試',
      sentences: sentenceNames.map((name, index) => ({
        name,
        notation: name,
        trans: [`第 ${index + 1} 句翻譯。`],
      })),
    }
    const session = createArticleTypingSession(navigationDocument)
    const firstSentence = session.sentencePresentations[0]

    await installSentenceSpeechMock(page)
    await selectPracticeArticle(page, navigationDocument)
    await page.getByRole('button', { name: '繼續' }).click()

    await expect(page.getByTestId('practice-prev-word')).toHaveCount(0)
    await expect(page.getByTestId('practice-next-word')).toBeVisible()
    await pressPhysicalText(page, session.typingTarget.slice(0, firstSentence.targetEnd))
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 2 / 10')

    const correctCount = String(firstSentence.targetEnd)
    const progress = String(Math.floor((firstSentence.targetEnd / session.typingLength) * 100))
    await expect(articleStat(page, '正確數')).toHaveText(correctCount)
    await expect(page.getByTestId('article-progress')).toHaveAttribute('aria-valuenow', progress)

    await page.getByTestId('practice-prev-word').click()
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 1 / 10')
    await expect(page.getByTestId('practice-japanese-display')).toHaveAttribute('aria-label', navigationDocument.sentences[0].name)

    await page.getByTestId('practice-next-word').click()
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 2 / 10')
    await expect(page.getByTestId('practice-japanese-display')).toHaveAttribute('aria-label', navigationDocument.sentences[1].name)

    await page.getByTestId('practice-prev-word').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 1 / 10')
    await page.getByTestId('practice-next-word').focus()
    await page.keyboard.press('Space')
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 2 / 10')

    await page.keyboard.press('Control+Shift+ArrowLeft')
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 1 / 10')
    await page.keyboard.press('Control+Shift+ArrowRight')
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 2 / 10')
    await expect(articleStat(page, '正確數')).toHaveText(correctCount)
    await expect(page.getByTestId('article-progress')).toHaveAttribute('aria-valuenow', progress)

    await page.getByRole('button', { name: '朗讀目前句' }).click()
    await expect
      .poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').at(-1)?.text))
      .toBe(navigationDocument.sentences[1].name)

    const lastSentence = session.sentencePresentations.at(-1)!
    await page.keyboard.type(session.typingTarget.slice(firstSentence.targetEnd, lastSentence.targetStart))
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 10 / 10')
    await expect(page.getByTestId('practice-next-word')).toHaveCount(0)
    await page.keyboard.type(session.typingTarget.slice(lastSentence.targetStart))
    await expect(page.getByTestId('article-result-screen')).toBeVisible()
  })

  test('Phase D.6 Romaji 主區只顯示目前第一句的 editable Letters', async ({ page }) => {
    const session = createArticleTypingSession(document)
    const firstSentence = session.sentencePresentations[0]

    await selectPracticeArticle(page, document)

    const editableLetters = page.getByTestId('practice-romaji-typing-row').getByTestId('practice-editable-letter')
    await expect(editableLetters.first()).toBeVisible()
    expect(await editableLetters.evaluateAll((letters) => letters.map((letter) => letter.textContent).join(''))).toBe(
      session.typingTarget.slice(firstSentence.targetStart, firstSentence.targetEnd),
    )
    await expect(editableLetters).toHaveCount(firstSentence.targetEnd - firstSentence.targetStart)
  })

  test('Phase D.6 continuous typing 保留 global Letter index、錯字狀態與全文 Progress', async ({ page }) => {
    const session = createArticleTypingSession(document)
    const firstSentence = session.sentencePresentations[0]
    const secondSentence = session.sentencePresentations[1]
    await selectPracticeArticle(page, document)
    await page.getByRole('button', { name: '繼續' }).click()

    await pressPhysicalText(page, session.typingTarget.slice(firstSentence.targetStart, firstSentence.targetEnd), firstSentence.targetStart)

    const row = page.getByTestId('practice-romaji-typing-row')
    const visibleLetters = row.getByTestId('practice-editable-letter')
    expect(await visibleLetters.evaluateAll((letters) => letters.map((letter) => letter.textContent).join(''))).toBe(
      session.typingTarget.slice(secondSentence.targetStart, secondSentence.targetEnd),
    )
    await expect(visibleLetters.first()).toHaveAttribute('data-global-letter-index', String(secondSentence.targetStart))
    await page.keyboard.press(session.typingTarget[secondSentence.targetStart])
    await expect(visibleLetters.first()).toHaveClass(/text-green-400/)

    await page.keyboard.press('x')
    await expect(visibleLetters.nth(1)).toHaveClass(/text-red-400/)
    await page.waitForTimeout(350)
    await page.keyboard.press(session.typingTarget[secondSentence.targetStart + 1])
    await expect(visibleLetters.nth(1)).toHaveClass(/text-green-400/)

    const expectedProgress = Math.floor(((secondSentence.targetStart + 2) / session.typingLength) * 100)
    await expect(page.getByTestId('article-progress')).toHaveAttribute('aria-valuenow', String(expectedProgress))
    await expect(page.getByRole('button', { name: '暫停' })).toBeVisible()
    await expect(page.locator('div.fixed.inset-0.z-30')).toHaveCount(0)
  })

  test('Restart 從第二句回到第一句並讓自動朗讀只 enqueue 第一句一次', async ({ page }) => {
    const session = createArticleTypingSession(document)
    const firstSentence = session.sentencePresentations[0]
    await installSentenceSpeechMock(page)
    await selectPracticeArticle(page, document)
    await page.getByRole('button', { name: '繼續' }).click()
    await expect.poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak'))).toHaveLength(1)

    await pressPhysicalText(page, session.typingTarget.slice(firstSentence.targetStart, firstSentence.targetEnd), firstSentence.targetStart)
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 2 / 3')
    await expect.poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak'))).toHaveLength(2)

    await page.getByRole('button', { name: '暫停' }).click()
    await page.getByRole('button', { name: '繼續' }).hover()
    await page.getByRole('button', { name: '重新' }).click()

    await expect(page.getByTestId('article-progress')).toHaveAttribute('aria-valuenow', '0')
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 1 / 3')
    await expect(page.getByTestId('practice-japanese-display')).toHaveAttribute('aria-label', document.sentences[0].name)
    await expect(page.getByTestId('practice-japanese-display')).not.toHaveAttribute('aria-label', document.sentences[1].name)
    await expect(page.getByTestId('practice-romaji-typing-row').getByTestId('practice-editable-letter')).toHaveCount(
      firstSentence.targetEnd - firstSentence.targetStart,
    )
    await expect.poll(() => page.evaluate(() => document.activeElement === document.body)).toBe(true)
    await page.keyboard.press(session.typingTarget[0])
    await expect(page.getByTestId('practice-romaji-typing-row').locator('[data-current-letter="true"]')).toHaveAttribute(
      'data-global-letter-index',
      '1',
    )
    await expect.poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak'))).toHaveLength(3)
    await expect
      .poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').at(-1)?.text))
      .toBe(document.sentences[0].name)
  })

  test.describe('sentence speech', () => {
    test.describe.configure({ mode: 'serial' })

    test('Phase D.6 新句只自動朗讀一次，手動重播與快速跨句會先取消前一句', async ({ page }) => {
      const session = createArticleTypingSession(document)
      await installSentenceSpeechMock(page)
      await selectPracticeArticle(page, document)
      await page.getByRole('button', { name: '繼續' }).click()

      await expect
        .poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak')))
        .toMatchObject([{ type: 'speak', text: document.sentences[0].name, lang: 'ja-JP' }])

      await page.getByRole('button', { name: '顯示讀音' }).click()
      await page.getByRole('button', { name: '顯示全文' }).click()
      await expect.poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak'))).toHaveLength(1)

      await page.getByRole('button', { name: '朗讀目前句' }).click()
      await expect.poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak'))).toHaveLength(2)

      await pressPhysicalText(page, session.typingTarget.slice(0, session.sentencePresentations[0].targetEnd))
      await expect
        .poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').at(-1)))
        .toMatchObject({ type: 'speak', text: document.sentences[1].name, lang: 'ja-JP' })

      await pressPhysicalText(
        page,
        session.typingTarget.slice(session.sentencePresentations[1].targetStart, session.sentencePresentations[1].targetEnd),
        session.sentencePresentations[1].targetStart,
      )
      await expect
        .poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').at(-1)))
        .toMatchObject({ type: 'speak', text: document.sentences[2].name, lang: 'ja-JP' })
      const events = await page.evaluate(() => window.__phaseD6SpeechEvents)
      const thirdSentenceSpeakIndex = events.findIndex((event) => event.type === 'speak' && event.text === document.sentences[2].name)
      expect(events.slice(0, thirdSentenceSpeakIndex).some((event) => event.type === 'cancel')).toBe(true)

      await page.getByRole('button', { name: '暫停' }).click()
      await expect.poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.at(-1))).toEqual({ type: 'cancel' })
      const speakCountBeforeResume = events.filter((event) => event.type === 'speak').length
      await page.getByRole('button', { name: '繼續' }).press('Enter')
      await expect
        .poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak')))
        .toHaveLength(speakCountBeforeResume)
    })

    test('連續切換四句時每個新句只 enqueue 一次，舊 utterance callback 不污染目前句', async ({ page }) => {
      const session = createArticleTypingSession(fourSentenceSpeechDocument)
      await installSentenceSpeechMock(page)
      await selectPracticeArticle(page, fourSentenceSpeechDocument)
      await page.getByRole('button', { name: '繼續' }).click()

      for (const [sentenceIndex, presentation] of session.sentencePresentations.slice(0, -1).entries()) {
        await expect
          .poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').length))
          .toBe(sentenceIndex + 1)
        await pressPhysicalText(
          page,
          session.typingTarget.slice(presentation.targetStart, presentation.targetEnd),
          presentation.targetStart,
        )
      }

      await expect.poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').length)).toBe(4)
      await page.evaluate(() => window.__phaseD6DispatchSpeechEvent(0, 'end'))
      await page.getByRole('button', { name: '顯示讀音' }).click()

      const spokenTexts = await page.evaluate(() =>
        window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').map((event) => event.text),
      )
      expect(spokenTexts).toEqual(fourSentenceSpeechDocument.sentences.map((sentence) => sentence.name))
    })

    test('Phase D.6 關閉自動朗讀仍允許手動朗讀', async ({ page }) => {
      await installSentenceSpeechMock(page)
      await page.goto('/')
      await page.evaluate((practiceDocument) => {
        localStorage.setItem('articleSpeechConfig', JSON.stringify({ autoReadSentence: false }))
        localStorage.setItem('practiceDocumentId', JSON.stringify(practiceDocument.id))
        localStorage.setItem('pastedPracticeDocuments', JSON.stringify([practiceDocument]))
      }, document)
      await page.goto('/typing')
      await page.getByRole('button', { name: '繼續' }).click()

      await expect.poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak'))).toHaveLength(0)
      await page.getByRole('button', { name: '朗讀目前句' }).click()
      await expect
        .poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak')))
        .toMatchObject([{ type: 'speak', text: document.sentences[0].name, lang: 'ja-JP' }])
    })

    test('自動朗讀關閉後略過新句，重新開啟只從後續新句恢復，Pause／Resume 不重播', async ({ page }) => {
      const session = createArticleTypingSession(fourSentenceSpeechDocument)
      await installSentenceSpeechMock(page)
      await selectPracticeArticle(page, fourSentenceSpeechDocument)
      await page.getByRole('button', { name: '繼續' }).click()
      await expect.poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').length)).toBe(1)

      const autoRead = page.getByRole('button', { name: '新句自動朗讀' })
      await autoRead.click()
      await expect.poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak'))).toHaveLength(1)
      await pressPhysicalText(
        page,
        session.typingTarget.slice(session.sentencePresentations[0].targetStart, session.sentencePresentations[0].targetEnd),
        session.sentencePresentations[0].targetStart,
      )
      await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 2 / 4')
      await expect.poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak'))).toHaveLength(1)

      await autoRead.click()
      await expect.poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak'))).toHaveLength(1)
      await pressPhysicalText(
        page,
        session.typingTarget.slice(session.sentencePresentations[1].targetStart, session.sentencePresentations[1].targetEnd),
        session.sentencePresentations[1].targetStart,
      )
      await expect
        .poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').at(-1)))
        .toMatchObject({ text: fourSentenceSpeechDocument.sentences[2].name })

      const speakCountBeforePause = await page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').length)
      await page.getByRole('button', { name: '暫停' }).click()
      await expect.poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.at(-1))).toEqual({ type: 'cancel' })
      await page.getByRole('button', { name: '繼續' }).click()
      await expect
        .poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').length))
        .toBe(speakCountBeforePause)
    })

    test('日文語音與語速會套用到自動與手動朗讀，並在重新載入後恢復', async ({ page }) => {
      await installSentenceSpeechMock(page)
      await selectPracticeArticle(page, document)

      const voiceSelector = page.getByLabel('日文語音')
      const rateSelector = page.getByLabel('日文語速')
      await expect(voiceSelector).toHaveValue('ja-local')
      await expect(voiceSelector.locator('option')).toHaveText(['圭太｜日語｜本機', '七海｜日語｜自然語音｜雲端'])

      await voiceSelector.selectOption('ja-cloud')
      await rateSelector.selectOption('1.1')
      await page.getByRole('button', { name: '繼續' }).click()
      await expect
        .poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').at(-1)))
        .toMatchObject({
          text: document.sentences[0].name,
          voiceURI: 'ja-cloud',
          rate: 1.1,
        })

      await page.getByRole('button', { name: '朗讀目前句' }).click()
      await expect.poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak'))).toHaveLength(2)
      await expect
        .poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').at(-1)))
        .toMatchObject({ voiceURI: 'ja-cloud', rate: 1.1 })

      await voiceSelector.selectOption('ja-local')
      await page.getByRole('button', { name: '朗讀目前句' }).click()
      await expect
        .poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').at(-1)))
        .toMatchObject({ voiceURI: 'ja-local', rate: 1.1 })

      await page.reload()
      await expect(page.getByLabel('日文語音')).toHaveValue('ja-local')
      await expect(page.getByLabel('日文語速')).toHaveValue('1.1')
      await page.getByRole('button', { name: '繼續' }).click()
      await expect
        .poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').at(-1)))
        .toMatchObject({ voiceURI: 'ja-local', rate: 1.1 })
    })

    test('沒有日文語音時保留瀏覽器 fallback 而不會中斷文章朗讀', async ({ page }) => {
      await installSentenceSpeechMock(page, [{ lang: 'en-US', name: 'English', voiceURI: 'en-us', localService: true }])
      await selectPracticeArticle(page, document)

      await expect(page.getByLabel('日文語音')).toBeDisabled()
      await expect(page.getByLabel('日文語音')).toHaveValue('')
      await page.getByRole('button', { name: '繼續' }).click()
      await expect
        .poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').at(-1)))
        .toMatchObject({
          text: document.sentences[0].name,
          lang: 'ja-JP',
          voiceURI: undefined,
        })
    })
  })

  test('Phase D.6 九句文章到 4/9 時 Romaji 不累積且沒有水平溢位', async ({ page }) => {
    const longDocument: PracticeDocument = {
      ...document,
      id: 'phase-d6-nine-sentences',
      sentences: Array.from({ length: 9 }, (_, index) => ({
        name: `今日は日本語を勉強します。${index + 1}`,
        notation: `今日(きょう)は日本語(にほんご)を勉強(べんきょう)します。${index + 1}`,
        trans: [`第 ${index + 1} 句翻譯。`],
      })),
    }
    const session = createArticleTypingSession(longDocument)
    await page.goto('/')
    await page.evaluate((practiceDocument) => {
      localStorage.setItem('articleSpeechConfig', JSON.stringify({ autoReadSentence: false }))
      localStorage.setItem('practiceDocumentId', JSON.stringify(practiceDocument.id))
      localStorage.setItem('pastedPracticeDocuments', JSON.stringify([practiceDocument]))
    }, longDocument)
    await page.goto('/typing')
    await page.getByRole('button', { name: '繼續' }).click()

    const fourthSentence = session.sentencePresentations[3]
    await pressPhysicalText(page, session.typingTarget.slice(0, fourthSentence.targetStart))
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 4 / 9')
    const row = page.getByTestId('practice-romaji-typing-row')
    expect(
      await row
        .locator('[data-testid="practice-editable-letter"]')
        .evaluateAll((letters) => letters.map((letter) => letter.textContent).join('')),
    ).toBe(session.typingTarget.slice(fourthSentence.targetStart, fourthSentence.targetEnd))
    const dimensions = await row.evaluate((node) => ({ scrollWidth: node.scrollWidth, clientWidth: node.clientWidth }))
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
    await expect(row.locator('[data-current-letter="true"]')).toHaveAttribute(
      'data-global-letter-index',
      String(fourthSentence.targetStart),
    )
  })
})

test.describe('Phase E Article ResultScreen', () => {
  test('文章完成頁只顯示文章 metadata、全文統計與兩個正式動作，再練一次會重設同一 session', async ({ page }) => {
    await installSentenceSpeechMock(page)
    const session = await completeArticle(page, resultScreenDocument)
    const resultScreen = page.getByTestId('article-result-screen')

    await expect(resultScreen).toBeVisible()
    await expect(resultScreen.getByRole('heading', { name: resultScreenDocument.title })).toBeVisible()
    await expect(resultScreen).toContainText('JLPT：N4')
    await expect(resultScreen).toContainText('情境：車站')
    await expect(resultScreen).toContainText('完成時間')
    await expect(resultScreen).toContainText('字/分鐘')
    await expect(resultScreen).toContainText('正確率')
    await expect(resultScreen).toContainText('錯誤數')
    await expect(resultScreen.getByTestId('article-completion-status')).toHaveText('全文完成：已完成')
    await expect(resultScreen.getByRole('button')).toHaveCount(2)
    await expect(resultScreen.getByRole('button', { name: '再練一次' })).toBeVisible()
    await expect(resultScreen.getByRole('button', { name: '返回文章庫' })).toBeVisible()
    await expect(resultScreen.getByText(/下一章|下一個單字|切回單字模式|Dictionary|錯題/)).toHaveCount(0)
    await expect(resultScreen.locator('[data-testid="word-chip"]')).toHaveCount(0)

    const speakCountBeforeRepeat = await page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').length)
    await resultScreen.getByRole('button', { name: '再練一次' }).click()

    await expect(page).toHaveURL(/\/typing$/)
    await expect(resultScreen).toHaveCount(0)
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 1 / 1')
    await expect(page.getByTestId('article-progress')).toHaveAttribute('aria-valuenow', '0')
    await expect(articleStat(page, '輸入數')).toHaveText('0')
    await expect(articleStat(page, '正確數')).toHaveText('0')
    await expect(page.getByTestId('practice-editable-letter').first()).toHaveAttribute('data-global-letter-index', '0')
    await expect
      .poll(() => page.evaluate(() => window.__phaseD6SpeechEvents.filter((event) => event.type === 'speak').length))
      .toBe(speakCountBeforeRepeat + 1)
    expect(session.typingTarget).toBe(createArticleTypingSession(resultScreenDocument).typingTarget)
  })

  test('返回文章庫由文章完成頁直接導向根路由且不 fallback Dictionary', async ({ page }) => {
    await completeArticle(page, resultScreenDocument)
    const resultScreen = page.getByTestId('article-result-screen')

    await resultScreen.getByRole('button', { name: '返回文章庫' }).click()

    await expect(page).toHaveURL(/\/ja\/articles$/)
    await expect(page.getByRole('heading', { name: '文章庫' })).toBeVisible()
    await expect(page.getByText('cancel', { exact: true })).toHaveCount(0)
    await expect(page.getByTestId('article-result-screen')).toHaveCount(0)
  })
})

test.describe('Phase C Article Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  const selectArticle = async (page: Page, value: PracticeDocument) => {
    await page.evaluate((document) => {
      localStorage.setItem('practiceDocumentId', JSON.stringify(document.id))
      localStorage.setItem('pastedPracticeDocuments', JSON.stringify([document]))
    }, value)
    await page.goto('/typing')
  }

  test('Phase D root shows the Article Library instead of a default article', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '文章庫' })).toBeVisible()
    await expect(page.getByTestId('practice-article-title')).toHaveCount(0)
    await expect(page.getByText('CET-4', { exact: true })).toHaveCount(0)
  })

  test('only exposes article controls in the formal header', async ({ page }) => {
    await selectArticle(page, document)

    await expect(page.getByRole('link', { name: '返回文章庫' })).toHaveAttribute('href', '/ja/articles')
    await expect(page.getByTestId('article-header-title')).toHaveText(document.title)
    await expect(page.getByTestId('article-header-jlpt')).toHaveText('JLPT：N4')
    await expect(page.getByTestId('article-header-scenario')).toHaveText('情境：測試')
    await expect(page.getByRole('button', { name: '顯示讀音' })).toBeVisible()
    await expect(page.getByRole('button', { name: '振假名' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '音效', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '繼續' })).toBeVisible()

    await expect(page.getByText('CET-4', { exact: true })).toHaveCount(0)
    await expect(page.getByText(/第 1 章/, { exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Skip' })).toHaveCount(0)
    await expect(page.getByText('切回單字模式', { exact: true })).toHaveCount(0)
    await expect(page.getByText('错题本', { exact: true })).toHaveCount(0)
    await expect(page.getByText('查看数据统计', { exact: true })).toHaveCount(0)
  })

  test('Header 操作按鈕維持單行，Pause action 浮層不改變 header 高度且日文語音選單可縮小', async ({ page }, testInfo) => {
    const session = createArticleTypingSession(document)
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await selectArticle(page, document)
    const displayReading = page.getByRole('button', { name: '顯示讀音' })
    const resume = page.getByRole('button', { name: '繼續' })
    const darkMode = page.getByRole('button', { name: '切換深色模式' })
    await expect(displayReading).toHaveCSS('white-space', 'nowrap')
    await expect(resume).toHaveCSS('white-space', 'nowrap')
    await expect(page.getByLabel('日文語音')).toHaveCSS('min-width', '0px')

    const navigation = page.getByRole('navigation', { name: '文章練習控制' })
    const controlsGroup = page.getByTestId('practice-header-controls')
    const layout = await navigation.evaluate((nav) => {
      const children = Array.from(nav.children) as HTMLElement[]
      const rects = children.map((control) => {
        const rect = control.getBoundingClientRect()
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }
      })
      return {
        flexWrap: getComputedStyle(nav).flexWrap,
        overlaps: rects.slice(1).some((rect, index) => rect.left < rects[index].right - 0.5),
      }
    })
    expect(layout).toEqual({ flexWrap: 'nowrap', overlaps: false })
    await expect(controlsGroup).toHaveCSS('flex-wrap', 'nowrap')
    await expect(controlsGroup).toHaveCSS('flex-shrink', '0')
    await expect(darkMode).toHaveCSS('flex-shrink', '0')

    await resume.click()
    const pause = page.getByRole('button', { name: '暫停' })
    await pressPhysicalText(page, session.typingTarget.slice(0, 3))
    await expect(page.getByTestId('article-progress')).not.toHaveAttribute('aria-valuenow', '0')
    await expect(pause).toHaveCSS('white-space', 'nowrap')
    const pauseRect = await pause.boundingBox()
    const darkModeRect = await darkMode.boundingBox()
    expect(pauseRect).not.toBeNull()
    expect(darkModeRect).not.toBeNull()
    expect(pauseRect!.x + pauseRect!.width).toBeLessThanOrEqual(darkModeRect!.x)
    await page.screenshot({ path: testInfo.outputPath('article-header-1920x1080.png') })
    await pause.click()
    const pauseActions = page.getByTestId('pause-actions')
    const pausedResume = pauseActions.getByRole('button', { name: '繼續' })
    const restart = page.getByRole('button', { name: '重新' })
    await page.mouse.move(0, 0)
    await page.getByRole('link', { name: '返回文章庫' }).focus()
    await expect(restart).toBeHidden()
    const pausedHeaderRect = await navigation.boundingBox()
    await pausedResume.hover()
    await expect(restart).toBeVisible()
    await expect(restart).toHaveCSS('white-space', 'nowrap')
    const [pauseContainerRect, pausedResumeRect, restartRect] = await Promise.all([
      pauseActions.boundingBox(),
      pausedResume.boundingBox(),
      restart.boundingBox(),
    ])
    expect(restartRect).not.toBeNull()
    expect(pausedResumeRect).not.toBeNull()
    expect(pauseContainerRect).not.toBeNull()
    expect(pauseContainerRect!.height).toBe(40)
    expect(restartRect!.y - (pausedResumeRect!.y + pausedResumeRect!.height)).toBe(6)
    expect(restartRect!.y).toBeGreaterThanOrEqual(pauseContainerRect!.y + pauseContainerRect!.height)
    expect(restartRect!.x + restartRect!.width).toBeLessThanOrEqual(pauseContainerRect!.x + pauseContainerRect!.width)
    expect((await navigation.boundingBox())!.height).toBe(pausedHeaderRect!.height)

    await restart.click()
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 1 / 3')
    await expect(page.getByTestId('article-progress')).toHaveAttribute('aria-valuenow', '0')
  })

  test('日文語音與語速 select 完全移除原生下拉箭頭', async ({ page }) => {
    await selectArticle(page, document)

    for (const label of ['日文語音', '日文語速']) {
      const select = page.getByLabel(label)
      await expect(select).toHaveCSS('appearance', 'none')
      await expect(select).toHaveCSS('background-image', 'none')
    }
  })

  test('音效設定使用繁體文案，並持久化按鍵與效果音音量', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('keySoundsConfig')
      localStorage.removeItem('hintSoundsConfig')
    })
    await selectArticle(page, document)

    await expect(page.getByRole('button', { name: '顯示讀音' })).toBeVisible()
    await expect(page.getByRole('button', { name: '繼續' })).toBeVisible()
    await page.getByRole('button', { name: '音效', exact: true }).click()
    await expect(page.getByText('開關按鍵音', { exact: true })).toBeVisible()
    await expect(page.getByLabel('按鍵音色')).toBeVisible()
    await expect(page.getByText('開關效果音', { exact: true })).toBeVisible()
    await expect(page.getByText('开关按键音', { exact: true })).toHaveCount(0)
    await expect(page.getByLabel('按鍵音音量')).toHaveAttribute('max', '150')
    await expect(page.getByLabel('效果音音量')).toHaveAttribute('max', '100')
    await expect(page.getByLabel('按鍵音音量')).toHaveValue('100')
    await expect(page.getByLabel('效果音音量')).toHaveValue('100')
    await expect(page.getByText('100%', { exact: true })).toHaveCount(2)

    await page.getByLabel('按鍵音音量').fill('150')
    await expect(page.getByText('150%', { exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('keySoundsConfig') ?? 'null')?.volume)).toBe(1.5)
    await page.getByLabel('按鍵音音量').fill('100')
    await page.getByLabel('效果音音量').fill('30')
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('hintSoundsConfig') ?? 'null')?.volume)).toBe(0.3)
    await page.getByLabel('效果音音量').fill('100')
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('keySoundsConfig') ?? 'null')?.volume)).toBe(1)
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('hintSoundsConfig') ?? 'null')?.volume)).toBe(1)

    await page.getByLabel('按鍵音音量').fill('72')
    await page.getByLabel('效果音音量').fill('18')

    const switches = page.getByRole('switch')
    await switches.nth(0).click()
    await switches.nth(0).click()
    await switches.nth(1).click()
    await switches.nth(1).click()
    await expect(page.getByLabel('按鍵音音量')).toHaveValue('72')
    await expect(page.getByLabel('效果音音量')).toHaveValue('18')

    await page.reload()
    await page.getByRole('button', { name: '音效', exact: true }).click()
    await expect(page.getByLabel('按鍵音音量')).toHaveValue('72')
    await expect(page.getByLabel('效果音音量')).toHaveValue('18')
  })

  test('按鍵音 100%／150% 使用 3.0／6.0 獨立 gain，效果音 100% 仍是 1.0', async ({ page }) => {
    await page.addInitScript(() => {
      const originalCreateGain = BaseAudioContext.prototype.createGain
      const gainValues: number[] = []
      Object.defineProperty(window, '__testGainValues', { configurable: true, value: gainValues })
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
    await page.evaluate(() => {
      localStorage.removeItem('keySoundsConfig')
      localStorage.removeItem('hintSoundsConfig')
    })
    await selectArticle(page, document)
    await page.getByRole('button', { name: '音效', exact: true }).click()
    await page.getByLabel('按鍵音音量').fill('150')
    await page.getByLabel('效果音音量').fill('100')
    await page.getByRole('button', { name: '音效', exact: true }).click()
    await page.getByRole('button', { name: '繼續' }).click()
    await page.evaluate(() => ((window as Window & { __testGainValues: number[] }).__testGainValues.length = 0))
    await page.keyboard.press('k')
    await expect.poll(() => page.evaluate(() => (window as Window & { __testGainValues: number[] }).__testGainValues)).toContain(6)

    await page.getByRole('button', { name: '音效', exact: true }).click()
    await page.getByLabel('按鍵音音量').fill('100')
    await page.getByRole('button', { name: '音效', exact: true }).click()
    await page.evaluate(() => ((window as Window & { __testGainValues: number[] }).__testGainValues.length = 0))
    await page.keyboard.press('i')
    const keySoundAtOneHundred = await page.evaluate(() => (window as Window & { __testGainValues: number[] }).__testGainValues)
    expect(keySoundAtOneHundred).not.toContain(6)
    expect(keySoundAtOneHundred).toContain(3)

    await page.evaluate(() => ((window as Window & { __testGainValues: number[] }).__testGainValues.length = 0))
    await page.keyboard.press('z')
    const effectGainValues = await page.evaluate(() => (window as Window & { __testGainValues: number[] }).__testGainValues)
    expect(effectGainValues).not.toContain(3)
    expect(effectGainValues).not.toContain(6)
    expect(effectGainValues).toContain(1)
  })

  test('正確按鍵音在 React state 與統計 dispatch 前同步觸發', () => {
    const source = readFileSync('src/pages/Typing/components/WordPanel/components/Word/index.tsx', 'utf8')
    const updateInputStart = source.indexOf('const updateInput = useCallback')
    const playIndex = source.indexOf('playKeySound()', updateInputStart)
    const stateIndex = source.indexOf('setWordState(result.nextState)', updateInputStart)
    const dispatchIndex = source.indexOf('dispatch({ type: TypingStateActionType.REPORT_CORRECT_WORD })', updateInputStart)

    expect(playIndex).toBeGreaterThan(updateInputStart)
    expect(playIndex).toBeLessThan(stateIndex)
    expect(playIndex).toBeLessThan(dispatchIndex)
  })

  test('漢字與假名主文字基線在顯示讀音開關前後一致', async ({ page }, testInfo) => {
    const baselineDocument: PracticeDocument = {
      id: 'japanese-baseline-regression',
      title: '日文基線驗收',
      source: 'fixture',
      language: 'ja',
      sentences: [
        { name: 'すみません、新宿へ行きたいです', notation: 'すみません、新宿(しんじゅく)へ行(い)きたいです', trans: ['我想去新宿。'] },
        { name: '今日は浅草へ行きました', notation: '今日(きょう)は浅草(あさくさ)へ行(い)きました', trans: ['今天去了淺草。'] },
        { name: '台湾から来ました', notation: '台湾(たいわん)から来(き)ました', trans: ['我從台灣來。'] },
      ],
    }
    await selectArticle(page, baselineDocument)
    await page.getByRole('button', { name: '顯示全文' }).click()

    const readBaselineMetrics = () =>
      page.getByTestId('practice-japanese-sentence').evaluateAll((sentences) =>
        sentences.map((sentence) => {
          const ruby = sentence.querySelector('ruby')
          const rubyText = ruby ? Array.from(ruby.childNodes).find((node) => node.nodeType === Node.TEXT_NODE) : undefined
          const kanaButton = Array.from(sentence.querySelectorAll('button')).find((button) => !button.querySelector('ruby'))
          const kanaText = kanaButton ? Array.from(kanaButton.childNodes).find((node) => node.nodeType === Node.TEXT_NODE) : undefined
          const rectFor = (node?: ChildNode) => {
            if (!node) return null
            const range = document.createRange()
            range.selectNodeContents(node)
            const rect = range.getBoundingClientRect()
            return { top: rect.top, bottom: rect.bottom }
          }
          const rubyRect = rectFor(rubyText)
          const kanaRect = rectFor(kanaText)
          return {
            alignItems: getComputedStyle(sentence).alignItems,
            rubyVerticalAlign: ruby ? getComputedStyle(ruby).verticalAlign : '',
            baselineDelta: rubyRect && kanaRect ? Math.abs(rubyRect.bottom - kanaRect.bottom) : Number.POSITIVE_INFINITY,
          }
        }),
      )

    for (const showFurigana of [true, false]) {
      if (!showFurigana) await page.getByRole('button', { name: '顯示讀音' }).click()
      const metrics = await readBaselineMetrics()
      expect(metrics).toHaveLength(3)
      for (const metric of metrics) {
        expect(metric.alignItems).toBe('baseline')
        expect(metric.rubyVerticalAlign).toBe('baseline')
        expect(metric.baselineDelta).toBeLessThanOrEqual(1)
      }
      if (showFurigana) {
        await page.screenshot({ path: testInfo.outputPath('japanese-ruby-baseline.png') })
      }
    }
  })

  test('Phase C Article Header controls remain interactive', async ({ page }) => {
    await selectArticle(page, document)

    await page.getByRole('button', { name: '顯示讀音' }).click()
    await expect(page.getByTestId('practice-japanese-display').locator('rt')).toHaveCount(0)
    await page.getByRole('button', { name: '顯示讀音' }).click()
    await expect(page.getByTestId('practice-japanese-display').locator('rt').first()).toBeVisible()

    await page.getByRole('button', { name: '音效', exact: true }).click()
    await expect(page.getByText('開關按鍵音', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: '繼續' }).click()
    await expect(page.getByRole('button', { name: '暫停' })).toBeVisible()
    await page.getByRole('button', { name: '暫停' }).press('Enter')
    await expect(page.getByRole('button', { name: '繼續' })).toBeVisible()

    await page.getByRole('link', { name: '返回文章庫' }).click()
    await expect(page).toHaveURL(/\/ja\/articles$/)
  })

  test('shared sound preset selector updates and restores the existing resource', async ({ page }) => {
    await selectArticle(page, document)

    await page.getByRole('button', { name: '音效', exact: true }).click()
    const soundSelector = page.getByLabel('按鍵音色')
    await expect(soundSelector).toBeVisible()
    await expect(soundSelector.locator('option')).toHaveCount(14)
    await expect(page.getByLabel('效果音色')).toHaveCount(0)

    await soundSelector.selectOption({ label: 'SKCM Blue Alps' })
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('keySoundsConfig') ?? 'null')?.resource?.name))
      .toBe('SKCM Blue Alps')

    await page.reload()
    await page.getByRole('button', { name: '音效', exact: true }).click()
    await expect(page.getByLabel('按鍵音色')).toHaveValue('SKCM Blue Alps')

    await page.getByLabel('按鍵音色').selectOption({ label: 'Default' })
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('keySoundsConfig') ?? 'null')?.resource?.name))
      .toBe('Default')
  })

  test('sound preset change loads the selected key resource for the next keypress', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('keySoundsConfig'))
    await selectArticle(page, document)

    await page.getByRole('button', { name: '音效', exact: true }).click()
    const soundSelector = page.getByLabel('按鍵音色')
    await expect(soundSelector).toHaveValue('Default')

    const selectedResourceRequest = page.waitForRequest(
      (request) => decodeURIComponent(request.url()).includes('key-sound/SKCM Blue Alps.mp3'),
      { timeout: 5_000 },
    )
    await soundSelector.selectOption({ label: 'SKCM Blue Alps' })
    const request = await selectedResourceRequest

    await page.getByRole('button', { name: '繼續' }).click()
    await page.keyboard.press('k')

    expect(decodeURIComponent(request.url())).toContain('key-sound/SKCM Blue Alps.mp3')
    expect(decodeURIComponent(request.url())).not.toContain('key-sound/Default.wav')
  })

  test('Article focuses the current sentence without rendering the shared Footer', async ({ page }) => {
    const session = createArticleTypingSession(document)
    const firstTarget = getPracticeTypingTarget(document.sentences[0])
    await selectArticle(page, document)

    await expect(page.locator('footer')).toHaveCount(0)
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 1 / 3')
    await expect(page.getByTestId('practice-current-sentence')).toContainText(document.sentences[0].trans[0])
    await expect(page.getByRole('button', { name: '顯示全文' })).toBeVisible()

    const row = page.getByTestId('practice-romaji-typing-row')
    expect(
      await row
        .locator('span[data-testid="practice-editable-letter"]')
        .evaluateAll((letters) => letters.map((letter) => letter.textContent).join('')),
    ).toBe(session.typingTarget.slice(session.sentencePresentations[0].targetStart, session.sentencePresentations[0].targetEnd))
    await expect(row.getByTestId('practice-romaji-visual-group').first()).toHaveClass(/mr-2/)

    await page.getByRole('button', { name: '繼續' }).click()
    await pressPhysicalText(page, firstTarget)
    await expect(page.getByTestId('practice-current-sentence')).toContainText('目前句 2 / 3')
  })
})
