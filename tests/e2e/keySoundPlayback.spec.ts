import { japanesePracticeDocument } from '../../src/resources/practiceDocuments'
import { expect, test } from '@playwright/test'

type KeyAudioTrace = {
  nodes: Record<string, string>
  edges: Array<{ from: string; to: string }>
  starts: string[]
  gainEvents: Array<{ node: string; value: number }>
  compressors: Array<{
    node: string
    settings: { threshold: number; knee: number; ratio: number; attack: number; release: number }
  }>
  htmlPlayCount: number
  clonedAudioCount: number
}

const installKeyAudioTrace = async (page: import('@playwright/test').Page, keySoundFetchDelay = 0) => {
  await page.addInitScript(
    ({ keySoundFetchDelay }) => {
      const trace: KeyAudioTrace = {
        nodes: {},
        edges: [],
        starts: [],
        gainEvents: [],
        compressors: [],
        htmlPlayCount: 0,
        clonedAudioCount: 0,
      }
      const ids = new WeakMap<object, string>()
      let nextId = 1
      const getNodeId = (node: object) => {
        const existing = ids.get(node)
        if (existing) return existing
        const nodeId = `audio-node-${nextId++}`
        ids.set(node, nodeId)
        trace.nodes[nodeId] = node.constructor.name
        return nodeId
      }

      const originalConnect = AudioNode.prototype.connect
      AudioNode.prototype.connect = function (destinationNode: AudioNode, ...args: number[]) {
        trace.edges.push({ from: getNodeId(this), to: getNodeId(destinationNode) })
        return Reflect.apply(originalConnect, this, [destinationNode, ...args])
      } as typeof AudioNode.prototype.connect

      const originalCreateGain = BaseAudioContext.prototype.createGain
      BaseAudioContext.prototype.createGain = function () {
        const node = originalCreateGain.call(this)
        const nodeId = getNodeId(node)
        const originalSetValueAtTime = node.gain.setValueAtTime.bind(node.gain)
        node.gain.setValueAtTime = (value, startTime) => {
          trace.gainEvents.push({ node: nodeId, value })
          return originalSetValueAtTime(value, startTime)
        }
        return node
      }

      const originalCreateCompressor = BaseAudioContext.prototype.createDynamicsCompressor
      BaseAudioContext.prototype.createDynamicsCompressor = function () {
        const node = originalCreateCompressor.call(this)
        const settings = {
          threshold: node.threshold.value,
          knee: node.knee.value,
          ratio: node.ratio.value,
          attack: node.attack.value,
          release: node.release.value,
        }
        trace.compressors.push({ node: getNodeId(node), settings })
        for (const key of ['threshold', 'knee', 'ratio', 'attack', 'release'] as const) {
          const param = node[key]
          const originalSetValueAtTime = param.setValueAtTime.bind(param)
          param.setValueAtTime = (value, startTime) => {
            settings[key] = value
            return originalSetValueAtTime(value, startTime)
          }
        }
        return node
      }

      const originalCreateBufferSource = BaseAudioContext.prototype.createBufferSource
      BaseAudioContext.prototype.createBufferSource = function () {
        const node = originalCreateBufferSource.call(this)
        const nodeId = getNodeId(node)
        const originalStart = node.start.bind(node)
        node.start = (...args) => {
          trace.starts.push(nodeId)
          return originalStart(...args)
        }
        return node
      }

      const originalPlay = HTMLMediaElement.prototype.play
      HTMLMediaElement.prototype.play = function () {
        trace.htmlPlayCount += 1
        return originalPlay.call(this)
      }
      const originalCloneNode = Node.prototype.cloneNode
      Node.prototype.cloneNode = function (deep) {
        if (this instanceof HTMLMediaElement) trace.clonedAudioCount += 1
        return originalCloneNode.call(this, deep)
      }

      if (keySoundFetchDelay > 0) {
        const originalFetch = window.fetch.bind(window)
        window.fetch = async (...args) => {
          const input = args[0]
          const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
          if (url.includes('/key-sound/')) {
            await new Promise((resolve) => setTimeout(resolve, keySoundFetchDelay))
          }
          return originalFetch(...args)
        }
      }

      Object.defineProperty(window, '__keyAudioTrace', { configurable: true, value: trace })
    },
    { keySoundFetchDelay },
  )
}

const openJapanesePractice = async (page: import('@playwright/test').Page) => {
  await page.goto('/')
  await page.evaluate((document) => {
    localStorage.setItem('practiceDocumentId', JSON.stringify(document.id))
    localStorage.setItem('pastedPracticeDocuments', JSON.stringify([document]))
    localStorage.removeItem('keySoundsConfig')
    localStorage.removeItem('hintSoundsConfig')
  }, japanesePracticeDocument)
  await page.goto('/typing')
  await expect(page.getByTestId('practice-header-title')).toHaveText(japanesePracticeDocument.title)
}

const readTrace = (page: import('@playwright/test').Page) =>
  page.evaluate(() => structuredClone((window as Window & { __keyAudioTrace: KeyAudioTrace }).__keyAudioTrace))

const clearPlaybackTrace = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const trace = (window as Window & { __keyAudioTrace: KeyAudioTrace }).__keyAudioTrace
    trace.starts.length = 0
    trace.gainEvents.length = 0
    trace.htmlPlayCount = 0
    trace.clonedAudioCount = 0
  })

const sourcePathsThroughCompressor = (trace: KeyAudioTrace) => {
  const outgoing = new Map<string, string[]>()
  for (const edge of trace.edges) outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge.to])
  const reachesCompressor = (start: string) => {
    const pending = [start]
    const visited = new Set<string>()
    while (pending.length > 0) {
      const node = pending.pop()!
      if (visited.has(node)) continue
      visited.add(node)
      if (trace.nodes[node] === 'DynamicsCompressorNode') return true
      pending.push(...(outgoing.get(node) ?? []))
    }
    return false
  }
  return trace.starts.filter(reachesCompressor)
}

test('an immediate real key playback waits for and uses the gain-compressor chain without a direct fallback', async ({ page }) => {
  await installKeyAudioTrace(page, 750)
  await openJapanesePractice(page)
  await page.getByRole('button', { name: '繼續' }).click()
  await clearPlaybackTrace(page)
  await page.keyboard.press('k')

  await expect.poll(async () => (await readTrace(page)).starts.length).toBeGreaterThan(0)
  const trace = await readTrace(page)
  const persistedVolume = await page.evaluate(() => JSON.parse(localStorage.getItem('keySoundsConfig') ?? 'null')?.volume)
  expect(persistedVolume ?? 1).toBe(1)
  expect(sourcePathsThroughCompressor(trace)).toHaveLength(trace.starts.length)
  expect(trace.gainEvents.map((event) => event.value)).toContain(3)
  expect(trace.htmlPlayCount).toBe(0)
  expect(trace.clonedAudioCount).toBe(0)
})

test('the Settings preview plays 50%, 100%, and 150% through measured key-only gain and preserves persistence', async ({ page }) => {
  await installKeyAudioTrace(page)
  await page.addInitScript(() => {
    let speechCount = 0
    Object.defineProperty(window, '__keySoundSpeechCount', { configurable: true, get: () => speechCount })
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => [],
        speak: () => {
          speechCount += 1
        },
        cancel: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      },
    })
  })
  await openJapanesePractice(page)
  await expect(page.getByRole('button', { name: '測試打字音效' })).toHaveCount(0)
  await page.getByRole('button', { name: '音效' }).click()
  const preview = page.getByRole('button', { name: '測試打字音效' })
  await expect(preview).toBeVisible()
  await page.getByLabel('效果音音量').fill('37')
  await page.waitForTimeout(200)

  for (const [percent, expectedGain] of [
    ['50', 1.5],
    ['100', 3],
    ['150', 6],
  ] as const) {
    await page.getByLabel('按鍵音音量').fill(percent)
    await clearPlaybackTrace(page)
    await preview.click()
    await expect.poll(async () => (await readTrace(page)).starts.length).toBe(1)
    const trace = await readTrace(page)
    expect(sourcePathsThroughCompressor(trace)).toHaveLength(1)
    expect(trace.gainEvents.map((event) => event.value)).toContain(expectedGain)
    expect(trace.htmlPlayCount).toBe(0)
  }

  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('keySoundsConfig') ?? 'null')?.volume)).toBe(1.5)
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('hintSoundsConfig') ?? 'null')?.volume)).toBe(0.37)
  expect(await page.evaluate(() => (window as Window & { __keySoundSpeechCount: number }).__keySoundSpeechCount)).toBe(0)
})

test('the real Default.wav keeps measurable loudness separation through the configured compressor', async ({ page }) => {
  await installKeyAudioTrace(page)
  await openJapanesePractice(page)
  await page.getByRole('button', { name: '音效' }).click()
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: '測試打字音效' }).click()
  const trace = await readTrace(page)
  const settings = trace.compressors[0]?.settings
  expect(settings).toEqual({ threshold: -0.5, knee: 0, ratio: 20, attack: 0.001, release: 0.05 })

  const rendered = await page.evaluate(async ({ settings }) => {
    const response = await fetch('/sounds/key-sound/Default.wav')
    const decodingContext = new AudioContext()
    const buffer = await decodingContext.decodeAudioData(await response.arrayBuffer())
    await decodingContext.close()
    const render = async (gainValue: number) => {
      const context = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
      const source = context.createBufferSource()
      const gain = context.createGain()
      const compressor = context.createDynamicsCompressor()
      source.buffer = buffer
      gain.gain.value = gainValue
      compressor.threshold.value = settings.threshold
      compressor.knee.value = settings.knee
      compressor.ratio.value = settings.ratio
      compressor.attack.value = settings.attack
      compressor.release.value = settings.release
      source.connect(gain)
      gain.connect(compressor)
      compressor.connect(context.destination)
      source.start()
      const output = await context.startRendering()
      let sumSquares = 0
      let peak = 0
      let sampleCount = 0
      for (let channel = 0; channel < output.numberOfChannels; channel += 1) {
        for (const sample of output.getChannelData(channel)) {
          sumSquares += sample * sample
          peak = Math.max(peak, Math.abs(sample))
          sampleCount += 1
        }
      }
      const rms = Math.sqrt(sumSquares / sampleCount)
      return { rms, rmsDb: 20 * Math.log10(rms), peak }
    }
    return { at50: await render(1.5), at100: await render(3), at150: await render(6) }
  }, { settings })

  expect(rendered.at100.rmsDb - rendered.at50.rmsDb).toBeGreaterThan(4.5)
  expect(rendered.at150.rmsDb - rendered.at100.rmsDb).toBeGreaterThan(3.5)
  expect(rendered.at150.peak).toBeLessThanOrEqual(1)
})
