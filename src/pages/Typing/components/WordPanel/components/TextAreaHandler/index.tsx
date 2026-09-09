import type { WordUpdateAction } from '../InputHandler'
import { TypingContext } from '@/pages/Typing/store'
import type { FormEvent, CompositionEvent as ReactCompositionEvent } from 'react'
import { useCallback, useContext, useEffect, useRef } from 'react'

export default function TextAreaHandler({ updateInput }: { updateInput: (updateObj: WordUpdateAction) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const compositionActiveRef = useRef(false)
  const pendingCompositionInputRef = useRef<string | null>(null)
  const pendingCompositionInputTimerRef = useRef<number | null>(null)
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state } = useContext(TypingContext)!

  const focusTextarea = useCallback(() => {
    textareaRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (!textareaRef.current) return

    if (state.isTyping) {
      focusTextarea()
    } else {
      textareaRef.current.blur()
    }
  }, [focusTextarea, state.isTyping])

  useEffect(() => {
    if (!state.isTyping) return

    const restoreFocusWhenInteractionEnds = () => {
      window.requestAnimationFrame(() => {
        const hasOpenInteractivePanel = document.querySelector('[data-headlessui-state~="open"]') !== null
        if (!hasOpenInteractivePanel && (document.activeElement === document.body || document.activeElement === null)) {
          focusTextarea()
        }
      })
    }

    document.addEventListener('focusout', restoreFocusWhenInteractionEnds)
    return () => document.removeEventListener('focusout', restoreFocusWhenInteractionEnds)
  }, [focusTextarea, state.isTyping])

  useEffect(() => {
    return () => {
      if (pendingCompositionInputTimerRef.current !== null) {
        window.clearTimeout(pendingCompositionInputTimerRef.current)
      }
    }
  }, [])

  const clearPendingCompositionInput = () => {
    pendingCompositionInputRef.current = null
    if (pendingCompositionInputTimerRef.current !== null) {
      window.clearTimeout(pendingCompositionInputTimerRef.current)
      pendingCompositionInputTimerRef.current = null
    }
  }

  const clearTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.value = ''
    }
  }

  const commitText = (value: string | null, event: FormEvent<HTMLTextAreaElement>) => {
    if (value !== null && value.length > 0) {
      updateInput({ type: 'add', value, event })
    }
    clearTextarea()
  }

  const onInput = (e: FormEvent<HTMLTextAreaElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent
    if (compositionActiveRef.current || nativeEvent.isComposing) return

    const pendingCompositionInput = pendingCompositionInputRef.current
    clearPendingCompositionInput()
    if (pendingCompositionInput !== null && nativeEvent.data === pendingCompositionInput) {
      clearTextarea()
      return
    }

    commitText(nativeEvent.data, e)
  }

  const onCompositionStart = () => {
    compositionActiveRef.current = true
    clearPendingCompositionInput()
  }

  const onCompositionEnd = (e: ReactCompositionEvent<HTMLTextAreaElement>) => {
    compositionActiveRef.current = false
    clearPendingCompositionInput()
    pendingCompositionInputRef.current = e.data.length > 0 ? e.data : null
    if (pendingCompositionInputRef.current !== null) {
      pendingCompositionInputTimerRef.current = window.setTimeout(() => {
        pendingCompositionInputRef.current = null
        pendingCompositionInputTimerRef.current = null
      }, 0)
    }
    commitText(e.data, e)
  }

  return (
    <textarea
      aria-label="Typing input"
      className="fixed bottom-0 left-1/2 m-0 h-px w-px appearance-none overflow-hidden border-0 p-0 opacity-0 focus:outline-none"
      ref={textareaRef}
      autoFocus
      spellCheck="false"
      onInput={onInput}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
    ></textarea>
  )
}
