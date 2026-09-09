import type { WordDictationType } from '@/typings'

type LetterState = 'normal' | 'correct' | 'wrong'

export type PracticeDictationConfig = {
  isOpen: boolean
  type: WordDictationType
}

export const isPracticeAnswerVisible = (config: PracticeDictationConfig) => !config.isOpen

export const isPracticeLetterVisible = ({
  config,
  letter,
  letterState,
  randomVisible,
}: {
  config: PracticeDictationConfig
  letter: string
  letterState: LetterState
  randomVisible: boolean
}) => {
  if (!config.isOpen || letterState === 'correct') return true
  if (config.type === 'hideAll') return false

  const isVowel = /^[aeiou]$/i.test(letter)
  if (config.type === 'hideVowel') return !isVowel
  if (config.type === 'hideConsonant') return isVowel || !/[a-z]/i.test(letter)
  return randomVisible
}
