import { expect, test } from '@playwright/test'

const existingEnglishLibrary = {
  version: 1,
  sets: [{ id: 'existing-travel', title: 'A2｜Travel', level: 'A2', createdAt: '2026-01-01' }],
  items: [
    {
      id: 'existing-check-in',
      setId: 'existing-travel',
      word: 'Check-in',
      meaning: '報到',
      source: 'manual',
    },
  ],
}

const candidate = {
  title: 'A2｜Airport',
  level: 'A2',
  items: [
    { word: 'CHECK-IN', meaning: '報到', source: 'manual' },
    { word: 'check in', meaning: '報到', source: 'manual' },
  ],
}

test.describe('Vocabulary import duplicate review', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((library) => {
      localStorage.setItem('englishVocabularyLibrary', JSON.stringify(library))
      localStorage.setItem('keylinguaUiLocale', JSON.stringify('zh-TW'))
    }, existingEnglishLibrary)
    await page.goto('/en/vocabulary')
    await page.getByRole('button', { name: '匯入' }).click()
    await page.getByLabel('單字題庫 JSON').fill(JSON.stringify(candidate))
    await page.getByRole('button', { name: '驗證題庫' }).click()
  })

  test('EXACT 預設阻止且 NEAR 顯示警告與人工決定', async ({ page }) => {
    const review = page.getByRole('region', { name: '重複內容檢查' })
    await expect(review.getByText('EXACT', { exact: true })).toBeVisible()
    await expect(review.getByText('NEAR', { exact: true })).toBeVisible()
    await expect(review.getByText('已存在於「A2｜Travel」・A2')).toHaveCount(2)
    await expect(review.getByRole('checkbox', { name: '仍要匯入此項' })).not.toBeChecked()

    await page.getByRole('button', { name: '確認匯入題庫' }).click()
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('englishVocabularyLibrary') ?? '{}'))
    expect(saved.sets.some(({ title }: { title: string }) => title === 'A2｜Airport')).toBe(false)
  })

  test('NEAR 只有勾選後才匯入，EXACT 仍保持阻止', async ({ page }) => {
    await page.getByRole('checkbox', { name: '仍要匯入此項' }).check()
    await page.getByRole('button', { name: '確認匯入題庫' }).click()
    const imported = await page.evaluate(() => {
      const library = JSON.parse(localStorage.getItem('englishVocabularyLibrary') ?? '{}')
      const set = library.sets.find(({ title }: { title: string }) => title === 'A2｜Airport')
      return set ? library.items.filter(({ setId }: { setId: string }) => setId === set.id) : []
    })
    expect(imported).toHaveLength(1)
    expect(imported[0].word).toBe('check in')
  })
})
