import { resolveJapaneseVoice } from '@/utils/japaneseVoices'
import { resolveEnglishVoice } from '@/utils/englishVoices'
import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechOptions = Partial<SpeechSynthesisUtterance> & { voiceURI?: string }

export type UseSpeechResult = {
  /**
   * Speak speaking
   * @param {boolean} [abort=false] Whether to cancel other speak
   */
  speak: (abort?: boolean) => Promise<boolean>
  /**
   * Cancel speaking
   */
  cancel: () => void
  /**
   * Whether currently speaking
   */
  speaking: boolean
}

/**
 * React hook for using the SpeechSynthesis API.
 * @param {string} text The text to be spoken.
 * @param {Partial<SpeechSynthesisUtterance>} option SpeechSynthesisUtterance API option. {@link https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance#instance_properties}
 * @returns {Object} An object containing `speak`, `cancel` methods and `speaking` state.
 * @throws {Error} If browser not support SpeechSynthesis API.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API}
 */
export default function useSpeech(text: string, option?: SpeechOptions): UseSpeechResult {
  const [speaking, setSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const textRef = useRef(text)
  const optionRef = useRef(option)
  const requestIdRef = useRef(0)
  const pendingTimerRef = useRef<number>()
  const pendingResolveRef = useRef<((enqueued: boolean) => void) | null>(null)
  textRef.current = text
  optionRef.current = option

  const clearPendingSpeak = useCallback(() => {
    if (pendingTimerRef.current !== undefined) {
      window.clearTimeout(pendingTimerRef.current)
      pendingTimerRef.current = undefined
    }
    pendingResolveRef.current?.(false)
    pendingResolveRef.current = null
  }, [])

  const speak = useCallback(
    (abort = false) => {
      const synth = window.speechSynthesis
      if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
        console.error('SpeechSynthesis API is not supported in this browser')
        return Promise.resolve(false)
      }

      const requestId = ++requestIdRef.current
      const requestedText = textRef.current
      const requestedOption = optionRef.current
      clearPendingSpeak()
      if (abort) synth.cancel()

      return new Promise<boolean>((resolve) => {
        pendingResolveRef.current = resolve
        pendingTimerRef.current = window.setTimeout(() => {
          pendingTimerRef.current = undefined
          pendingResolveRef.current = null
          if (requestId !== requestIdRef.current) {
            resolve(false)
            return
          }

          const utterance = new SpeechSynthesisUtterance(requestedText)
          const { voiceURI, ...utteranceOptions } = requestedOption ?? {}
          Object.assign(utterance, utteranceOptions)
          if (utterance.lang) {
            const language = utterance.lang.toLocaleLowerCase()
            const voices = synth.getVoices()
            const matchingVoice = language.startsWith('ja')
              ? resolveJapaneseVoice(voices, voiceURI)
              : language.startsWith('en')
              ? resolveEnglishVoice(voices, voiceURI)
              : voices.find((voice) => voice.lang.toLocaleLowerCase() === language)
            if (matchingVoice) utterance.voice = matchingVoice
          }

          const finishLatestRequest = () => {
            if (requestId !== requestIdRef.current) return
            utteranceRef.current = null
            setSpeaking(false)
          }
          utterance.addEventListener('end', finishLatestRequest)
          utterance.addEventListener('error', finishLatestRequest)
          utteranceRef.current = utterance

          try {
            synth.speak(utterance)
            setSpeaking(true)
            resolve(true)
          } catch {
            finishLatestRequest()
            resolve(false)
          }
        }, 0)
      })
    },
    [clearPendingSpeak],
  )

  const cancel = useCallback(() => {
    requestIdRef.current += 1
    clearPendingSpeak()
    const synth = window.speechSynthesis
    synth?.cancel()
    utteranceRef.current = null
    setSpeaking(false)
  }, [clearPendingSpeak])

  useEffect(() => () => cancel(), [cancel, text])

  return {
    speak,
    cancel,
    speaking,
  }
}
