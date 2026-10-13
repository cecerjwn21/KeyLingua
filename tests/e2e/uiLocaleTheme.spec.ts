import { translateUi } from '../../src/i18n/catalog'
import { expect, test } from '@playwright/test'

test.describe('UI locale catalog', () => {
  test('zh-TW、en、ja 有獨立 UI copy，且學習語言名稱不被當成 locale state', () => {
    expect(translateUi('zh-TW', 'library.article.title')).toBe('文章庫')
    expect(translateUi('en', 'library.article.title')).toBe('Article Library')
    expect(translateUi('ja', 'library.article.title')).toBe('記事ライブラリ')
    expect(translateUi('en', 'learningLanguage.japanese')).toBe('日本語')
    expect(translateUi('ja', 'learningLanguage.english')).toBe('English')
  })
})

test.describe('UI locale and theme controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (localStorage.getItem('keylinguaUiLocale') === null) localStorage.setItem('keylinguaUiLocale', JSON.stringify('zh-TW'))
      if (localStorage.getItem('isOpenDarkModeAtom') === null) localStorage.setItem('isOpenDarkModeAtom', JSON.stringify(false))
    })
    await page.goto('/')
  })

  test('切換 zh-TW / en / ja 並保存 locale，且學習語言 route 不變', async ({ page }) => {
    const localeButton = page.getByRole('button', { name: '切換介面語言' })
    await localeButton.click()
    await page.getByRole('menuitemradio', { name: 'English' }).click()
    await expect(page.getByRole('heading', { name: 'Article Library' })).toBeVisible()
    await expect(page).toHaveURL(/\/$/)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('keylinguaUiLocale'))).toBe(JSON.stringify('en'))

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Article Library' })).toBeVisible()
    await page.getByRole('button', { name: 'Change interface language' }).click()
    await page.getByRole('menuitemradio', { name: '日本語' }).click()
    await expect(page.getByRole('heading', { name: '記事ライブラリ' })).toBeVisible()
    await expect(page).toHaveURL(/\/$/)
  })

  test('theme icon-only button 沿用既有 atom 並在 reload 後保存', async ({ page }) => {
    const themeButton = page.getByRole('button', { name: '切換深色模式' })
    await expect(themeButton).toHaveAttribute('title', '切換深色模式')
    await expect(themeButton.locator('svg')).toHaveCount(1)
    await themeButton.click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('isOpenDarkModeAtom'))).toBe(JSON.stringify(true))

    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByRole('button', { name: '切換淺色模式' })).toBeVisible()
  })

  test('prefers-reduced-motion 下不執行 popover transform motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: '切換介面語言' }).click()
    const menu = page.getByRole('menu', { name: '介面語言' })
    await expect(menu).toBeVisible()
    await expect
      .poll(() => menu.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration)))
      .toBeLessThanOrEqual(0.00001)
  })

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1366, height: 900 },
  ]) {
    test(`${viewport.width}px controls 不造成 horizontal overflow`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    })
  }
})
