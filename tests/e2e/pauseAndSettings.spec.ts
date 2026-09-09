import { japanesePracticeDocument } from '../../src/resources/practiceDocuments'
import { expect, test } from '@playwright/test'

const openJapanesePractice = async (page: import('@playwright/test').Page) => {
  await page.goto('/')
  await page.evaluate((document) => {
    localStorage.setItem('practiceDocumentId', JSON.stringify(document.id))
    localStorage.setItem('pastedPracticeDocuments', JSON.stringify([document]))
  }, japanesePracticeDocument)
  await page.goto('/typing')
  await expect(page.getByTestId('practice-header-title')).toHaveText(japanesePracticeDocument.title)
}

test.describe('Pause and advanced speech diagnostics UI', () => {
  test('Pause menu reveals Restart as an out-of-flow action and Restart still resets practice', async ({ page }) => {
    await openJapanesePractice(page)
    await page.getByRole('button', { name: '繼續' }).click()
    await page.keyboard.type('kinou')
    await page.getByRole('button', { name: '暫停' }).click()

    const menu = page.getByTestId('pause-actions')
    const continueButton = page.getByRole('button', { name: '繼續' })
    const restartButton = page.getByRole('button', { name: '重新' })
    await expect(menu).toBeVisible()
    await expect(page.getByRole('button', { name: '重新開始' })).toHaveCount(0)

    await page.mouse.move(0, 0)
    await page.getByRole('link', { name: '返回文章庫' }).focus()
    await expect(restartButton).toBeHidden()
    const menuBox = await menu.boundingBox()
    const header = page.getByRole('navigation', { name: '文章練習控制' })
    const headerBeforeHover = await header.boundingBox()
    expect(menuBox).not.toBeNull()
    expect(menuBox!.height).toBe(40)

    await continueButton.hover()
    await expect(restartButton).toBeVisible()
    const continueBox = await continueButton.boundingBox()
    const restartBox = await restartButton.boundingBox()
    expect(continueBox).not.toBeNull()
    expect(restartBox).not.toBeNull()
    expect(restartBox!.width).toBe(continueBox!.width)
    expect(restartBox!.height).toBe(continueBox!.height)
    expect(restartBox!.y - (continueBox!.y + continueBox!.height)).toBe(6)
    expect(restartBox!.y).toBeGreaterThanOrEqual(menuBox!.y + menuBox!.height)
    expect((await header.boundingBox())!.height).toBe(headerBeforeHover!.height)

    const beforeHover = await restartButton.boundingBox()
    await restartButton.hover()
    const afterHover = await restartButton.boundingBox()
    expect(afterHover).toEqual(beforeHover)
    await expect(restartButton).toHaveCSS('transform', 'none')

    await continueButton.click()
    await expect(page.getByRole('button', { name: '暫停' })).toBeVisible()
    await page.getByRole('button', { name: '暫停' }).click()
    await page.getByRole('button', { name: '繼續' }).hover()
    await page.getByRole('button', { name: '重新' }).click()
    await expect(page.getByTestId('article-progress')).toHaveAttribute('aria-valuenow', '0')
  })

  test('normal typing hides speech diagnostics and Settings advanced section reveals browser voice data', async ({ page }) => {
    await page.addInitScript(() => {
      const voices = [
        {
          name: 'Microsoft Nanami Online (Natural) - Japanese (Japan)',
          voiceURI: 'nanami-cloud',
          lang: 'ja-JP',
          localService: false,
          default: true,
        },
        {
          name: 'Microsoft Keita Online (Natural) - Japanese (Japan)',
          voiceURI: 'keita-cloud',
          lang: 'ja-JP',
          localService: false,
          default: false,
        },
      ]
      Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: {
          getVoices: () => voices,
          speak: () => undefined,
          cancel: () => undefined,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        },
      })
    })
    await openJapanesePractice(page)
    await expect(page.getByRole('button', { name: '語音診斷' })).toHaveCount(0)
    await page.getByRole('button', { name: '練習設定' }).click()
    const advanced = page.getByRole('group', { name: '進階' })
    await expect(advanced).toBeVisible()
    await expect(advanced.getByTestId('speech-voice-diagnostics')).toBeHidden()
    await advanced.getByText('進階', { exact: true }).click()
    const diagnostics = advanced.getByTestId('speech-voice-diagnostics')
    await expect(diagnostics).toContainText('Microsoft Nanami Online (Natural) - Japanese (Japan)')
    await expect(diagnostics).toContainText('Microsoft Keita Online (Natural) - Japanese (Japan)')
    await expect(diagnostics).toContainText('nanami-cloud')
    await expect(diagnostics).toContainText('ja-JP')
  })
})
