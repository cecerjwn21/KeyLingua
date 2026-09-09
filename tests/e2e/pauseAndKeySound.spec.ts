import { japanesePracticeDocument } from '../../src/resources/practiceDocuments'
import { expect, test } from '@playwright/test'

const openJapanesePractice = async (page: import('@playwright/test').Page, darkMode = false) => {
  await page.goto('/')
  await page.evaluate(
    ({ document, darkMode }) => {
      localStorage.setItem('practiceDocumentId', JSON.stringify(document.id))
      localStorage.setItem('pastedPracticeDocuments', JSON.stringify([document]))
      localStorage.setItem('isOpenDarkModeAtom', JSON.stringify(darkMode))
    },
    { document: japanesePracticeDocument, darkMode },
  )
  await page.goto('/typing')
  await expect(page.getByTestId('practice-header-title')).toHaveText(japanesePracticeDocument.title)
}

for (const viewport of [
  { name: '1366px', width: 1366, height: 850 },
  { name: '760px', width: 760, height: 850 },
]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`Pause actions reveal Restart outside header flow at ${viewport.name} ${theme}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await openJapanesePractice(page, theme === 'dark')
      await page.getByRole('button', { name: '繼續' }).click()
      await page.getByRole('button', { name: '暫停' }).click()

      const container = page.getByTestId('pause-actions')
      const resume = container.getByRole('button', { name: '繼續' })
      const restart = container.getByRole('button', { name: '重新' })
      await expect(container).toBeVisible()
      await expect(resume).toBeVisible()
      await page.mouse.move(0, 0)
      await page.getByRole('link', { name: '返回文章庫' }).focus()
      await expect(restart).toBeHidden()

      const header = page.getByRole('navigation', { name: '文章練習控制' })
      const headerBeforeReveal = await header.boundingBox()
      const containerBox = await container.boundingBox()
      const resumeBox = await resume.boundingBox()
      expect(headerBeforeReveal).not.toBeNull()
      expect(containerBox).not.toBeNull()
      expect(resumeBox).not.toBeNull()
      expect(containerBox!.height).toBe(40)
      expect(resumeBox!.height).toBe(40)
      await page.screenshot({ path: testInfo.outputPath('pause-default.png') })

      await resume.hover()
      await expect(restart).toBeVisible()
      const restartBox = await restart.boundingBox()
      expect(restartBox).not.toBeNull()
      expect(resumeBox!.width).toBe(restartBox!.width)
      expect(resumeBox!.height).toBe(restartBox!.height)
      expect(restartBox!.y - (resumeBox!.y + resumeBox!.height)).toBe(6)
      expect(restartBox!.y).toBeGreaterThanOrEqual(containerBox!.y + containerBox!.height)
      expect((await header.boundingBox())!.height).toBe(headerBeforeReveal!.height)
      await page.screenshot({ path: testInfo.outputPath('pause-restart-revealed.png') })

      await page.mouse.move(restartBox!.x + restartBox!.width / 2, restartBox!.y - 3)
      await expect(restart).toBeVisible()
      await page.mouse.move(restartBox!.x + restartBox!.width / 2, restartBox!.y + restartBox!.height / 2)
      await expect(restart).toBeVisible()

      await page.mouse.move(0, 0)
      await expect(restart).toBeHidden()

      await resume.focus()
      await expect(restart).toBeVisible()
      await restart.focus()
      await expect(restart).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page.getByTestId('article-progress')).toHaveAttribute('aria-valuenow', '0')
    })
  }
}

test('key sound maps persisted 0%, 100%, and 150% to key-only gain without a second attenuation', async ({ page }) => {
  await page.addInitScript(() => {
    const originalCreateGain = BaseAudioContext.prototype.createGain
    const gainValues: number[] = []
    Object.defineProperty(window, '__keySoundGainValues', { configurable: true, value: gainValues })
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
  await openJapanesePractice(page)
  await page.getByRole('button', { name: '音效', exact: true }).click()
  const slider = page.getByLabel('按鍵音音量')
  await page.getByLabel('效果音音量').fill('37')

  for (const [percent, expectedGain, key] of [
    ['0', 0, 'k'],
    ['100', 3, 'i'],
    ['150', 6, 'n'],
  ] as const) {
    await slider.fill(percent)
    await page.getByRole('button', { name: '音效', exact: true }).click()
    if (await page.getByRole('button', { name: '繼續' }).isVisible()) {
      await page.getByRole('button', { name: '繼續' }).click()
    }
    await page.waitForTimeout(150)
    await page.evaluate(() => ((window as Window & { __keySoundGainValues: number[] }).__keySoundGainValues.length = 0))
    await page.keyboard.press(key)
    await expect
      .poll(() => page.evaluate(() => (window as Window & { __keySoundGainValues: number[] }).__keySoundGainValues))
      .toContain(expectedGain)
    if (percent !== '150') {
      await page.getByRole('button', { name: '暫停' }).click()
      await page.getByRole('button', { name: '音效', exact: true }).click()
    }
  }

  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('keySoundsConfig') ?? 'null')?.volume)).toBe(1.5)
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('hintSoundsConfig') ?? 'null')?.volume)).toBe(0.37)
})
