import { expect, test } from '@playwright/test'
import { japanesePracticeDocument } from '../../src/resources/practiceDocuments'

test('PWA manifest exposes the KeyLingua standalone install contract', async ({ request }) => {
  const response = await request.get('/manifest.json')
  expect(response.ok()).toBeTruthy()

  const manifest = await response.json()
  expect(manifest).toMatchObject({
    name: 'KeyLingua',
    short_name: 'KeyLingua',
    start_url: '/',
    display: 'standalone',
    theme_color: '#818CF8',
    background_color: '#ffffff',
  })
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }),
      expect.objectContaining({ src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }),
    ]),
  )
})

test('typing settings expose the browser-provided speech voice diagnostics', async ({ page }) => {
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
    class TestSpeechSynthesisUtterance {
      lang = ''
      voice: SpeechSynthesisVoice | null = null
      rate = 1
      private listeners = new Map<string, Set<() => void>>()

      constructor(public text: string) {}

      addEventListener(type: string, listener: () => void) {
        const listeners = this.listeners.get(type) ?? new Set()
        listeners.add(listener)
        this.listeners.set(type, listeners)
      }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: TestSpeechSynthesisUtterance,
    })
  })

  await page.goto('/')
  await page.evaluate((document) => {
    localStorage.setItem('practiceDocumentId', JSON.stringify(document.id))
    localStorage.setItem('pastedPracticeDocuments', JSON.stringify([document]))
  }, japanesePracticeDocument)
  await page.goto('/typing')
  await expect(page.getByTestId('practice-header-title')).toHaveText(japanesePracticeDocument.title)
  await expect(page.getByRole('button', { name: '語音診斷' })).toHaveCount(0)
  await page.getByRole('button', { name: '練習設定' }).click()
  const advanced = page.getByRole('group', { name: '進階' })
  await expect(advanced.getByTestId('speech-voice-diagnostics')).toBeHidden()
  await advanced.getByText('進階', { exact: true }).click()
  const diagnostics = advanced.getByTestId('speech-voice-diagnostics')
  await expect(diagnostics).toContainText('Microsoft Nanami Online (Natural) - Japanese (Japan)')
  await expect(diagnostics).toContainText('Microsoft Keita Online (Natural) - Japanese (Japan)')
  await expect(diagnostics).toContainText('nanami-cloud')
  await expect(diagnostics).toContainText('ja-JP')
})
