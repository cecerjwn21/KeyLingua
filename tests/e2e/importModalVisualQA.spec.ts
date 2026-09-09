import { expect, test } from '@playwright/test'

const importers = [
  { route: '/', trigger: '匯入文章', name: 'japanese-article' },
  { route: '/ja/vocabulary', trigger: '匯入題庫', name: 'japanese-vocabulary' },
  { route: '/en/dialogues', trigger: '匯入', name: 'english-dialogue' },
  { route: '/en/vocabulary', trigger: '匯入', name: 'english-vocabulary' },
] as const

const expectModalLayout = async (page: import('@playwright/test').Page) => {
  const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }))
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)

  const dialog = page.getByRole('dialog')
  const picker = dialog.getByTestId('json-file-picker')
  const prompt = dialog.getByText('給 ChatGPT 的格式', { exact: true }).locator('..')
  await expect(picker).toBeVisible()
  await expect(prompt).toBeVisible()

  const [pickerBox, promptBox] = await Promise.all([picker.boundingBox(), prompt.boundingBox()])
  expect(pickerBox).not.toBeNull()
  expect(promptBox).not.toBeNull()
  expect(promptBox!.y).toBeGreaterThanOrEqual(pickerBox!.y + pickerBox!.height)
}

const expectRulesEditorLayout = async (page: import('@playwright/test').Page) => {
  await page.getByText('給 ChatGPT 的格式', { exact: true }).click()
  await page.getByRole('button', { name: '編輯生成規則' }).click()

  const editor = page.locator('[data-testid="library-import-rules-editor"]:visible')
  const textarea = editor.getByLabel('內容生成規則')
  await expect(editor).toBeVisible()
  await expect(textarea).toBeVisible()

  const [editorBox, textareaBox, dimensions] = await Promise.all([
    editor.boundingBox(),
    textarea.boundingBox(),
    page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth })),
  ])
  expect(editorBox).not.toBeNull()
  expect(textareaBox).not.toBeNull()
  expect(editorBox!.x).toBeGreaterThanOrEqual(0)
  expect(editorBox!.x + editorBox!.width).toBeLessThanOrEqual(dimensions.viewport)
  expect(textareaBox!.x).toBeGreaterThanOrEqual(editorBox!.x)
  expect(textareaBox!.x + textareaBox!.width).toBeLessThanOrEqual(editorBox!.x + editorBox!.width)
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
}

for (const visualCase of [
  { title: '1366x768 dark', viewport: { width: 1366, height: 768 }, dark: true },
  { title: '820x760 light', viewport: { width: 820, height: 760 }, dark: false },
  { title: '390x844 light', viewport: { width: 390, height: 844 }, dark: false },
]) {
  test(`四種 Import modal visual QA：${visualCase.title}`, async ({ page }, testInfo) => {
    await page.setViewportSize(visualCase.viewport)

    for (const importer of importers) {
      await page.goto(importer.route)
      await page.evaluate((dark) => localStorage.setItem('isOpenDarkModeAtom', JSON.stringify(dark)), visualCase.dark)
      await page.reload()
      await page.getByRole('button', { name: importer.trigger }).click()
      await expectModalLayout(page)
      await page.screenshot({ path: testInfo.outputPath(`${importer.name}-${visualCase.viewport.width}-${visualCase.dark ? 'dark' : 'light'}.png`) })
      await expectRulesEditorLayout(page)
      await page.screenshot({ path: testInfo.outputPath(`${importer.name}-rules-editor-${visualCase.viewport.width}-${visualCase.dark ? 'dark' : 'light'}.png`) })
      await page.keyboard.press('Escape')
      await page.keyboard.press('Escape')
    }
  })
}
