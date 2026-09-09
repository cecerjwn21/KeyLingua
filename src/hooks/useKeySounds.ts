import { KEY_SOUND_URL_PREFIX, SOUND_URL_PREFIX, keySoundResources } from '@/resources/soundResource'
import { hintSoundsConfigAtom, keySoundsConfigAtom } from '@/store'
import noop from '@/utils/noop'
import { useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect, useRef } from 'react'
import useSound from 'use-sound'

export type PlayFunction = ReturnType<typeof useSound>[0]

type KeySoundAudioGraph = {
  context: AudioContext
  gain: GainNode
  compressor: DynamicsCompressorNode
}

export const KEY_SOUND_PRE_GAIN = 3

export const KEY_SOUND_COMPRESSOR_SETTINGS = {
  threshold: -0.5,
  knee: 0,
  ratio: 20,
  attack: 0.001,
  release: 0.05,
} as const

export function getKeySoundGain(volume: number) {
  const persistedVolume = Number.isFinite(volume) ? Math.min(Math.max(volume, 0), 1.5) : 1
  const userGain = persistedVolume <= 1 ? persistedVolume : 1 + (persistedVolume - 1) * 2
  return userGain * KEY_SOUND_PRE_GAIN
}

function useAmplifiedKeySound(src: string) {
  const graphRef = useRef<KeySoundAudioGraph | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const pendingGainRef = useRef<number | null>(null)
  const playRef = useRef<(gainValue: number) => void>(() => undefined)

  useEffect(() => {
    if (typeof AudioContext === 'undefined') return

    let disposed = false
    const context = new AudioContext()
    const gain = context.createGain()
    const compressor = context.createDynamicsCompressor()
    gain.connect(compressor)
    compressor.connect(context.destination)
    compressor.threshold.setValueAtTime(KEY_SOUND_COMPRESSOR_SETTINGS.threshold, context.currentTime)
    compressor.knee.setValueAtTime(KEY_SOUND_COMPRESSOR_SETTINGS.knee, context.currentTime)
    compressor.ratio.setValueAtTime(KEY_SOUND_COMPRESSOR_SETTINGS.ratio, context.currentTime)
    compressor.attack.setValueAtTime(KEY_SOUND_COMPRESSOR_SETTINGS.attack, context.currentTime)
    compressor.release.setValueAtTime(KEY_SOUND_COMPRESSOR_SETTINGS.release, context.currentTime)
    graphRef.current = { context, gain, compressor }

    const play = (gainValue: number) => {
      const graph = graphRef.current
      const buffer = bufferRef.current
      if (!graph || !buffer) {
        pendingGainRef.current = gainValue
        return
      }

      try {
        sourceRef.current?.stop()
        const source = graph.context.createBufferSource()
        source.buffer = buffer
        source.connect(graph.gain)
        graph.gain.gain.setValueAtTime(gainValue, graph.context.currentTime)
        source.addEventListener(
          'ended',
          () => {
            source.disconnect()
            if (sourceRef.current === source) sourceRef.current = null
          },
          { once: true },
        )
        sourceRef.current = source
        if (graph.context.state === 'suspended') void graph.context.resume()
        source.start()
      } catch {
        sourceRef.current = null
      }
    }
    playRef.current = play

    void fetch(src)
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to preload key sound: ${response.status}`)
        return response.arrayBuffer()
      })
      .then((arrayBuffer) => context.decodeAudioData(arrayBuffer))
      .then((buffer) => {
        if (disposed) return
        bufferRef.current = buffer
        const pendingGain = pendingGainRef.current
        pendingGainRef.current = null
        if (pendingGain !== null) play(pendingGain)
      })
      .catch(() => {
        bufferRef.current = null
        pendingGainRef.current = null
      })

    return () => {
      disposed = true
      sourceRef.current?.stop()
      sourceRef.current = null
      bufferRef.current = null
      pendingGainRef.current = null
      playRef.current = () => undefined
      graphRef.current = null
      gain.disconnect()
      compressor.disconnect()
      void context.close()
    }
  }, [src])

  return useCallback((gainValue: number) => playRef.current(gainValue), [])
}

export default function useKeySound(): [PlayFunction, PlayFunction, PlayFunction] {
  const { isOpen: isKeyOpen, isOpenClickSound, volume: keyVolume, resource: keyResource } = useAtomValue(keySoundsConfigAtom)
  const setKeySoundsConfig = useSetAtom(keySoundsConfigAtom)
  const {
    isOpen: isHintOpen,
    isOpenWrongSound,
    isOpenCorrectSound,
    volume: hintVolume,
    wrongResource,
    correctResource,
  } = useAtomValue(hintSoundsConfigAtom)
  const keySoundUrl = `${KEY_SOUND_URL_PREFIX}${keyResource.filename}`
  const playAmplifiedKeySound = useAmplifiedKeySound(keySoundUrl)
  const keySoundGain = getKeySoundGain(keyVolume)

  useEffect(() => {
    if (!keySoundResources.some((item) => item.filename === keyResource.filename && item.key === keyResource.key)) {
      const defaultKeySoundResource = keySoundResources.find((item) => item.key === 'Default') || keySoundResources[0]

      setKeySoundsConfig((prev) => ({ ...prev, resource: defaultKeySoundResource }))
    }
  }, [keyResource, setKeySoundsConfig])

  const [playWrongSound] = useSound(`${SOUND_URL_PREFIX}${wrongResource.filename}`, {
    volume: hintVolume,
    interrupt: true,
    preload: true,
  })
  const [playCorrectSound] = useSound(`${SOUND_URL_PREFIX}${correctResource.filename}`, {
    volume: hintVolume,
    interrupt: true,
    preload: true,
  })

  const playClickSound = useCallback<PlayFunction>(
    () => playAmplifiedKeySound(keySoundGain),
    [keySoundGain, playAmplifiedKeySound],
  )

  return [
    isKeyOpen && isOpenClickSound ? playClickSound : noop,
    isHintOpen && isOpenWrongSound ? playWrongSound : noop,
    isHintOpen && isOpenCorrectSound ? playCorrectSound : noop,
  ]
}
