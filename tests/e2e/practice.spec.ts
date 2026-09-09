import { calculateCPM } from '../../src/pages/Typing/components/Speed/statistics'
import { getPhysicalAsciiCharacter } from '../../src/pages/Typing/components/WordPanel/components/KeyEventHandler/physicalAscii'
import { isNotationCompatible, stripNotation } from '../../src/pages/Typing/components/WordPanel/components/Word/Notation'
import { processCommittedText } from '../../src/pages/Typing/components/WordPanel/components/Word/processCommittedText'
import { initialWordState } from '../../src/pages/Typing/components/WordPanel/components/Word/type'
import { kanaToImeRomaji, splitKanaIntoImeUnits } from '../../src/pages/Typing/utils/imeRomaji'
import {
  generateMockPracticeDocument,
  isPracticeGenerationRequest,
  validateGeneratedPracticeDocument,
} from '../../src/pages/Typing/utils/practiceGeneration'
import { importChatGPTPracticeDocument } from '../../src/pages/Typing/utils/practiceImport'
import { splitPracticeText } from '../../src/pages/Typing/utils/practiceText'
import { getPracticeTypingTarget } from '../../src/pages/Typing/utils/practiceTypingTarget'
import { japanesePracticeDocument, scenarioPracticeDocuments } from '../../src/resources/practiceDocuments'
import type { Word } from '../../src/typings'
import { test, expect, Page } from '@playwright/test'

test.describe('kanaToImeRomaji', () => {
  test('converts common kana, yoon, sokuon, small kana, loanwords, n, and the long vowel mark into IME keystrokes', () => {
    expect(kanaToImeRomaji('し')).toBe('shi')
    expect(kanaToImeRomaji('つ')).toBe('tsu')
    expect(kanaToImeRomaji('きゃ')).toBe('kya')
    expect(kanaToImeRomaji('ちゅ')).toBe('chu')
    expect(kanaToImeRomaji('りょ')).toBe('ryo')
    expect(kanaToImeRomaji('じょ')).toBe('jo')
    expect(kanaToImeRomaji('きって')).toBe('kitte')
    expect(kanaToImeRomaji('ぁぃぅぇぉゃゅょゎ')).toBe('xaxixuxexoxyaxyuxyoxwa')
    expect(kanaToImeRomaji('ティディファフィフェフォウィウェウォチェジェ')).toBe('thidhifafifefowiwewhocheje')
    expect(kanaToImeRomaji('ビール')).toBe('bi-ru')
    expect(kanaToImeRomaji('ん')).toBe('n')
    expect(kanaToImeRomaji('を')).toBe('wo')
    expect(kanaToImeRomaji('しちつしゃちゅっかんをビール')).toBe('shichitsushachukkanwobi-ru')
    expect(splitKanaIntoImeUnits('きゃって')).toEqual(['きゃ', 'っ', 'て'])
  })
})

test.describe('Article IME target', () => {
  test('uses converter key sequences without Japanese word-separator spaces', () => {
    expect(
      getPracticeTypingTarget({
        name: '昨日、友達と映画を見に行きました。',
        notation: '昨日(きのう)、友達(ともだち)と映画(えいが)を見(み)に行(い)きました。',
        trans: [],
      }),
    ).toBe('kinou,tomodachitoeigawominiikimashita.')

    expect(
      getPracticeTypingTarget({
        name: '私は学校へ行きます。',
        notation: '私(わたし)は学校(がっこう)へ行(い)きます。',
        trans: [],
      }),
    ).toBe('watashihagakkouheikimasu.')
  })

  test('removes source newlines without deleting source ASCII spaces', () => {
    expect(
      getPracticeTypingTarget({
        name: '昨日、\n  友達と映画を見ました。',
        notation: '昨日(きのう)、\n  友達(ともだち)と映画(えいが)を見(み)ました。',
        trans: [],
      }),
    ).toBe('kinou,  tomodachitoeigawomimashita.')
  })

  test('maps Japanese ellipses to three ASCII periods each while retaining existing punctuation mappings', () => {
    expect(
      getPracticeTypingTarget({
        name: 'そうですね…',
        notation: 'そうですね…',
        trans: [],
      }),
    ).toBe('soudesune...')

    expect(
      getPracticeTypingTarget({
        name: 'あって…すみません。',
        notation: 'あって…すみません。',
        trans: [],
      }),
    ).toBe('atte...sumimasen.')

    expect(
      getPracticeTypingTarget({
        name: 'えっと……ちょっと待ってください。',
        notation: 'えっと……ちょっと待(ま)ってください。',
        trans: [],
      }),
    ).toBe('etto......chottomattekudasai.')

    expect(
      getPracticeTypingTarget({
        name: 'はい、そうです。大丈夫？元気！',
        notation: 'はい、そうです。大丈夫(だいじょうぶ)？元気(げんき)！',
        trans: [],
      }),
    ).toBe('hai,soudesu.daijoubu?genki!')
  })

  test('maps common Japanese full-width punctuation to keyboard ASCII without changing the source text', () => {
    const mappings: Array<[string, string]> = [
      ['、', ','],
      ['。', '.'],
      ['？', '?'],
      ['！', '!'],
      ['…', '...'],
      ['……', '......'],
      ['：', ':'],
      ['；', ';'],
    ]

    for (const [source, expected] of mappings) {
      expect(
        getPracticeTypingTarget({ name: `あ${source}あ`, notation: `あ${source}あ`, trans: [] }),
        source,
      ).toBe(`a${expected}a`)
    }
  })

  test('maps the Japanese Article colon sentence to the exact ASCII target', () => {
    expect(
      getPracticeTypingTarget({
        name: '彼女：今日、晩ご飯どうする？',
        notation: '彼女(かのじょ)：今日(きょう)、晩(ばん)ご飯(はん)どうする？',
        trans: [],
      }),
    ).toBe('kanojo:kyou,bangohandousuru?')
  })
})

test.describe('Article physical ASCII mapping', () => {
  const physicalKey = (code: string, shiftKey = false, modifiers: Partial<Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey'>> = {}) =>
    getPhysicalAsciiCharacter({ code, shiftKey, altKey: false, ctrlKey: false, metaKey: false, ...modifiers })

  test('maps the printable QWERTY ASCII needed by Article targets', () => {
    expect(physicalKey('KeyK')).toBe('k')
    expect(physicalKey('Comma')).toBe(',')
    expect(physicalKey('Period')).toBe('.')
    expect(physicalKey('Semicolon')).toBe(';')
    expect(physicalKey('Semicolon', true)).toBe(':')
    expect(physicalKey('Minus')).toBe('-')
    expect(physicalKey('Digit1')).toBe('1')
    expect(physicalKey('Digit1', true)).toBe('!')
    expect(physicalKey('Slash', true)).toBe('?')
    expect(physicalKey('Quote', true)).toBe('"')
    expect(physicalKey('Space')).toBe(' ')
  })

  test('ignores Ctrl, Alt, and Meta combinations', () => {
    expect(physicalKey('KeyV', false, { ctrlKey: true })).toBeNull()
    expect(physicalKey('KeyK', false, { altKey: true })).toBeNull()
    expect(physicalKey('KeyK', false, { metaKey: true })).toBeNull()
  })
})

const pressWord = async (page: Page, word: string) => {
  const letters = word.split('')
  for (const letter of letters) {
    await page.keyboard.press(letter)
  }
}

const pressWords = async (page: Page, words: string[]) => {
  for (const word of words) {
    await pressWord(page, word)
    await page.waitForTimeout(300)
  }
}

const startPractice = async (page: Page) => {
  await page.keyboard.press('Enter')
}

const stat = (page: Page, label: string) => page.getByText(label, { exact: true }).locator('..')

const firstLetter = (page: Page, letter: string) => page.locator('span', { hasText: new RegExp(`^${letter}$`) }).first()

const selectJapaneseFixture = async (page: Page) => {
  await page.evaluate((document) => {
    localStorage.setItem('practiceDocumentId', JSON.stringify(document.id))
    localStorage.setItem('pastedPracticeDocuments', JSON.stringify([document]))
  }, japanesePracticeDocument)
  await page.reload()
  await expect(page.getByTestId('practice-japanese-display')).toHaveAttribute('aria-label', japanesePracticeDocument.sentences[0].name)
  expect(await page.getByTestId('practice-romaji-typing-row').evaluate((node) => node.textContent)).toBe(
    getPracticeTypingTarget(japanesePracticeDocument.sentences[0]),
  )
}

const selectPracticeScenario = async (page: Page, scenario: string) => {
  await page.getByRole('button', { name: scenario }).click()
  await expect(page.getByTestId('practice-japanese-display')).toBeVisible()
}

const submitCommittedText = async (page: Page, text: string) => {
  if (/^[\x20-\x7e]+$/.test(text)) {
    await page.keyboard.type(text)
  } else {
    await page.locator('textarea').pressSequentially(text)
  }
}

const dispatchCompositionCommit = async (page: Page, text: string, includePairedInput: boolean) => {
  await page.locator('textarea').evaluate(
    (textarea, eventInit) => {
      textarea.value = eventInit.text
      textarea.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: eventInit.text }))
      if (eventInit.includePairedInput) {
        textarea.value = eventInit.text
        textarea.dispatchEvent(
          new InputEvent('input', {
            bubbles: true,
            data: eventInit.text,
            inputType: 'insertCompositionText',
            isComposing: false,
          }),
        )
      }
    },
    { text, includePairedInput },
  )
}

const currentLetters = (page: Page) => page.locator('.tooltip-info > div:first-child span.font-mono')

const dispatchPhysicalKey = async (
  page: Page,
  code: string,
  modifiers: { ctrlKey?: boolean; altKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {},
) => {
  await page.evaluate(
    ({ code, modifiers }) => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'Process',
          code,
          isComposing: true,
          ...modifiers,
        }),
      )
    },
    { code, modifiers },
  )
}

const selectArticleDocument = async (
  page: Page,
  document: { id: string; title: string; source: string; language: string; sentences: Word[] },
) => {
  await page.evaluate((value) => {
    localStorage.setItem('practiceDocumentId', JSON.stringify(value.id))
    localStorage.setItem('pastedPracticeDocuments', JSON.stringify([value]))
  }, document)
  await page.reload()
}

const expectPracticeSentence = async (page: Page, sentence: string) => {
  const display = page.getByTestId('practice-japanese-display')
  if ((await display.count()) > 0) {
    expect(await display.getAttribute('aria-label')).toContain(sentence)
    return
  }
  await expect(currentLetters(page)).toHaveText(sentence.split(''))
}

const wordStateFor = (displayWord: string) => ({
  ...structuredClone(initialWordState),
  displayWord,
  letterStates: new Array(displayWord.length).fill('normal'),
})

const chatgptImportJson = JSON.stringify({
  id: 'remote-id',
  source: 'fixture',
  language: 'en',
  title: '居酒屋裡的第一次聊天',
  jlptLevel: 'N4',
  scenario: 'izakaya',
  sentences: [
    { name: 'おすすめの料理はありますか。', notation: 'おすすめの料理(りょうり)はありますか。', trans: ['有推薦的料理嗎？'] },
    { name: 'これは人気の料理です。', notation: 'これは人気(にんき)の料理(りょうり)です。', trans: ['這是很受歡迎的料理。'] },
    {
      name: 'ありがとうございます。それをお願いします。',
      notation: 'ありがとうございます。それをお願(ねが)いします。',
      trans: ['謝謝您，那就麻煩來這道。'],
    },
  ],
})
const chatgptPracticeWords = (JSON.parse(chatgptImportJson) as { sentences: Word[] }).sentences

test.describe('calculateCPM', () => {
  test('calculates correct characters per minute with a safe zero-time fallback', () => {
    expect(calculateCPM(60, 60)).toBe(60)
    expect(calculateCPM(30, 30)).toBe(60)
    expect(calculateCPM(0, 0)).toBe(0)
    expect(calculateCPM(1, 3)).toBe(20)
  })
})

test.describe('splitPracticeText', () => {
  test('splits Japanese, Chinese, English, and newline sentences without dropping punctuation', () => {
    expect(splitPracticeText('今日は雨です。\n家で本を読みます！\n\n夜は友達と電話します？')).toEqual([
      '今日は雨です。',
      '家で本を読みます！',
      '夜は友達と電話します？',
    ])
    expect(splitPracticeText('你好！明天見。How are you? I am fine.')).toEqual(['你好！', '明天見。', 'How are you?', 'I am fine.'])
  })

  test('keeps comma-separated clauses together and joins plain layout line breaks', () => {
    expect(splitPracticeText('今日は雨ですが、午後から晴れるそうです。')).toEqual(['今日は雨ですが、午後から晴れるそうです。'])
    expect(splitPracticeText('今日は友達と\n東京へ行きました。')).toEqual(['今日は友達と東京へ行きました。'])
  })
})

test.describe('內建情境 PracticeDocument', () => {
  test('provides travel, izakaya, and small-talk documents with valid notation', () => {
    expect(scenarioPracticeDocuments.map((document) => document.scenario)).toEqual(['日本旅遊', '居酒屋', '陌生人閒聊'])
    for (const document of scenarioPracticeDocuments) {
      expect(Array.isArray(document.sentences)).toBe(true)
      expect(document.sentences.length).toBeGreaterThanOrEqual(5)
      expect(document.sentences.length).toBeLessThanOrEqual(8)
      for (const sentence of document.sentences) {
        expect(stripNotation(sentence.notation ?? sentence.name)).toBe(sentence.name)
        expect(sentence.trans).not.toHaveLength(0)
      }
    }
  })
})

test.describe('AI 練習文章資料契約', () => {
  test('只接受合法的 GenerationRequest，且 topic 可以省略', () => {
    expect(isPracticeGenerationRequest({ jlptLevel: 'N4', scenario: 'izakaya', length: 'medium' })).toBe(true)
    expect(isPracticeGenerationRequest({ jlptLevel: 'N3', scenario: 'small-talk', length: 'short', topic: '和陌生人聊旅行' })).toBe(true)
    expect(isPracticeGenerationRequest({ jlptLevel: 'N0', scenario: 'izakaya', length: 'medium' })).toBe(false)
    expect(isPracticeGenerationRequest({ jlptLevel: 'N4', scenario: 'hotel', length: 'medium' })).toBe(false)
    expect(isPracticeGenerationRequest({ jlptLevel: 'N4', scenario: 'travel', length: 'essay' })).toBe(false)
  })

  test('有效 generated PracticeDocument 可以通過嚴格驗證', () => {
    const document = generateMockPracticeDocument({ jlptLevel: 'N4', scenario: 'izakaya', length: 'medium' })
    expect(validateGeneratedPracticeDocument(document, 'medium')).toEqual({ valid: true, errors: [] })
  })

  test('拒絕空標題、空句子、notation 不一致、空翻譯、錯誤 JLPT 與不符篇幅的資料', () => {
    const document = generateMockPracticeDocument({ jlptLevel: 'N4', scenario: 'izakaya', length: 'medium' })
    expect(validateGeneratedPracticeDocument({ ...document, title: ' ' }, 'medium').valid).toBe(false)
    expect(validateGeneratedPracticeDocument({ ...document, sentences: [] }, 'medium').valid).toBe(false)
    expect(
      validateGeneratedPracticeDocument(
        { ...document, sentences: [{ ...document.sentences[0], notation: '別(べつ)の文(ぶん)です。' }, ...document.sentences.slice(1)] },
        'medium',
      ).valid,
    ).toBe(false)
    expect(
      validateGeneratedPracticeDocument(
        { ...document, sentences: [{ ...document.sentences[0], notation: document.sentences[0].name }, ...document.sentences.slice(1)] },
        'medium',
      ).valid,
    ).toBe(false)
    expect(
      validateGeneratedPracticeDocument(
        { ...document, sentences: [{ ...document.sentences[0], trans: [] }, ...document.sentences.slice(1)] },
        'medium',
      ).valid,
    ).toBe(false)
    expect(validateGeneratedPracticeDocument({ ...document, jlptLevel: 'N0' as 'N4' }, 'medium').valid).toBe(false)
    expect(validateGeneratedPracticeDocument({ ...document, sentences: document.sentences.slice(0, 2) }, 'medium').valid).toBe(false)
  })

  test('N5 travel、N4 izakaya、N3 small-talk 都會生成可驗證的 PracticeDocument', () => {
    const requests = [
      { jlptLevel: 'N5', scenario: 'travel', length: 'short' },
      { jlptLevel: 'N4', scenario: 'izakaya', length: 'medium' },
      { jlptLevel: 'N3', scenario: 'small-talk', length: 'long' },
    ] as const

    for (const request of requests) {
      const document = generateMockPracticeDocument(request)
      expect(document.source).toBe('generated')
      expect(document.language).toBe('ja')
      expect(document.jlptLevel).toBe(request.jlptLevel)
      expect(validateGeneratedPracticeDocument(document, request.length).valid).toBe(true)
    }
  })
})

test.describe('ChatGPT 文章匯入契約', () => {
  const validJson = () => {
    const document = generateMockPracticeDocument({ jlptLevel: 'N4', scenario: 'izakaya', length: 'medium' })
    return JSON.stringify({ ...document, id: 'untrusted-id', source: 'fixture', language: 'en' })
  }

  test('純 JSON 與兩種最外層 code fence 都建立新的系統欄位並通過既有 validator', () => {
    for (const content of [validJson(), `\`\`\`json\n${validJson()}\n\`\`\``, `\`\`\`\n${validJson()}\n\`\`\``]) {
      const result = importChatGPTPracticeDocument(content, () => 'generated-chatgpt-test')
      expect(result.error).toBeUndefined()
      expect(result.document).toMatchObject({ id: 'generated-chatgpt-test', source: 'generated', language: 'ja', jlptLevel: 'N4' })
      expect(validateGeneratedPracticeDocument(result.document, 'medium')).toEqual({ valid: true, errors: [] })
    }
  })

  test('無效 JSON 與既有 validator 的 notation、翻譯及 JLPT 錯誤皆阻止匯入', () => {
    expect(importChatGPTPracticeDocument('{ invalid').error).toBe('無法讀取文章格式，請確認貼上的是 ChatGPT 產生的 JSON。')

    const notationMismatch = JSON.parse(validJson())
    notationMismatch.sentences[2].notation = '違(ちが)う文章(ぶんしょう)です。'
    expect(importChatGPTPracticeDocument(JSON.stringify(notationMismatch)).error).toBe('第 3 句的 Furigana 格式與日文原文不一致。')

    const missingTranslation = JSON.parse(validJson())
    missingTranslation.sentences[4].trans = []
    expect(importChatGPTPracticeDocument(JSON.stringify(missingTranslation)).error).toBe('第 5 句缺少繁體中文翻譯。')

    const invalidJlpt = JSON.parse(validJson())
    invalidJlpt.jlptLevel = 'N0'
    expect(importChatGPTPracticeDocument(JSON.stringify(invalidJlpt)).error).toBe('文章程度必須是 N5、N4、N3、N2 或 N1。')
  })

  test('句數正式合法範圍是 3 到 30 句，且不再依短中長篇幅拒絕匯入', () => {
    const baseDocument = JSON.parse(validJson()) as { sentences: Word[] }
    const documentWithSentenceCount = (sentenceCount: number, format?: 'dialogue') =>
      JSON.stringify({
        ...baseDocument,
        format,
        sentences: Array.from({ length: sentenceCount }, (_, index) => ({
          ...baseDocument.sentences[index % baseDocument.sentences.length],
          name: `これは${index + 1}番目です。`,
          notation: `これは${index + 1}番目(ばんめ)です。`,
          trans: [`這是第 ${index + 1} 句。`],
        })),
      })

    for (const sentenceCount of [3, 8, 30]) {
      expect(importChatGPTPracticeDocument(documentWithSentenceCount(sentenceCount)).document?.sentences).toHaveLength(sentenceCount)
    }
    for (const sentenceCount of [2, 31]) {
      expect(importChatGPTPracticeDocument(documentWithSentenceCount(sentenceCount)).error).toBe('文章需包含 3 到 30 句。')
    }

    expect(importChatGPTPracticeDocument(documentWithSentenceCount(13, 'dialogue')).document).toMatchObject({
      jlptLevel: 'N4',
      format: 'dialogue',
      sentences: expect.any(Array),
    })
  })
})

test.describe('processCommittedText', () => {
  test('accepts every character from a matching multi-character commit', () => {
    const result = processCommittedText(wordStateFor('昨日'), '昨日', {
      isPracticeMode: true,
      isIgnoreCase: false,
      explicitSpace: '␣',
      timestamp: 1,
    })

    expect(result.nextState.inputWord).toBe('昨日')
    expect(result.nextState.letterStates).toEqual(['correct', 'correct'])
    expect(result.correctCountDelta).toBe(2)
    expect(result.wrongDelta).toBeUndefined()
    expect(result.didFinish).toBe(true)
  })

  test('stops a multi-character commit at the first wrong character', () => {
    const result = processCommittedText(wordStateFor('昨夜'), '昨日', {
      isPracticeMode: true,
      isIgnoreCase: false,
      explicitSpace: '␣',
      timestamp: 1,
    })

    expect(result.nextState.inputWord).toBe('昨')
    expect(result.nextState.letterStates).toEqual(['correct', 'wrong'])
    expect(result.correctCountDelta).toBe(1)
    expect(result.wrongDelta).toEqual({ 1: ['日'] })
    expect(result.didFinish).toBe(false)
  })

  test('keeps complete local mistakes while returning only the latest wrong delta', () => {
    const firstWrong = processCommittedText(wordStateFor('映画'), '映河', {
      isPracticeMode: true,
      isIgnoreCase: false,
      explicitSpace: '␣',
      timestamp: 1,
    })
    const secondWrong = processCommittedText(firstWrong.nextState, '川', {
      isPracticeMode: true,
      isIgnoreCase: false,
      explicitSpace: '␣',
      timestamp: 2,
    })

    expect(secondWrong.nextState.inputWord).toBe('映')
    expect(secondWrong.nextState.letterMistake).toEqual({ 1: ['河', '川'] })
    expect(secondWrong.nextState.wrongCount).toBe(2)
    expect(secondWrong.wrongDelta).toEqual({ 1: ['川'] })
  })

  test('keeps half-width and full-width spaces aligned in Practice mode', () => {
    const result = processCommittedText(wordStateFor('半 角　空'), '半 角　空', {
      isPracticeMode: true,
      isIgnoreCase: false,
      explicitSpace: '␣',
      timestamp: 1,
    })

    expect(result.nextState.inputWord).toBe('半 角　空')
    expect(result.nextState.letterStates).toEqual(new Array(5).fill('correct'))
    expect(result.correctCountDelta).toBe(5)
    expect(result.didFinish).toBe(true)
  })
})

test.describe('stripNotation', () => {
  test('preserves Japanese ruby base text, punctuation, kana, and multiple segments', () => {
    expect(stripNotation('昨日(きのう)、友達(ともだち)と映画(えいが)を見(み)に行(い)きました。')).toBe('昨日、友達と映画を見に行きました。')
    expect(stripNotation('かな、カナ。')).toBe('かな、カナ。')
    expect(stripNotation('男(おとこ)の子(こ)')).toBe('男の子')
  })

  test('rejects a notation whose base text differs from the Practice target', () => {
    expect(isNotationCompatible('男(おとこ)の子(こ)', 'otokonoko')).toBe(false)
  })
})

test.describe('Practice', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/typing?legacy-dictionary=1')
    const dismissButton = page.getByLabel('关闭提示')
    if (await dismissButton.isVisible().catch(() => false)) {
      await dismissButton.click()
    }
  })

  test('shared article actions keep pasted and ChatGPT dialogs on the explicit legacy path', async ({ page }) => {
    await page.getByRole('button', { name: '貼上自己的文章' }).click()
    await expect(page.getByRole('dialog').getByText('貼上自己的文章')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: '取消' }).click()

    await page.getByRole('button', { name: '匯入文章' }).click()
    await expect(page.getByRole('dialog').getByText('匯入文章', { exact: true })).toBeVisible()
  })

  test('Article physical ASCII path accepts Process key events for kaijou without textarea input or compositionend', async ({ page }) => {
    await selectArticleDocument(page, {
      id: 'physical-key-kaijou',
      title: 'Physical key kaijou',
      source: 'fixture',
      language: 'ja',
      sentences: [{ name: '会場', notation: '会場(かいじょう)', trans: ['會場'] }],
    })
    await expect(page.getByTestId('practice-romaji-typing-row')).toHaveText('kaijou')
    await startPractice(page)

    await dispatchPhysicalKey(page, 'KeyV', { ctrlKey: true })
    await dispatchPhysicalKey(page, 'KeyK', { altKey: true })
    await dispatchPhysicalKey(page, 'KeyK', { metaKey: true })
    await expect(stat(page, '輸入數').locator('span').first()).toHaveText('0')
    await expect(currentLetters(page).first()).toHaveClass(/text-gray-600/)

    await dispatchPhysicalKey(page, 'KeyK')
    await expect(currentLetters(page).first()).toHaveClass(/text-green-600/)
    for (const code of ['KeyA', 'KeyI', 'KeyJ', 'KeyO', 'KeyU']) {
      await dispatchPhysicalKey(page, code)
    }

    const resultScreen = page.locator('div.fixed.inset-0.z-30')
    await expect(resultScreen.getByText('Physical key kaijou', { exact: true })).toBeVisible()
    await expect(resultScreen.getByText('100%', { exact: true })).toBeVisible()
  })

  test('Article physical ASCII path types kinou,tomodachi including Comma', async ({ page }) => {
    await selectArticleDocument(page, {
      id: 'physical-key-comma',
      title: 'Physical key comma',
      source: 'fixture',
      language: 'ja',
      sentences: [{ name: 'kinou,tomodachi', trans: ['physical key fixture'] }],
    })
    await expect(page.getByTestId('practice-romaji-typing-row')).toHaveText('kinou,tomodachi')
    await startPractice(page)

    for (const code of [
      'KeyK',
      'KeyI',
      'KeyN',
      'KeyO',
      'KeyU',
      'Comma',
      'KeyT',
      'KeyO',
      'KeyM',
      'KeyO',
      'KeyD',
      'KeyA',
      'KeyC',
      'KeyH',
      'KeyI',
    ]) {
      await dispatchPhysicalKey(page, code)
    }

    const resultScreen = page.locator('div.fixed.inset-0.z-30')
    await expect(resultScreen.getByText('Physical key comma', { exact: true })).toBeVisible()
    await expect(resultScreen.getByText('100%', { exact: true })).toBeVisible()
  })

  test('romaji Dictionary keeps its original logical event.key behavior', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('currentDict', JSON.stringify('japanese003-zh'))
      localStorage.setItem('currentChapter', JSON.stringify(0))
      localStorage.setItem('practiceDocumentId', JSON.stringify(null))
    })
    await page.reload()
    await expect(page.getByText('kaijou', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '开始', exact: true }).click()

    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'k', code: 'KeyQ' }))
    })

    await expect(currentLetters(page).first()).toHaveClass(/text-green-600/)
  })

  test('legacy non-ASCII pasted Article retains its composition input path', async ({ page }) => {
    await selectArticleDocument(page, {
      id: 'legacy-composition-article',
      title: 'Legacy composition Article',
      source: 'pasted',
      language: 'ja',
      sentences: [{ name: '日本', trans: [] }],
    })
    await expect(page.getByTestId('practice-romaji-typing-row')).toHaveText('日本')
    await startPractice(page)

    await dispatchCompositionCommit(page, '日本', true)

    await expect(page.locator('div.fixed.inset-0.z-30').getByText('Legacy composition Article', { exact: true })).toBeVisible()
  })

  test('Practice types a derived romaji row while the Japanese sentence remains display-only', async ({ page }) => {
    const firstSentence = '一人で居酒屋に入って、生ビールを注文しました。'
    const firstNotation = '一人(ひとり)で居酒屋(いざかや)に入(はい)って、生(なま)ビールを注文(ちゅうもん)しました。'
    const firstTarget = 'hitorideizakayanihaitte,namabi-ruwochuumonshimashita.'
    const secondSentence = '店員さんが席へ案内してくれました。'

    await page.evaluate(
      ({ firstSentence, firstNotation, secondSentence }) => {
        const document = {
          id: 'romaji-typing-test',
          title: 'Romaji Typing 測試',
          source: 'fixture',
          language: 'ja',
          sentences: [
            { name: firstSentence, notation: firstNotation, trans: ['我一個人走進居酒屋，點了一杯生啤酒。'] },
            {
              name: secondSentence,
              notation: '店員(てんいん)さんが席(せき)へ案内(あんない)してくれました。',
              trans: ['店員帶我到座位。'],
            },
          ],
        }
        localStorage.setItem('practiceDocumentId', JSON.stringify(document.id))
        localStorage.setItem('pastedPracticeDocuments', JSON.stringify([document]))
      },
      { firstSentence, firstNotation, secondSentence },
    )
    await page.reload()

    const japaneseDisplay = page.getByTestId('practice-japanese-display')
    const typingRow = page.getByTestId('practice-romaji-typing-row')
    const typingLetters = typingRow.locator('[data-testid="practice-editable-letter"]')

    await expect(japaneseDisplay).toHaveAttribute('aria-label', firstSentence)
    expect((await japaneseDisplay.locator('rt').allTextContents()).slice(0, 5)).toEqual([
      'ひとり',
      'いざかや',
      'はい',
      'なま',
      'ちゅうもん',
    ])
    await expect(typingRow).toHaveText(firstTarget)
    await expect(page.getByText('我一個人走進居酒屋，點了一杯生啤酒。')).toBeVisible()
    await expect(japaneseDisplay.locator('[class*="text-green"], [class*="text-red"]')).toHaveCount(0)

    await startPractice(page)
    await page.keyboard.type('h')
    await expect(typingLetters.nth(0)).toHaveClass(/text-green-600/)
    await expect(stat(page, '正確數').locator('span').first()).toHaveText('1')
    await expect(stat(page, '輸入數').locator('span').first()).toHaveText('1')
    await expect(japaneseDisplay.locator('[class*="text-green"], [class*="text-red"]')).toHaveCount(0)

    const correctPrefix = firstTarget.slice(1, 20)
    await page.keyboard.type(correctPrefix)
    await expect(typingLetters.nth(19)).toHaveClass(/text-green-600/)
    await expect(stat(page, '正確數').locator('span').first()).toHaveText('20')

    await page.keyboard.type('x')
    await expect(typingLetters.nth(20)).toHaveClass(/text-red-600/)
    await expect(japaneseDisplay.locator('[class*="text-green"], [class*="text-red"]')).toHaveCount(0)

    await page.keyboard.type(firstTarget.slice(20))
    await expect(typingLetters.first()).toHaveText(
      getPracticeTypingTarget({
        name: secondSentence,
        notation: '店員(てんいん)さんが席(せき)へ案内(あんない)してくれました。',
        trans: [],
      })[0],
    )
    await expect(page.locator('div.fixed.inset-0.z-30')).toHaveCount(0)
  })

  test('Dictionary and Practice share the same visual hierarchy without horizontal overflow', async ({ page }, testInfo) => {
    await page.evaluate(() => {
      localStorage.setItem('currentDict', JSON.stringify('japanese003-zh'))
      localStorage.setItem('currentChapter', JSON.stringify(0))
      localStorage.setItem('practiceDocumentId', JSON.stringify(null))
    })
    await page.reload()
    await expect(page.getByText('kaijou', { exact: true })).toBeVisible()
    await expect(page.getByText('大会堂或会议场所', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '开始', exact: true }).click()

    const dictionaryRow = page.locator('.tooltip-info > div:first-child')
    const dictionaryFontSize = await dictionaryRow
      .locator('span')
      .first()
      .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))
    await page.screenshot({ path: testInfo.outputPath('dictionary-n4-kaijou.png'), fullPage: true })

    const practiceDocument = {
      id: 'visual-romaji-practice',
      title: '居酒屋 Romaji 驗收',
      source: 'fixture',
      language: 'ja',
      sentences: [
        {
          name: '一人で居酒屋に入って、生ビールを注文しました。',
          notation: '一人(ひとり)で居酒屋(いざかや)に入(はい)って、生(なま)ビールを注文(ちゅうもん)しました。',
          trans: ['我一個人走進居酒屋，點了一杯生啤酒。'],
        },
      ],
    }
    const practicePage = await page.context().newPage()
    await practicePage.goto('/')
    await practicePage.evaluate((document) => {
      localStorage.setItem('practiceDocumentId', JSON.stringify(document.id))
      localStorage.setItem('pastedPracticeDocuments', JSON.stringify([document]))
    }, practiceDocument)
    await practicePage.goto('/typing')

    const display = practicePage.getByTestId('practice-japanese-display')
    const practiceRow = practicePage.getByTestId('practice-romaji-typing-row')
    await expect(display).toHaveAttribute('aria-label', practiceDocument.sentences[0].name)
    await expect(practiceRow).toHaveText('hitorideizakayanihaitte,namabi-ruwochuumonshimashita.')
    await expect(practicePage.getByText(practiceDocument.sentences[0].trans[0], { exact: true })).toBeVisible()

    const visualMetrics = await practicePage.locator('body').evaluate(() => {
      const displayElement = document.querySelector('[data-testid="practice-japanese-display"]')
      const typingElement = document.querySelector('[data-testid="practice-romaji-typing-row"]')
      const letter = typingElement?.querySelector('span')
      const rect = typingElement?.getBoundingClientRect()
      return {
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        coloredJapanese: displayElement?.querySelectorAll('[class*="text-green"], [class*="text-red"]').length ?? -1,
        typingLeft: rect?.left ?? -1,
        typingRight: rect?.right ?? -1,
        typingScrollWidth: typingElement?.scrollWidth ?? -1,
        typingClientWidth: typingElement?.clientWidth ?? -1,
        viewportWidth: document.documentElement.clientWidth,
        practiceFontSize: letter ? Number.parseFloat(getComputedStyle(letter).fontSize) : 0,
        overflowingElements: Array.from(document.querySelectorAll<HTMLElement>('body *'))
          .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
          .slice(0, 5)
          .map((element) => ({ tag: element.tagName, className: element.className, right: element.getBoundingClientRect().right })),
      }
    })
    await practicePage.screenshot({ path: testInfo.outputPath('practice-izakaya-romaji.png'), fullPage: true })
    expect(visualMetrics).toEqual(expect.objectContaining({ horizontalOverflow: false }))
    expect(visualMetrics.coloredJapanese).toBe(0)
    expect(visualMetrics.typingLeft).toBeGreaterThanOrEqual(0)
    expect(visualMetrics.typingRight).toBeLessThanOrEqual(visualMetrics.viewportWidth)
    expect(visualMetrics.practiceFontSize).toBeGreaterThanOrEqual(Math.min(28, dictionaryFontSize))
    await practicePage.close()
  })

  test('Practice real keyboard enters WordState and Start Pause Resume gate keyboard input', async ({ page }) => {
    await page.getByRole('button', { name: '貼上自己的文章' }).click()
    await page.getByLabel('文章名稱').fill('ASCII 鍵盤測試')
    await page.getByLabel('文章內容').fill('abcd')
    await page.getByRole('button', { name: '開始練習' }).click()
    await expectPracticeSentence(page, 'abcd')

    await page.getByRole('button', { name: '开始', exact: true }).click()

    await page.keyboard.type('abc')
    await expect(currentLetters(page).nth(0)).toHaveClass(/text-green-600/)
    await expect(currentLetters(page).nth(2)).toHaveClass(/text-green-600/)
    await expect(stat(page, '輸入數').locator('span').first()).toHaveText('3')

    await page.getByRole('button', { name: '暂停' }).click()
    await page.keyboard.type('x')
    await expect(stat(page, '輸入數').locator('span').first()).toHaveText('3')

    await page.getByRole('button', { name: '开始', exact: true }).click()
    await page.keyboard.type('d')
    await expect(page.locator('div.fixed.inset-0.z-30').getByText('ASCII 鍵盤測試', { exact: true })).toBeVisible()
  })

  test('Practice controls remain interactive and physical keyboard input continues after the interaction', async ({ page }) => {
    await selectJapaneseFixture(page)
    await page.getByRole('button', { name: '开始', exact: true }).click()

    const phoneticConfigButton = page.getByRole('button', { name: /发音及音标切换/ })
    await phoneticConfigButton.click()
    const furiganaSwitch = page.getByRole('switch').first()
    await furiganaSwitch.click()
    await expect.poll(() => furiganaSwitch.evaluate((element) => document.activeElement === element)).toBe(true)

    await page.keyboard.press('Escape')
    await dispatchPhysicalKey(page, 'KeyK')
    await expect(currentLetters(page).first()).toHaveClass(/text-green-600/)
  })

  test('Practice always shows the full target and hides Dictionary dictation controls without changing Dictionary behavior', async ({
    page,
  }) => {
    await page.evaluate(() => {
      localStorage.setItem('wordDictationConfig', JSON.stringify({ isOpen: true, type: 'hideAll', openBy: 'user' }))
    })
    await page.reload()

    const dictationButton = page.getByRole('button', { name: '开关默写模式' })
    await expect(dictationButton).toBeVisible()
    await selectJapaneseFixture(page)

    await expect(dictationButton).toHaveCount(0)
    await expectPracticeSentence(page, '昨日、友達と映画を見に行きました。')

    await page.getByRole('button', { name: '切回單字模式' }).click()
    await expect(dictationButton).toBeVisible()
    await expectPracticeSentence(page, '______')
  })

  test('Japanese Practice exposes ruby and kana IME hints even when Furigana is off', async ({ page }) => {
    await page.evaluate(() => {
      const document = {
        id: 'ime-hint-test',
        title: 'IME 提示測試',
        source: 'fixture',
        language: 'ja',
        sentences: [
          {
            name: '注文して、きゃっとんービール。',
            notation: '注文(ちゅうもん)して、きゃっとんービール。',
            trans: ['點餐並練習日文輸入。'],
          },
        ],
      }
      localStorage.setItem('practiceDocumentId', JSON.stringify(document.id))
      localStorage.setItem('pastedPracticeDocuments', JSON.stringify([document]))
    })
    await page.reload()
    await expectPracticeSentence(page, '注文して、きゃっとんービール。')

    const orderHint = page.getByLabel('注文 IME input hint')
    await orderHint.hover()
    await expect(page.getByRole('tooltip').filter({ hasText: 'ちゅうもん' })).toBeVisible()
    await expect(page.getByRole('tooltip').filter({ hasText: 'chuumon' })).toBeVisible()
    await expect(page.getByRole('tooltip').filter({ hasText: 'Space → 注文' })).toHaveCount(0)

    await page.getByLabel('きゃ IME input hint').hover()
    await expect(page.getByRole('tooltip').filter({ hasText: 'kya' })).toBeVisible()
    await page.getByLabel('っ IME input hint').hover()
    await expect(page.getByRole('tooltip').filter({ hasText: '下一個子音打兩次' })).toBeVisible()
    await expect(page.getByRole('tooltip').filter({ hasText: 'きって → kitte' })).toBeVisible()
    await page.getByLabel('ん IME input hint').hover()
    await expect(page.getByRole('tooltip').filter({ hasText: '有歧義時可輸入 nn' })).toBeVisible()
    await page.getByLabel('ー IME input hint').first().hover()
    await expect(page.getByRole('tooltip').filter({ hasText: '長音符號' })).toBeVisible()

    const phoneticConfigButton = page.getByRole('button', { name: /发音及音标切换/ })
    await phoneticConfigButton.click()
    await page.getByRole('switch').first().click()
    await expect(page.getByTestId('practice-japanese-display').locator('rt')).toHaveCount(0)
    await orderHint.focus()
    await expect(page.getByRole('tooltip').filter({ hasText: 'chuumon' })).toBeVisible()
  })

  test('Press any key to start', async ({ page }) => {
    await expect(await page.getByText('按任意键开始').isVisible()).toBeTruthy()

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    await expect(await page.locator('p').getByText('按任意键开始').isHidden()).toBeTruthy()
  })

  test('Enter the correct word', async ({ page }) => {
    await page.getByRole('button', { name: '开始', exact: true }).click()

    await pressWord(page, 'cancel')

    // auto show next word: explosive
    await expectPracticeSentence(page, 'explosive')
  })

  test('CET-4 retains its WPM display', async ({ page }) => {
    await expect(stat(page, 'WPM')).toBeVisible()
    await expect(page.getByText('字/分鐘', { exact: false })).toHaveCount(0)
  })

  test('Enter the wrong word', async ({ page }) => {
    await page.getByRole('button', { name: '开始' }).click()

    await pressWord(page, 'canca')

    await expect(stat(page, '輸入數').locator('span').first()).not.toHaveText('0')
    await expect(stat(page, '正確數').locator('span').first()).not.toHaveText('0')
    await expect(stat(page, '正确率').locator('span').first()).not.toHaveText('100')
  })

  test('Enter the correct letter, should show green color', async ({ page }) => {
    await page.getByRole('button', { name: '开始' }).click()

    await page.keyboard.press('c')
    await expect(page.locator('.tooltip-info > div:first-child > span > span.font-mono', { hasText: /^c$/ }).first()).toHaveClass(
      /text-green-600/,
    )

    await page.keyboard.press('a')
    await expect(page.locator('.tooltip-info > div:first-child > span > span.font-mono', { hasText: /^a$/ })).toHaveClass(/text-green-600/)

    await page.keyboard.press('n')
    await expect(page.locator('.tooltip-info > div:first-child > span > span.font-mono', { hasText: /^n$/ })).toHaveClass(/text-green-600/)
  })

  test('Enter the wrong letter, should show red color', async ({ page }) => {
    await page.getByRole('button', { name: '开始', exact: true }).click()
    await expect(page.locator('.tooltip-info > div:first-child > span > span.font-mono', { hasText: /^c$/ }).first()).toHaveClass(
      /text-gray-600/,
    )

    await page.keyboard.press('c')
    await expect(page.locator('.tooltip-info > div:first-child > span > span.font-mono', { hasText: /^c$/ }).first()).toHaveClass(
      /text-green-600/,
    )
    await page.keyboard.press('x')
    await expect(page.locator('.tooltip-info > div:first-child > span > span.font-mono', { hasText: /^a$/ }).first()).toHaveClass(
      /text-red-600/,
    )

    await page.waitForTimeout(350)
    await expect(page.locator('.tooltip-info > div:first-child > span > span.font-mono', { hasText: /^a$/ }).first()).toHaveClass(
      /text-gray-600/,
    )
  })

  test('CET-4 wrong input records a mistake then resets the word', async ({ page }) => {
    await page.getByRole('button', { name: '开始' }).click()

    await page.keyboard.press('c')
    await expect(page.locator('.tooltip-info > div:first-child > span > span.font-mono', { hasText: /^c$/ }).first()).toHaveClass(
      /text-green-600/,
    )
    await page.keyboard.press('x')
    await expect(page.locator('.tooltip-info > div:first-child > span > span.font-mono', { hasText: /^a$/ }).first()).toHaveClass(
      /text-red-600/,
    )
    await expect(stat(page, '輸入數').locator('span').first()).not.toHaveText('0')
    await expect(stat(page, '正確數').locator('span').first()).toHaveText('1')

    await page.waitForTimeout(350)
    await expect(page.locator('.tooltip-info > div:first-child > span > span.font-mono', { hasText: /^c$/ }).first()).toHaveClass(
      /text-gray-600/,
    )
    await expect(page.locator('.tooltip-info > div:first-child > span > span.font-mono', { hasText: /^a$/ }).first()).toHaveClass(
      /text-gray-600/,
    )
  })

  test('Japanese fixture entry is available', async ({ page }) => {
    await selectJapaneseFixture(page)

    await expectPracticeSentence(page, '昨日、友達と映画を見に行きました。')
    await expect(page.getByText('昨天和朋友一起去看電影了。')).toBeVisible()
  })

  test('Japanese travel, izakaya, and small-talk scenarios can start with their translations', async ({ page }) => {
    const scenarios = [
      ['日本旅遊', '日本旅行の初日、駅でホテルへの出口が分からなくなりました。', '日本旅行的第一天，我在車站找不到前往飯店的出口。'],
      ['居酒屋', 'こんばんは、七時に予約しているチョンです。', '晚安，我是晚上七點有預約的鍾。'],
      ['陌生人閒聊', 'はじめまして、私は台湾から来ました。', '初次見面，我從台灣來。'],
    ] as const

    for (const [scenario, sentence, translation] of scenarios) {
      await selectPracticeScenario(page, scenario)
      await expectPracticeSentence(page, sentence)
      await expect(page.getByText(translation)).toBeVisible()
      expect(await page.getByTestId('practice-japanese-display').locator('ruby').count()).toBeGreaterThan(0)
      await startPractice(page)
      await expect(currentLetters(page).first()).toHaveClass(/text-gray-600/)
      await page.getByRole('button', { name: '切回單字模式' }).click()
    }
  })

  test('pasted article becomes a persisted PracticeDocument and completes through ResultScreen', async ({ page }) => {
    await page.getByRole('button', { name: '貼上自己的文章' }).click()
    await page.getByLabel('文章名稱').fill('雨天練習')
    await page.getByLabel('文章內容').fill('今日は雨です。\n家で本を読みます。\n夜は友達と電話します。')
    await page.getByRole('button', { name: '開始練習' }).click()

    await expectPracticeSentence(page, '今日は雨です。')
    await startPractice(page)
    await submitCommittedText(page, '今日は雨です。家で本を読みます。夜は友達と電話します。')
    await expect(page.locator('div.fixed.inset-0.z-30').getByText('雨天練習', { exact: true })).toBeVisible()

    await page.reload()
    await page.getByRole('button', { name: '切回單字模式' }).click()
    await page.getByRole('button', { name: '雨天練習' }).click()
    await expectPracticeSentence(page, '今日は雨です。')
  })

  test('pasted article rejects empty input with a Traditional Chinese error', async ({ page }) => {
    await page.getByRole('button', { name: '貼上自己的文章' }).click()
    await page.getByRole('button', { name: '開始練習' }).click()

    await expect(page.getByText('請貼上文章內容。', { exact: true })).toBeVisible()
  })

  test('ChatGPT 純 JSON 驗證、預覽、保存、Furigana、翻譯、Typing 與 ResultScreen 都可使用', async ({ page }) => {
    await page.getByRole('button', { name: '匯入文章' }).click()
    await page.getByLabel('文章 JSON').fill(chatgptImportJson)
    await page.getByRole('button', { name: '驗證文章' }).click()

    await expect(page.getByText('文章驗證成功', { exact: true })).toBeVisible()
    await expect(page.getByText('標題：居酒屋裡的第一次聊天', { exact: true })).toBeVisible()
    await expect(page.getByText('程度：N4', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '匯入文章' }).last().click()
    await page.getByRole('button', { name: 'ChatGPT｜居酒屋裡的第一次聊天' }).click()

    await expectPracticeSentence(page, 'おすすめの料理はありますか。')
    await expect(page.getByText('有推薦的料理嗎？')).toBeVisible()
    expect(await page.getByTestId('practice-japanese-display').locator('ruby').count()).toBeGreaterThan(0)
    await startPractice(page)
    await submitCommittedText(page, chatgptPracticeWords.map(getPracticeTypingTarget).join(''))
    await expect(page.locator('div.fixed.inset-0.z-30').getByText('居酒屋裡的第一次聊天', { exact: true })).toBeVisible()

    await page.reload()
    await page.getByRole('button', { name: '切回單字模式' }).click()
    await page.getByRole('button', { name: 'ChatGPT｜居酒屋裡的第一次聊天' }).click()
    await expectPracticeSentence(page, 'おすすめの料理はありますか。')
  })

  test('ChatGPT JSON textarea 在尚未開始時可正常貼上且不會啟動 Typing', async ({ page, context }) => {
    await page.getByRole('button', { name: '匯入文章' }).click()
    const textarea = page.getByLabel('文章 JSON')
    await textarea.focus()
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.evaluate(async (json) => navigator.clipboard.writeText(json), chatgptImportJson)
    await textarea.press('Control+V')
    await textarea.evaluate((element, json) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
      setter?.call(element, json)
      element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste', data: json }))
    }, chatgptImportJson)

    await expect(page.getByRole('heading', { name: '匯入文章' })).toBeVisible()
    await expect(textarea).toHaveValue(chatgptImportJson)
    await expect(page.getByText(/按任意键(开始|繼續)/)).toBeVisible()

    await page.getByRole('button', { name: '驗證文章' }).click()
    await expect(page.getByText('文章驗證成功', { exact: true })).toBeVisible()
  })

  test('ChatGPT code fence 與 JSON 檔案共用驗證流程，錯誤不會保存', async ({ page }) => {
    await page.getByRole('button', { name: '匯入文章' }).click()
    await page.getByLabel('文章 JSON').fill('```json\n{ invalid}\n```')
    await page.getByRole('button', { name: '驗證文章' }).click()
    await expect(page.getByRole('alert')).toContainText('無法讀取文章格式，請確認貼上的是 ChatGPT 產生的 JSON。')
    await expect(page.getByRole('button', { name: 'ChatGPT｜居酒屋裡的第一次聊天' })).toHaveCount(0)

    await page.getByLabel('選擇 JSON 檔案').setInputFiles({
      name: 'chatgpt.json',
      mimeType: 'application/json',
      buffer: Buffer.from(`\`\`\`\n${chatgptImportJson}\n\`\`\``),
    })
    await expect(page.getByText('文章驗證成功', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '匯入文章' }).last().click()
    await expect(page.getByRole('button', { name: 'ChatGPT｜居酒屋裡的第一次聊天' })).toBeVisible()
  })

  test('AI mock generator previews a saved N4 izakaya article before Practice, then can return to CET-4', async ({ page }) => {
    const generatedDocument = generateMockPracticeDocument({
      jlptLevel: 'N4',
      scenario: 'izakaya',
      length: 'medium',
      topic: '在居酒屋和隔壁桌的人聊天',
    })
    await page.getByRole('button', { name: 'AI 產生練習文章' }).click()
    await expect(page.getByText('目前使用測試生成資料', { exact: true })).toBeVisible()
    await page.getByLabel('程度').selectOption('N4')
    await page.getByLabel('情境').selectOption('izakaya')
    await page.getByLabel('篇幅').selectOption('medium')
    await page.getByLabel('想練習的內容（選填）').fill('在居酒屋和隔壁桌的人聊天')
    await page.getByRole('button', { name: '產生文章' }).click()

    await expect(page.getByText('N4｜居酒屋／餐廳｜在居酒屋和隔壁桌的人聊天', { exact: true })).toBeVisible()
    await expect(page.getByText('句數：7 句', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '開始練習' }).click()
    await expectPracticeSentence(page, 'こんばんは、二人ですが、席はありますか。')
    await expect(page.getByText('晚安，兩位，還有座位嗎？')).toBeVisible()
    expect(await page.getByTestId('practice-japanese-display').locator('ruby').count()).toBeGreaterThan(0)

    await startPractice(page)
    await submitCommittedText(page, generatedDocument.sentences.map(getPracticeTypingTarget).join(''))
    await expect(
      page.locator('div.fixed.inset-0.z-30').getByText('N4｜居酒屋／餐廳｜在居酒屋和隔壁桌的人聊天', { exact: true }),
    ).toBeVisible()
    await page.reload()
    await page.getByRole('button', { name: '切回單字模式' }).click()
    await page.getByRole('button', { name: 'N4｜居酒屋／餐廳｜在居酒屋和隔壁桌的人聊天' }).click()
    await expectPracticeSentence(page, 'こんばんは、二人ですが、席はありますか。')
    await page.getByRole('button', { name: '切回單字模式' }).click()
    await expect(page.getByText('cancel', { exact: true })).toBeVisible()
  })

  test('N5 travel 與 N3 small-talk mock 都可預覽', async ({ page }) => {
    await page.getByRole('button', { name: 'AI 產生練習文章' }).click()
    await page.getByLabel('程度').selectOption('N5')
    await page.getByLabel('情境').selectOption('travel')
    await page.getByLabel('篇幅').selectOption('short')
    await page.getByRole('button', { name: '產生文章' }).click()
    await expect(page.getByText('JLPT：N5', { exact: true })).toBeVisible()
    await expect(page.getByText('情境：日本旅遊', { exact: true })).toBeVisible()
    await expect(page.getByText('句數：4 句', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '重新產生' }).click()

    await page.getByLabel('程度').selectOption('N3')
    await page.getByLabel('情境').selectOption('small-talk')
    await page.getByLabel('篇幅').selectOption('long')
    await page.getByRole('button', { name: '產生文章' }).click()
    await expect(page.getByText('JLPT：N3', { exact: true })).toBeVisible()
    await expect(page.getByText('情境：陌生人閒聊', { exact: true })).toBeVisible()
    await expect(page.getByText('句數：9 句', { exact: true })).toBeVisible()
  })

  test('Japanese Practice renders a display-only ruby article and maps Letter states to romaji', async ({ page }) => {
    await selectJapaneseFixture(page)
    await startPractice(page)

    const target = japanesePracticeDocument.sentences.map(getPracticeTypingTarget).join('')
    const firstSentenceTarget = getPracticeTypingTarget(japanesePracticeDocument.sentences[0])
    const display = page.getByTestId('practice-japanese-display')
    const letters = page.getByTestId('practice-romaji-typing-row').locator('[data-testid="practice-editable-letter"]')
    await expect(page.getByTestId('practice-current-sentence')).toContainText(`目前句 1 / ${japanesePracticeDocument.sentences.length}`)
    await expect(display).toHaveAttribute('aria-label', japanesePracticeDocument.sentences[0].name)
    await expect(page.getByTestId('practice-current-sentence')).toContainText(japanesePracticeDocument.sentences[0].trans[0])
    expect(await display.locator('ruby').count()).toBeGreaterThan(0)
    await expect(display.locator('rt').nth(0)).toHaveText('きのう')
    await expect(letters).toHaveText(firstSentenceTarget.split(''))

    await page.getByRole('button', { name: '顯示全文' }).click()
    await expect(page.getByTestId('practice-full-article')).toBeVisible()
    await expect(page.getByTestId('practice-full-article').locator('[data-testid="practice-japanese-sentence"]')).toHaveCount(
      japanesePracticeDocument.sentences.length,
    )
    await expect(page.getByTestId('practice-translation-display')).toContainText(japanesePracticeDocument.sentences.at(-1)?.trans[0] ?? '')
    await page.getByRole('button', { name: '收起全文' }).click()
    await expect(page.getByTestId('practice-full-article')).toHaveCount(0)
    await expect(display).toHaveAttribute('aria-label', japanesePracticeDocument.sentences[0].name)

    await page.keyboard.type(target.slice(0, 7))
    await expect(letters.nth(0)).toHaveClass(/text-green-600/)
    await expect(letters.nth(6)).toHaveClass(/text-green-600/)
    await expect(letters.nth(7)).toHaveClass(/text-gray-600/)

    await page.keyboard.type('x')
    await expect(letters.nth(7)).toHaveClass(/text-red-600/)
    expect(await display.locator('rt').count()).toBeGreaterThan(0)
    await expect(display.locator('[class*="text-green"], [class*="text-red"]')).toHaveCount(0)

    await page.keyboard.type(target[7])
    await expect(letters.nth(7)).toHaveClass(/text-green-600/)
  })

  test('Japanese Practice displays finite CPM after correct input', async ({ page }) => {
    await selectJapaneseFixture(page)
    await startPractice(page)

    await page.keyboard.type(getPracticeTypingTarget(japanesePracticeDocument.sentences[0]).slice(0, 10))
    await page.waitForTimeout(1100)

    const speed = stat(page, '速度').locator('span').first()
    await expect(speed).toHaveText(/^[0-9]+ 字\/分鐘$/)
    await expect(speed).not.toHaveText(/NaN|Infinity/)
    await expect(stat(page, '正確率').locator('span').first()).toHaveText('100%')
  })

  test('toggling Furigana preserves Practice Letter progress', async ({ page }) => {
    await selectJapaneseFixture(page)
    await startPractice(page)

    const display = page.getByTestId('practice-japanese-display')
    const letters = page.getByTestId('practice-romaji-typing-row').locator('[data-testid="practice-editable-letter"]')
    await page.keyboard.type(getPracticeTypingTarget(japanesePracticeDocument.sentences[0]).slice(0, 3))
    await expect(letters.nth(2)).toHaveClass(/text-green-600/)
    expect(await display.locator('rt').count()).toBeGreaterThan(0)

    const phoneticConfigButton = page.getByRole('button', { name: /发音及音标切换/ })
    await phoneticConfigButton.click()
    await page.getByRole('switch').first().click()
    await expect(display.locator('rt')).toHaveCount(0)
    await expect(letters.nth(2)).toHaveClass(/text-green-600/)

    await page.keyboard.press('Escape')
    await phoneticConfigButton.click()
    await page.getByRole('switch').first().click()
    expect(await display.locator('rt').count()).toBeGreaterThan(0)
    await expect(letters.nth(2)).toHaveClass(/text-green-600/)
  })

  test('Japanese fixture completes the full article only after the final character', async ({ page }) => {
    await selectJapaneseFixture(page)
    await startPractice(page)

    const typingTarget = japanesePracticeDocument.sentences.map(getPracticeTypingTarget).join('')
    await submitCommittedText(page, typingTarget.slice(0, -1))
    await expect(page.locator('div.fixed.inset-0.z-30')).toHaveCount(0)
    await submitCommittedText(page, typingTarget.slice(-1))
    await expect(page.locator('div.fixed.inset-0.z-30').getByText('日文測試文章', { exact: true })).toBeVisible()
    const resultScreen = page.locator('div.fixed.inset-0.z-30')
    await expect(resultScreen.getByText('完成時間', { exact: true })).toBeVisible()
    await expect(resultScreen.getByText('速度', { exact: true })).toBeVisible()
    await expect(resultScreen.getByText('正確率', { exact: true })).toBeVisible()
    await expect(resultScreen.getByText('錯誤數', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '再練一次' })).toBeVisible()
    await expect(page.getByRole('button', { name: '下一章节' })).toHaveCount(0)
  })

  test('Practice wrong character stays at the current position until corrected', async ({ page }) => {
    await selectJapaneseFixture(page)
    await startPractice(page)

    const firstTarget = japanesePracticeDocument.sentences.map(getPracticeTypingTarget).join('')
    const correctPrefix = firstTarget.slice(0, 12)
    await page.keyboard.type(correctPrefix)

    await expect(currentLetters(page).nth(0)).toHaveClass(/text-green-600/)
    await expect(currentLetters(page).nth(correctPrefix.length - 1)).toHaveClass(/text-green-600/)
    await expect(stat(page, '輸入數').locator('span').first()).toHaveText(String(correctPrefix.length))
    await expect(stat(page, '正確數').locator('span').first()).toHaveText(String(correctPrefix.length))

    await page.keyboard.type('x')

    await expect(currentLetters(page).nth(correctPrefix.length)).toHaveClass(/text-red-600/)
    await expect(currentLetters(page).nth(correctPrefix.length - 1)).toHaveClass(/text-green-600/)
    await expect(stat(page, '輸入數').locator('span').first()).toHaveText(String(correctPrefix.length + 1))
    await expect(stat(page, '正確數').locator('span').first()).toHaveText(String(correctPrefix.length))

    await page.waitForTimeout(350)
    await expect(currentLetters(page).nth(correctPrefix.length)).toHaveClass(/text-red-600/)

    await page.keyboard.type(firstTarget.slice(correctPrefix.length))
    await expect(page.locator('div.fixed.inset-0.z-30').getByText('日文測試文章', { exact: true })).toBeVisible()
    const resultScreen = page.getByTestId('article-result-screen')
    await expect(resultScreen.getByText('錯誤數', { exact: true }).locator('..').locator('dd')).toHaveText('1')
    await expect(resultScreen.getByText('正確率', { exact: true }).locator('..').locator('dd')).not.toHaveText('100%')
  })

  test('switching back from Japanese fixture restores the CET-4 word mode', async ({ page }) => {
    await selectJapaneseFixture(page)
    await expect(page.getByTestId('practice-romaji-typing-row')).toContainText('kinou')

    await page.getByRole('button', { name: '切回單字模式' }).click()

    await expect(page.getByRole('button', { name: '切回單字模式' })).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('practiceDocumentId') ?? 'null'))).toBeNull()
    await expect(page.getByText('cancel', { exact: true })).toBeVisible()
    await expect(page.getByTestId('practice-japanese-display')).toHaveCount(0)
    await expect(page.getByTestId('practice-romaji-typing-row')).toHaveCount(0)
    await page.getByRole('button', { name: '开始', exact: true }).click()
    await page.keyboard.press('c')
    await expect(currentLetters(page).first()).toHaveClass(/text-green-600/)
  })

  test('Complete the exercises for 1 chapter, enter the next chapter', async ({ page }) => {
    await page.getByRole('button', { name: '开始' }).click()

    const chapter1 = [
      'cancel',
      'explosive',
      'numerous',
      'govern',
      'analyse',
      'discourage',
      'resemble',
      'remote',
      'salary',
      'pollution',
      'pretend',
      'kettle',
      'wreck',
      'drunk',
      'calculate',
      'persistent',
      'sake',
      'conceal',
      'audience',
      'meanwhile',
    ]

    await pressWords(page, chapter1)

    await expect(page.getByText('100%')).toBeVisible()
    await expect(page.getByText('表现不错！全对了！')).toBeVisible()

    await page.getByRole('button', { name: '下一章节' }).click()

    await expect(await page.getByText('第 2 章').first().isVisible()).toBeTruthy()
  })
})
