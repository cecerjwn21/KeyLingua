import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import {
  buildLibraryImportPrompt,
  getDefaultLibraryImportRules,
  getLibraryImportBasePrompt,
  type LibraryImportKind,
} from '../../src/pages/LibraryImport/importPrompts'
import { importChatGPTPracticeDocument } from '../../src/pages/Typing/utils/practiceImport'
import { stripNotation } from '../../src/pages/Typing/components/WordPanel/components/Word/Notation'

const japaneseArticle = {
  title: 'N4｜居酒屋聊天',
  jlptLevel: 'N4',
  scenario: '日本自由行・居酒屋聊天',
  format: 'dialogue',
  sentences: [
    {
      name: '今日は新宿へ行きます。',
      notation: '今日(きょう)は新宿(しんじゅく)へ行(い)きます。',
      trans: ['今天要去新宿。'],
    },
    {
      name: 'ホテルでチェックインします。',
      notation: 'ホテルでチェックインします。',
      trans: ['要在飯店辦理入住。'],
    },
    {
      name: 'コンビニでラーメンを買いました。',
      notation: 'コンビニでラーメンを買(か)いました。',
      trans: ['我在便利商店買了拉麵。'],
    },
  ],
}

const japaneseVocabulary = {
  title: 'N4｜購物單字 10',
  jlptLevel: 'N4',
  items: [{ word: '予約', reading: 'よやく', meaning: '預約', source: 'manual' }],
}

const englishDialogue = [
  {
    title: 'A2｜購物',
    sentences: [{ text: 'Do you have any plans after school?', meaning: '你放學後有什麼計畫嗎？' }],
    level: 'A2',
  },
]

const englishVocabulary = {
  title: 'A2｜購物單字 100',
  items: [{ word: 'receipt', meaning: '收據', source: 'manual' }],
  level: 'A2',
}

const promptContracts: Array<{
  kind: LibraryImportKind
  levelToken: string
  titleRule: string
  schemaToken: string
  forbiddenToken: string
}> = [
  {
    kind: 'japanese-article',
    levelToken: 'N4',
    titleRule: 'JLPT｜情境名稱',
    schemaToken: '"notation"',
    forbiddenToken: 'reading',
  },
  {
    kind: 'japanese-vocabulary',
    levelToken: 'N4',
    titleRule: 'JLPT｜主題單字 數量',
    schemaToken: '"reading"',
    forbiddenToken: 'romaji',
  },
  {
    kind: 'english-dialogue',
    levelToken: 'A2',
    titleRule: 'CEFR｜繁體中文情境名稱',
    schemaToken: '"text"',
    forbiddenToken: 'cefrLevel',
  },
  {
    kind: 'english-vocabulary',
    levelToken: 'A2',
    titleRule: 'CEFR｜主題單字 數量',
    schemaToken: '"source": "manual"',
    forbiddenToken: 'reading',
  },
]

test.describe('四套 ChatGPT 提示詞', () => {
  for (const contract of promptContracts) {
    test(`${contract.kind} 共用 base prompt，只有輸出模式 suffix 不同`, () => {
      const base = getLibraryImportBasePrompt(contract.kind)
      const mobile = buildLibraryImportPrompt(contract.kind, 'mobile')
      const desktop = buildLibraryImportPrompt(contract.kind, 'desktop')

      expect(mobile.startsWith(base)).toBe(true)
      expect(desktop.startsWith(base)).toBe(true)
      expect(base).toContain(contract.levelToken)
      expect(base).toContain(contract.titleRule)
      expect(base).toContain(contract.schemaToken)
      expect(base).toContain(contract.forbiddenToken)
      expect(mobile).toContain('只輸出 JSON 本體')
      expect(mobile).toContain('不要使用 Markdown code fence')
      expect(mobile).not.toContain('請實際建立 UTF-8 `.json` 檔案供我下載')
      expect(desktop).toContain('請實際建立 UTF-8 `.json` 檔案供我下載')
      expect(desktop).toContain('完成後提供可下載的 JSON 檔案')
      expect(desktop).not.toContain('請直接在聊天訊息中輸出完整 JSON')

      if (contract.kind.startsWith('japanese')) {
        expect(base).not.toMatch(/程度：［請自行填寫，例如 A[1-2]］/)
        if (contract.kind === 'japanese-article') {
          expect(base).toContain('name 是 immutable source')
          expect(base).toContain('完成後逐句自我驗證')
          expect(base).toContain('送假名')
          expect(base).toContain('不得重新生成或改寫 name')
          expect(base).toContain('連續漢字詞')
          expect(base).toContain('本当(ほんとう)')
          expect(base).toContain('禁止：本(ほん)とう')
          expect(base).toContain('冷(ひや)や')
          expect(base).toContain('只能在 name 原文字面上插入')
          expect(base).toContain('trans 必須是自然')
          expect(base).toContain('繁體中文 string array')
        }
      } else {
        expect(base).not.toMatch(/程度：［請自行填寫，例如 N[1-5]］/)
      }
    })
  }

  test('Japanese Article 與 English Dialogue prompt 明確禁止 speaker label，且手機與電腦版共用規則', () => {
    const japaneseRules = getDefaultLibraryImportRules('japanese-article')
    const englishRules = getDefaultLibraryImportRules('english-dialogue')
    const japaneseMobile = buildLibraryImportPrompt('japanese-article', 'mobile')
    const japaneseDesktop = buildLibraryImportPrompt('japanese-article', 'desktop')
    const englishMobile = buildLibraryImportPrompt('english-dialogue', 'mobile')
    const englishDesktop = buildLibraryImportPrompt('english-dialogue', 'desktop')

    expect(japaneseRules).toContain('每句只有實際說出口的台詞')
    expect(japaneseRules).toContain('彼女：')
    expect(japaneseRules).toContain('店員：')
    expect(japaneseRules).toContain('A：')
    expect(japaneseRules).toContain('B：')
    expect(englishRules).toContain('sentence 只放真正說出口的英文')
    expect(englishRules).toContain('A:')
    expect(englishRules).toContain('B:')
    expect(englishRules).toContain('Clerk:')
    expect(englishRules).toContain('Customer:')

    expect(japaneseMobile).toContain(japaneseRules)
    expect(japaneseDesktop).toContain(japaneseRules)
    expect(englishMobile).toContain(englishRules)
    expect(englishDesktop).toContain(englishRules)
  })

  test('Custom Rules 只能補充 Core Contract，且兩種輸出模式都保留 schema', () => {
    const customRules = '加入這一條測試生成規則。'
    const mobile = buildLibraryImportPrompt('japanese-article', 'mobile', customRules)
    const desktop = buildLibraryImportPrompt('japanese-article', 'desktop', customRules)

    expect(mobile).toContain('每句固定使用 name、notation、trans')
    expect(desktop).toContain('每句固定使用 name、notation、trans')
    expect(mobile).toContain(customRules)
    expect(desktop).toContain(customRules)
    expect(mobile).toContain('只能補充內容風格')
    expect(desktop).toContain('不得覆蓋前述 JSON schema')
  })
})

test.describe('Japanese Article 實際失敗輸出 regression', () => {
  const fixtures = [
    {
      filename: '失敗1.txt',
      path: 'tests/fixtures/japanese-article-failure-1.json',
      expectedError: '第 13 句的 Furigana 格式與日文原文不一致。',
      expectedMismatchIndexes: [13, 14],
    },
    {
      filename: '失敗2.txt',
      path: 'tests/fixtures/japanese-article-failure-2.json',
      expectedError: '第 13 句的 Furigana 格式與日文原文不一致。',
      expectedMismatchIndexes: [13, 14],
    },
    {
      filename: 'gemini-code-1787844451189.json',
      path: 'tests/fixtures/japanese-article-failure-3.json',
      expectedError: '第 10 句的 Furigana 格式與日文原文不一致。',
      expectedMismatchIndexes: [10],
    },
  ] as const

  for (const fixture of fixtures) {
    test(`${fixture.filename} 由正式 importer 回報精確錯誤`, () => {
      const content = readFileSync(fixture.path, 'utf8')
      const result = importChatGPTPracticeDocument(content)
      const parsed = JSON.parse(content) as { sentences: Array<{ name: string; notation: string }> }
      const notationMismatches = parsed.sentences
        .map((sentence, index) => ({ index, stripped: stripNotation(sentence.notation), name: sentence.name }))
        .filter(({ stripped, name }) => stripped !== name)
      expect(result.document).toBeUndefined()
      expect(result.error).toBe(fixture.expectedError)
      expect(notationMismatches.map(({ index }) => index + 1)).toEqual(fixture.expectedMismatchIndexes)
      console.log(`${fixture.filename} notation 差異: ${notationMismatches.map(({ index, name, stripped }) => `第 ${index + 1} 句 name=${JSON.stringify(name)} stripped=${JSON.stringify(stripped)}`).join('；')}`)
      console.log(`${fixture.filename}: ${result.error}`)
    })
  }
})

test.describe('四套兩階段匯入流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('pastedPracticeDocuments')
      localStorage.removeItem('chatGPTPracticeDocumentIds')
      localStorage.removeItem('vocabularyLibrary')
      localStorage.removeItem('englishPracticeDocuments')
      localStorage.removeItem('englishVocabularyLibrary')
    })
  })

  test('Japanese Article 選檔與驗證不寫入，confirm 才寫入，修改後舊驗證失效', async ({ page }) => {
    await page.reload()
    const beforeImport = await page.evaluate(() => localStorage.getItem('pastedPracticeDocuments'))
    expect(JSON.parse(beforeImport ?? 'null')).toEqual([])
    await page.getByRole('button', { name: '匯入文章' }).click()
    await page.getByLabel('選擇 JSON 檔案').setInputFiles({
      name: 'n4-izakaya.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(japaneseArticle)),
    })
    await expect(page.getByLabel('文章 JSON')).toHaveValue(/N4｜居酒屋聊天/)
    await expect(page.getByText('文章驗證成功', { exact: true })).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('pastedPracticeDocuments'))).toBe(beforeImport)

    await page.getByRole('button', { name: '驗證文章' }).click()
    await expect(page.getByText('文章驗證成功', { exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => localStorage.getItem('pastedPracticeDocuments'))).toBe(beforeImport)
    await expect(page.getByText('Furigana', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: '返回編輯' }).click()
    await page.getByLabel('文章 JSON').fill(`${JSON.stringify(japaneseArticle)} `)
    await expect(page.getByRole('button', { name: '確認匯入文章' })).toHaveCount(0)
    await page.getByRole('button', { name: '驗證文章' }).click()
    await page.getByRole('button', { name: '確認匯入文章' }).click()
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('pastedPracticeDocuments') ?? '[]').length)).toBe(1)
  })

  test('Japanese Vocabulary 選檔與驗證不寫入，confirm 才建立題庫', async ({ page }) => {
    await page.goto('/ja/vocabulary')
    await page.getByRole('button', { name: '匯入題庫' }).click()
    await page.getByLabel('選擇 JSON 檔案').setInputFiles({
      name: 'n4-shopping.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(japaneseVocabulary)),
    })
    await expect(page.getByLabel('單字 JSON')).toHaveValue(/N4｜購物單字 10/)
    await expect(page.getByText(/單字題庫驗證成功/)).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('vocabularyLibrary') ?? '{"sets":[]}').sets.length)).toBe(0)

    await page.getByRole('button', { name: '驗證題庫' }).click()
    await expect(page.getByText('單字題庫驗證成功', { exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('vocabularyLibrary') ?? '{"sets":[]}').sets.length)).toBe(0)
    await page.getByRole('button', { name: '確認匯入題庫' }).click()
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('vocabularyLibrary') ?? '{"sets":[]}').sets.length)).toBe(1)
  })

  test('English Dialogue 選檔與驗證不寫入，confirm 才寫入且保留無尾端空白 text', async ({ page }) => {
    await page.goto('/en/dialogues')
    const beforeImport = await page.evaluate(() => localStorage.getItem('englishPracticeDocuments'))
    expect(JSON.parse(beforeImport ?? 'null')).toEqual([])
    await page.getByRole('button', { name: '匯入' }).click()
    await page.getByLabel('選擇 JSON 檔案').setInputFiles({
      name: 'a2-shopping.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(englishDialogue)),
    })
    await expect(page.locator('textarea')).toHaveValue(/A2｜購物/)
    await expect(page.getByText('對話驗證成功', { exact: true })).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('englishPracticeDocuments'))).toBe(beforeImport)

    await page.getByRole('button', { name: '驗證對話' }).click()
    await expect(page.getByText('對話驗證成功', { exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => localStorage.getItem('englishPracticeDocuments'))).toBe(beforeImport)
    await page.getByRole('button', { name: '確認匯入對話' }).click()
    const savedText = await page.evaluate(
      () => JSON.parse(localStorage.getItem('englishPracticeDocuments') ?? '[]')[0]?.sentences[0]?.text,
    )
    expect(savedText).toBe('Do you have any plans after school?')
  })

  test('English Vocabulary 選檔與驗證不寫入，confirm 才建立不含 reading 的題庫', async ({ page }) => {
    await page.goto('/en/vocabulary')
    const beforeImport = await page.evaluate(() => localStorage.getItem('englishVocabularyLibrary'))
    expect(JSON.parse(beforeImport ?? 'null')).toEqual({ version: 1, sets: [], items: [] })
    await page.getByRole('button', { name: '匯入' }).click()
    await page.getByLabel('選擇 JSON 檔案').setInputFiles({
      name: 'a2-shopping-vocabulary.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(englishVocabulary)),
    })
    await expect(page.locator('textarea')).toHaveValue(/receipt/)
    await expect(page.getByText('單字題庫驗證成功', { exact: true })).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('englishVocabularyLibrary'))).toBe(beforeImport)

    await page.getByRole('button', { name: '驗證題庫' }).click()
    await expect(page.getByText('單字題庫驗證成功', { exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => localStorage.getItem('englishVocabularyLibrary'))).toBe(beforeImport)
    await page.getByRole('button', { name: '確認匯入題庫' }).click()
    const savedItem = await page.evaluate(
      () => JSON.parse(localStorage.getItem('englishVocabularyLibrary') ?? '{"items":[]}').items[0],
    )
    expect(savedItem).toMatchObject({ word: 'receipt', meaning: '收據', source: 'manual' })
    expect(savedItem).not.toHaveProperty('reading')
  })

  for (const route of ['/', '/ja/vocabulary', '/en/dialogues', '/en/vocabulary']) {
    test(`${route} importer 都提供手機版與電腦版提示詞`, async ({ page }) => {
      await page.goto(route)
      await page.getByRole('button', { name: route.startsWith('/en/') ? '匯入' : route === '/' ? '匯入文章' : '匯入題庫' }).click()
      await page.getByText('給 ChatGPT 的格式', { exact: true }).click()
      await expect(page.getByRole('button', { name: '複製手機版提示詞' })).toBeVisible()
      await expect(page.getByRole('button', { name: '複製電腦版提示詞' })).toBeVisible()
      await expect(page.getByRole('button', { name: '編輯生成規則' })).toBeVisible()
    })
  }

  test('Japanese Article 自訂規則會保存、供手機與電腦版共用，且不影響其他三類與可還原預設', async ({ page, context }) => {
    const japaneseCustomRule = '請讓店員自然先開口，並保留這個測試規則。'
    const englishCustomRule = 'Use concise, natural replies for this test.'
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.goto('/')
    await page.getByRole('button', { name: '匯入文章' }).click()
    await page.getByText('給 ChatGPT 的格式', { exact: true }).click()
    await page.getByRole('button', { name: '編輯生成規則' }).click()
    const editor = page.getByRole('dialog', { name: '編輯 ChatGPT 生成規則' })
    await editor.getByLabel('內容生成規則').fill(japaneseCustomRule)
    await editor.getByRole('button', { name: '儲存' }).click()

    await page.getByRole('button', { name: '複製手機版提示詞' }).click()
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(japaneseCustomRule)
    await page.getByRole('button', { name: '複製電腦版提示詞' }).click()
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(japaneseCustomRule)
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('每句固定使用 name、notation、trans')

    await page.reload()
    await page.getByRole('button', { name: '匯入文章' }).click()
    await page.getByText('給 ChatGPT 的格式', { exact: true }).click()
    await page.getByRole('button', { name: '編輯生成規則' }).click()
    await expect(page.getByRole('dialog', { name: '編輯 ChatGPT 生成規則' }).getByLabel('內容生成規則')).toHaveValue(japaneseCustomRule)
    await page.getByRole('button', { name: '取消' }).click()

    await page.goto('/ja/vocabulary')
    await page.getByRole('button', { name: '匯入題庫' }).click()
    await page.getByText('給 ChatGPT 的格式', { exact: true }).click()
    await page.getByRole('button', { name: '編輯生成規則' }).click()
    await expect(page.getByLabel('內容生成規則')).not.toHaveValue(japaneseCustomRule)
    await page.getByRole('button', { name: '取消' }).click()

    await page.goto('/en/dialogues')
    await page.getByRole('button', { name: '匯入' }).click()
    await page.getByText('給 ChatGPT 的格式', { exact: true }).click()
    await page.getByRole('button', { name: '編輯生成規則' }).click()
    await page.getByLabel('內容生成規則').fill(englishCustomRule)
    await page.getByRole('button', { name: '儲存' }).click()

    await page.goto('/en/vocabulary')
    await page.getByRole('button', { name: '匯入' }).click()
    await page.getByText('給 ChatGPT 的格式', { exact: true }).click()
    await page.getByRole('button', { name: '編輯生成規則' }).click()
    await expect(page.getByLabel('內容生成規則')).not.toHaveValue(englishCustomRule)
    await page.getByRole('button', { name: '取消' }).click()

    await page.goto('/')
    await page.getByRole('button', { name: '匯入文章' }).click()
    await page.getByText('給 ChatGPT 的格式', { exact: true }).click()
    await page.getByRole('button', { name: '編輯生成規則' }).click()
    await page.getByRole('button', { name: '還原預設' }).click()
    await expect(page.getByText('確定要還原此類型的預設生成規則嗎？')).toBeVisible()
    await page.getByRole('button', { name: '確認還原預設' }).click()
    await expect(page.getByLabel('內容生成規則')).not.toHaveValue(japaneseCustomRule)
  })

  for (const route of ['/', '/ja/vocabulary', '/en/dialogues', '/en/vocabulary']) {
    test(`${route} importer 使用共用且可鍵盤操作的 JSON 選檔器`, async ({ page }) => {
      await page.goto(route)
      await page.getByRole('button', { name: route.startsWith('/en/') ? '匯入' : route === '/' ? '匯入文章' : '匯入題庫' }).click()

      const picker = page.getByTestId('json-file-picker')
      await expect(picker).toBeVisible()
      await expect(picker.getByText('選擇 JSON 檔案', { exact: true })).toBeVisible()
      await expect(picker.getByRole('button', { name: '開啟 JSON 檔案選擇器' })).toBeVisible()
      await expect(picker.getByText('沒有選擇檔案', { exact: true })).toHaveCount(0)

      const input = picker.getByLabel('選擇 JSON 檔案')
      await input.setInputFiles({
        name: '很長很長很長很長很長很長很長的練習資料名稱.json',
        mimeType: 'application/json',
        buffer: Buffer.from(route.startsWith('/en/dialogues') ? JSON.stringify(englishDialogue) : route.startsWith('/en/vocabulary') ? JSON.stringify(englishVocabulary) : route === '/' ? JSON.stringify(japaneseArticle) : JSON.stringify(japaneseVocabulary)),
      })
      await expect(picker.getByTitle('很長很長很長很長很長很長很長的練習資料名稱.json')).toBeVisible()
    })
  }
})
