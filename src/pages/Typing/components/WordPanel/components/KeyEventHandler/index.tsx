import type { WordUpdateAction } from '../InputHandler'
import { getPhysicalAsciiCharacter } from './physicalAscii'
import { TypingContext } from '@/pages/Typing/store'
import { isChineseSymbol, isLegal } from '@/utils'
import { useCallback, useContext, useEffect } from 'react'

type KeyEventInputMode = 'logical' | 'physical-ascii'

export default function KeyEventHandler({
  updateInput,
  inputMode = 'logical',
}: {
  updateInput: (updateObj: WordUpdateAction) => void
  inputMode?: KeyEventInputMode
}) {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state } = useContext(TypingContext)!

  const onKeydown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'SELECT' || target.isContentEditable || (target.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')))
      ) {
        return
      }

      if (inputMode === 'physical-ascii') {
        if (e.defaultPrevented) return
        const physicalChar = getPhysicalAsciiCharacter(e)
        if (physicalChar !== null) {
          e.preventDefault()
          updateInput({ type: 'add', value: physicalChar, event: e })
        }
        return
      }

      const char = e.key

      if (isChineseSymbol(char)) {
        alert('您正在使用输入法，请关闭输入法。')
        return
      }

      if (isLegal(char) && !e.altKey && !e.ctrlKey && !e.metaKey) {
        updateInput({ type: 'add', value: char, event: e })
      }
    },
    [inputMode, updateInput],
  )

  useEffect(() => {
    if (!state.isTyping) return

    window.addEventListener('keydown', onKeydown)
    return () => {
      window.removeEventListener('keydown', onKeydown)
    }
  }, [onKeydown, state.isTyping])

  return <></>
}
