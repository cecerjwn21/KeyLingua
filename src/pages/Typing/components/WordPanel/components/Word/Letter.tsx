import { EXPLICIT_SPACE } from '@/constants'
import { fontSizeConfigAtom } from '@/store'
import { useAtomValue } from 'jotai'
import React from 'react'

export type LetterState = 'normal' | 'correct' | 'wrong'

const stateClassNameMap: Record<string, Record<LetterState, string>> = {
  true: {
    normal: 'text-gray-400',
    correct: 'text-green-400 dark:text-green-700',
    wrong: 'text-red-400 dark:text-red-600',
  },
  false: {
    normal: 'text-gray-600 dark:text-gray-50',
    correct: 'text-green-600 dark:text-green-400',
    wrong: 'text-red-600 dark:text-red-400',
  },
}

export type LetterProps = {
  letter: string
  state?: LetterState
  visible?: boolean
  responsive?: boolean
  isCurrent?: boolean
  globalIndex?: number
}

const Letter = React.forwardRef<HTMLSpanElement, LetterProps>(
  ({ letter, state = 'normal', visible = true, responsive = false, isCurrent = false, globalIndex }, ref) => {
  const fontSizeConfig = useAtomValue(fontSizeConfigAtom)
  const fontSize = responsive ? `clamp(1.75rem, 3.25vw, ${fontSizeConfig.foreignFont}px)` : `${fontSizeConfig.foreignFont}px`
  return (
    <span
      ref={ref}
      data-testid={responsive ? 'practice-editable-letter' : undefined}
      data-current-letter={isCurrent || undefined}
      data-global-letter-index={responsive ? globalIndex : undefined}
      className={`m-0 p-0 font-mono font-normal ${
        stateClassNameMap[(letter === EXPLICIT_SPACE) as unknown as string][state]
      } ${isCurrent ? 'rounded-sm underline decoration-indigo-400 decoration-2 underline-offset-4' : ''} whitespace-pre pr-0.8 duration-0 dark:text-opacity-80`}
      style={{ fontSize }}
    >
      {visible ? letter : '_'}
    </span>
    )
  },
)

export default React.memo(Letter)
