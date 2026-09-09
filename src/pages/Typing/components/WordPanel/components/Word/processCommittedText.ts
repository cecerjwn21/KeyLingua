import type { WordState } from './type'
import type { LetterMistakes } from '@/utils/db/record'

export type ProcessCommittedTextOptions = {
  isPracticeMode: boolean
  isIgnoreCase: boolean
  explicitSpace: string
  timestamp: number
}

export type ProcessCommittedTextResult = {
  nextState: WordState
  correctCountDelta: number
  wrongDelta?: LetterMistakes
  didFinish: boolean
}

export function processCommittedText(
  wordState: WordState,
  committedText: string,
  options: ProcessCommittedTextOptions,
): ProcessCommittedTextResult {
  const nextState = structuredClone(wordState)
  let correctCountDelta = 0
  let wrongDelta: LetterMistakes | undefined
  let didFinish = false

  for (const committedChar of committedText.split('')) {
    if (nextState.hasWrong || nextState.isFinished) break

    const inputChar = !options.isPracticeMode && committedChar === ' ' ? options.explicitSpace : committedChar
    const currentIndex = nextState.inputWord.length
    const correctChar = nextState.displayWord[currentIndex]
    if (correctChar === undefined) break

    const isEqual = options.isIgnoreCase
      ? inputChar.toLowerCase() === correctChar.toLowerCase()
      : inputChar === correctChar

    if (isEqual) {
      nextState.inputWord += inputChar
      nextState.letterStates[currentIndex] = 'correct'
      nextState.correctCount += 1
      nextState.letterTimeArray.push(options.timestamp)
      correctCountDelta += 1

      if (nextState.inputWord.length >= nextState.displayWord.length) {
        nextState.isFinished = true
        didFinish = true
        break
      }
      continue
    }

    nextState.letterStates[currentIndex] = 'wrong'
    nextState.hasMadeInputWrong = true
    nextState.wrongCount += 1
    nextState.letterTimeArray = []

    if (nextState.letterMistake[currentIndex]) {
      nextState.letterMistake[currentIndex].push(committedChar)
    } else {
      nextState.letterMistake[currentIndex] = [committedChar]
    }
    wrongDelta = { [currentIndex]: [committedChar] }

    if (!options.isPracticeMode) {
      nextState.inputWord += inputChar
      nextState.hasWrong = true
    }
    break
  }

  return { nextState, correctCountDelta, wrongDelta, didFinish }
}
