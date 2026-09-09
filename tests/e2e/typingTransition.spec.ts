import { createArticleTypingSession } from '../../src/pages/Typing/utils/practiceArticle'
import type { PracticeDocument } from '../../src/typings'
import { expect, test } from '@playwright/test'

type PracticeFixture = {
  name: string
  route: string
  target: string
  nextTarget: string
  activeSelector: string
  activeAttribute?: string
  activeText: string
  nextActiveText: string
  storage: Record<string, unknown>
}

const articleDocument: PracticeDocument = {
  id: 'typing-transition-article',
  title: '切題同步測試文章',
  source: 'fixture',
  language: 'ja',
  jlptLevel: 'N5',
  scenario: '測試',
  sentences: [
    { name: 'あ。', notation: 'あ(あ)。', trans: ['第一句'] },
    { name: 'い。', notation: 'い(い)。', trans: ['第二句'] },
  ],
}

const articleSession = createArticleTypingSession(articleDocument)

const fixtures: PracticeFixture[] = [
  {
    name: 'Japanese Article',
    route: '/ja/typing',
    target: articleSession.typingTarget.slice(0, articleSession.sentencePresentations[0].targetEnd),
    nextTarget: articleSession.typingTarget.slice(
      articleSession.sentencePresentations[1].targetStart,
      articleSession.sentencePresentations[1].targetEnd,
    ),
    activeSelector: '[data-testid="practice-japanese-display"]',
    activeAttribute: 'aria-label',
    activeText: articleDocument.sentences[0].name,
    nextActiveText: articleDocument.sentences[1].name,
    storage: {
      pastedPracticeDocuments: [articleDocument],
      practiceDocumentId: articleDocument.id,
      practiceSource: { language: 'japanese', practiceType: 'article', id: articleDocument.id },
    },
  },
  {
    name: 'Japanese Vocabulary',
    route: '/ja/typing',
    target: 'kaikei',
    nextTarget: 'fukuro',
    activeSelector: '[data-testid="vocabulary-current-word"] h2',
    activeText: '会計',
    nextActiveText: '袋',
    storage: {
      vocabularyLibrary: {
        version: 1,
        sets: [{ id: 'typing-transition-japanese-vocabulary', title: 'N5｜切題同步單字', jlptLevel: 'N5', createdAt: '2026-08-28T00:00:00.000Z' }],
        items: [
          { id: 'typing-transition-japanese-vocabulary-1', setId: 'typing-transition-japanese-vocabulary', jlptLevel: 'N5', word: '会計', reading: 'かいけい', meaning: '結帳' },
          { id: 'typing-transition-japanese-vocabulary-2', setId: 'typing-transition-japanese-vocabulary', jlptLevel: 'N5', word: '袋', reading: 'ふくろ', meaning: '袋子' },
        ],
      },
      currentVocabularySetId: 'typing-transition-japanese-vocabulary',
      practiceSource: { language: 'japanese', practiceType: 'vocabulary', id: 'typing-transition-japanese-vocabulary' },
    },
  },
  {
    name: 'English Dialogue',
    route: '/en/typing',
    target: 'One.',
    nextTarget: 'Two.',
    activeSelector: '[data-testid="practice-english-display"]',
    activeText: 'One.',
    nextActiveText: 'Two.',
    storage: {
      englishPracticeDocuments: [
        {
          id: 'typing-transition-english-dialogue',
          title: 'A1｜切題同步對話',
          level: 'A1',
          source: 'manual',
          createdAt: '2026-08-28T00:00:00.000Z',
          sentences: [
            { text: 'One.', meaning: '一。' },
            { text: 'Two.', meaning: '二。' },
          ],
        },
      ],
      englishPracticeDocumentId: 'typing-transition-english-dialogue',
      practiceSource: { language: 'english', practiceType: 'dialogue', id: 'typing-transition-english-dialogue' },
    },
  },
  {
    name: 'English Vocabulary',
    route: '/en/typing',
    target: 'one',
    nextTarget: 'two',
    activeSelector: '[data-testid="english-vocabulary-practice"] h2',
    activeText: 'one',
    nextActiveText: 'two',
    storage: {
      englishVocabularyLibrary: {
        version: 1,
        sets: [{ id: 'typing-transition-english-vocabulary', title: 'A1｜切題同步單字', level: 'A1', createdAt: '2026-08-28T00:00:00.000Z' }],
        items: [
          { id: 'typing-transition-english-vocabulary-1', setId: 'typing-transition-english-vocabulary', word: 'one', meaning: '一' },
          { id: 'typing-transition-english-vocabulary-2', setId: 'typing-transition-english-vocabulary', word: 'two', meaning: '二' },
        ],
      },
      englishVocabularySetId: 'typing-transition-english-vocabulary',
      practiceSource: { language: 'english', practiceType: 'vocabulary', id: 'typing-transition-english-vocabulary' },
    },
  },
]

const physicalKeyForCharacter = (character: string): string => {
  const punctuation: Record<string, string> = {
    ',': 'Comma',
    '.': 'Period',
    '?': 'Shift+Slash',
    '!': 'Shift+Digit1',
  }

  if (/^[a-z]$/u.test(character)) return `Key${character.toUpperCase()}`
  return punctuation[character]
}

const pressPhysicalTarget = async (page: import('@playwright/test').Page, target: string) => {
  for (const character of target) {
    const key = physicalKeyForCharacter(character)
    await page.keyboard.press(key)
  }
}

test.describe('shared Typing active-item transition', () => {
  for (const fixture of fixtures) {
    test(`${fixture.name} switches active content and typing target in one commit`, async ({ page }) => {
      await page.addInitScript((storage) => {
        for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, JSON.stringify(value))
      }, fixture.storage)
      await page.goto(fixture.route)
      await page.getByRole('button', { name: '繼續' }).click()

      if (fixture.activeAttribute) {
        await expect(page.locator(fixture.activeSelector)).toHaveAttribute(fixture.activeAttribute, fixture.activeText)
      } else {
        await expect(page.locator(fixture.activeSelector)).toHaveText(fixture.activeText)
      }
      await expect(page.getByTestId('practice-romaji-typing-row')).toHaveText(fixture.target)

      await page.evaluate(({ activeSelector, activeAttribute }) => {
        const history: Array<{ active: string | null; target: string | null }> = []
        const read = () => {
          const activeNode = document.querySelector(activeSelector)
          history.push({
            active: activeAttribute ? activeNode?.getAttribute(activeAttribute) ?? null : activeNode?.textContent ?? null,
            target: document.querySelector('[data-testid="practice-romaji-typing-row"]')?.textContent ?? null,
          })
        }
        const observer = new MutationObserver(read)
        observer.observe(document.body, { childList: true, characterData: true, subtree: true })
        ;(window as Window & { __typingTransitionObserver?: MutationObserver; __typingTransitionHistory?: typeof history }).__typingTransitionObserver = observer
        ;(window as Window & { __typingTransitionHistory?: typeof history }).__typingTransitionHistory = history
      }, fixture)

      for (const character of fixture.target) await page.keyboard.press(character)
      if (fixture.activeAttribute) {
        await expect(page.locator(fixture.activeSelector)).toHaveAttribute(fixture.activeAttribute, fixture.nextActiveText)
      } else {
        await expect(page.locator(fixture.activeSelector)).toHaveText(fixture.nextActiveText)
      }
      await expect(page.getByTestId('practice-romaji-typing-row')).toHaveText(fixture.nextTarget)

      const history = await page.evaluate(() => {
        const currentWindow = window as Window & { __typingTransitionObserver?: MutationObserver; __typingTransitionHistory?: Array<{ active: string | null; target: string | null }> }
        currentWindow.__typingTransitionObserver?.disconnect()
        return currentWindow.__typingTransitionHistory ?? []
      })

      expect(history).not.toContainEqual({ active: fixture.nextActiveText, target: '' })
    })
  }

  test('Japanese Vocabulary 將 reading 經 canonical target 後在切題第一鍵與 physical punctuation 都保持同步', async ({ page }) => {
    const setId = 'japanese-vocabulary-canonical-target-regression'
    const storage = {
      vocabularyLibrary: {
        version: 1,
        sets: [{ id: setId, title: 'N5｜canonical target regression', jlptLevel: 'N5', createdAt: '2026-08-29T00:00:00.000Z' }],
        items: [
          { id: `${setId}-1`, setId, jlptLevel: 'N5', word: '前の題', reading: 'あ', meaning: '前一題' },
          { id: `${setId}-2`, setId, jlptLevel: 'N5', word: 'はい、元気です', reading: 'はい、げんきです', meaning: '是的，我很好' },
          { id: `${setId}-3`, setId, jlptLevel: 'N5', word: 'すみません。だいじょうぶです。', reading: 'すみません。だいじょうぶです。', meaning: '抱歉。沒關係。' },
          { id: `${setId}-4`, setId, jlptLevel: 'N5', word: 'だいじょうぶ？', reading: 'だいじょうぶ？', meaning: '沒事嗎？' },
          { id: `${setId}-5`, setId, jlptLevel: 'N5', word: 'すごい！', reading: 'すごい！', meaning: '厲害！' },
          { id: `${setId}-6`, setId, jlptLevel: 'N5', word: 'えっと…ちょっとまって', reading: 'えっと…ちょっとまって', meaning: '嗯……請等一下' },
        ],
      },
      currentVocabularySetId: setId,
      practiceSource: { language: 'japanese', practiceType: 'vocabulary', id: setId },
    }
    const targets = ['a', 'hai,genkidesu', 'sumimasen.daijoubudesu.', 'daijoubu?', 'sugoi!', 'etto...chottomatte']

    await page.addInitScript((initialStorage) => {
      for (const [key, value] of Object.entries(initialStorage)) localStorage.setItem(key, JSON.stringify(value))
    }, storage)
    await page.goto('/ja/typing')
    await page.getByRole('button', { name: '繼續' }).click()

    await expect(page.getByTestId('practice-romaji-typing-row')).toHaveText(targets[0])
    await page.keyboard.press('KeyA')
    await expect(page.getByTestId('vocabulary-current-word').locator('h2')).toHaveText('はい、元気です')
    await expect(page.getByTestId('vocabulary-current-word')).toContainText('はい、げんきです')
    await expect(page.getByTestId('practice-romaji-typing-row')).toHaveText(targets[1])

    const letters = page.getByTestId('practice-romaji-typing-row').getByTestId('practice-editable-letter')
    await expect(letters.first()).toHaveText('h')
    await expect(letters.first()).toHaveAttribute('data-current-letter', 'true')
    await expect(letters.first()).toHaveClass(/text-gray-600/)

    await page.keyboard.press('KeyH')
    await expect(letters.first()).toHaveClass(/text-green-600/)
    await expect(letters.nth(1)).toHaveAttribute('data-current-letter', 'true')

    await page.keyboard.press('KeyA')
    await page.keyboard.press('KeyI')
    await expect(letters.nth(3)).toHaveText(',')
    await expect(letters.nth(3)).toHaveAttribute('data-current-letter', 'true')
    await page.keyboard.press('Comma')
    await expect(letters.nth(3)).toHaveClass(/text-green-600/)
    await pressPhysicalTarget(page, targets[1].slice(4))

    for (const target of targets.slice(2)) {
      await expect(page.getByTestId('practice-romaji-typing-row')).toHaveText(target)
      await pressPhysicalTarget(page, target)
    }

    await expect(page.getByTestId('vocabulary-result-screen')).toBeVisible()
  })
})
