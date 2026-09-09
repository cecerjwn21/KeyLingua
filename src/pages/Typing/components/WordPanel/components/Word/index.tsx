import type { WordUpdateAction } from '../InputHandler'
import InputHandler from '../InputHandler'
import Letter from './Letter'
import Notation from './Notation'
import { TipAlert } from './TipAlert'
import style from './index.module.css'
import { processCommittedText } from './processCommittedText'
import { initialWordState } from './type'
import type { WordState } from './type'
import Tooltip from '@/components/Tooltip'
import type { WordPronunciationIconRef } from '@/components/WordPronunciationIcon'
import { WordPronunciationIcon } from '@/components/WordPronunciationIcon'
import { EXPLICIT_SPACE } from '@/constants'
import useKeySounds from '@/hooks/useKeySounds'
import { TypingContext, TypingStateActionType } from '@/pages/Typing/store'
import { getPracticeTypingTarget } from '@/pages/Typing/utils/practiceTypingTarget'
import { isPracticeLetterVisible } from '@/pages/Typing/utils/practiceDictation'
import {
  currentChapterAtom,
  currentDictInfoAtom,
  currentTypingPracticeAtom,
  isIgnoreCaseAtom,
  isPracticeModeAtom,
  isShowAnswerOnHoverAtom,
  isTextSelectableAtom,
  pronunciationIsOpenAtom,
  wordDictationConfigAtom,
} from '@/store'
import type { Word } from '@/typings'
import type { ArticleSentencePresentation } from '@/typings'
import { CTRL, getUtcStringForMixpanel } from '@/utils'
import { useSaveWordRecord } from '@/utils/db'
import { useAtomValue } from 'jotai'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useImmer } from 'use-immer'

const vowelLetters = ['A', 'E', 'I', 'O', 'U']

const createInitialWordState = (word: Word, isPracticeMode: boolean): WordState => {
  let headword = ''
  try {
    headword = isPracticeMode ? getPracticeTypingTarget(word) : word.name.replace(new RegExp(' ', 'g'), EXPLICIT_SPACE)
    if (!isPracticeMode) {
      headword = headword.replace(new RegExp('…', 'g'), '..')
    }
  } catch (error) {
    console.error('word.name is not a string', word)
  }

  const newWordState = structuredClone(initialWordState)
  newWordState.displayWord = headword
  newWordState.letterStates = new Array(headword.length).fill('normal')
  newWordState.startTime = getUtcStringForMixpanel()
  newWordState.randomLetterVisible = headword.split('').map(() => Math.random() > 0.4)
  return newWordState
}

export default function WordComponent({
  word,
  onFinish,
  currentSentencePresentation,
  onPracticeInput,
}: {
  word: Word
  onFinish: () => void
  currentSentencePresentation?: ArticleSentencePresentation
  onPracticeInput?: () => void
}) {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state, dispatch } = useContext(TypingContext)!

  const wordDictationConfig = useAtomValue(wordDictationConfigAtom)
  const isTextSelectable = useAtomValue(isTextSelectableAtom)
  const isIgnoreCase = useAtomValue(isIgnoreCaseAtom)
  const isPracticeMode = useAtomValue(isPracticeModeAtom)
  const currentPractice = useAtomValue(currentTypingPracticeAtom)
  const effectiveIgnoreCase = currentPractice?.language === 'english' ? true : isIgnoreCase
  const isShowAnswerOnHover = useAtomValue(isShowAnswerOnHoverAtom)
  const saveWordRecord = useSaveWordRecord()
  const [wordState, setWordState] = useImmer<WordState>(createInitialWordState(word, isPracticeMode))
  // const wordLogUploader = useMixPanelWordLogUploader(state)
  const [playKeySound, playBeepSound, playHintSound] = useKeySounds()
  const pronunciationIsOpen = useAtomValue(pronunciationIsOpenAtom)
  const [isHoveringWord, setIsHoveringWord] = useState(false)
  const currentLanguage = useAtomValue(currentDictInfoAtom).language
  const currentLanguageCategory = useAtomValue(currentDictInfoAtom).languageCategory
  const currentChapter = useAtomValue(currentChapterAtom)

  const [showTipAlert, setShowTipAlert] = useState(false)
  const wordPronunciationIconRef = useRef<WordPronunciationIconRef>(null)
  const currentLetterRef = useRef<HTMLSpanElement>(null)

  const completeWord = useCallback(
    (finishedWordState: WordState) => {
      dispatch({ type: TypingStateActionType.SET_IS_SAVING_RECORD, payload: true })
      void saveWordRecord({
        word: word.name,
        wrongCount: finishedWordState.wrongCount,
        letterTimeArray: finishedWordState.letterTimeArray,
        letterMistake: finishedWordState.letterMistake,
      })
      onFinish()
    },
    [dispatch, onFinish, saveWordRecord, word.name],
  )

  const updateInput = useCallback(
    (updateAction: WordUpdateAction) => {
      switch (updateAction.type) {
        case 'add': {
          if (wordState.hasWrong || wordState.isFinished || updateAction.value.length === 0) return

          onPracticeInput?.()

          if (updateAction.value.includes(' ')) {
            updateAction.event.preventDefault()
          }

          const result = processCommittedText(wordState, updateAction.value, {
            isPracticeMode,
            isIgnoreCase: effectiveIgnoreCase,
            explicitSpace: EXPLICIT_SPACE,
            timestamp: Date.now(),
          })
          if (result.didFinish) {
            result.nextState.endTime = getUtcStringForMixpanel()
          }

          if (result.wrongDelta) {
            playBeepSound()
          } else if (result.didFinish) {
            playHintSound()
          } else if (result.correctCountDelta > 0) {
            playKeySound()
          }

          setWordState(result.nextState)

          for (let index = 0; index < result.correctCountDelta; index += 1) {
            dispatch({ type: TypingStateActionType.REPORT_CORRECT_WORD })
          }

          if (result.wrongDelta) {
            dispatch({ type: TypingStateActionType.REPORT_WRONG_WORD, payload: { letterMistake: result.wrongDelta } })

            if (!isPracticeMode && currentChapter === 0 && state.chapterData.index === 0 && result.nextState.wrongCount >= 4) {
              setShowTipAlert(true)
            }
          }
          if (result.didFinish) completeWord(result.nextState)
          break
        }

        default:
          console.warn('unknown update type', updateAction)
      }
    },
    [
      currentChapter,
      dispatch,
      effectiveIgnoreCase,
      isPracticeMode,
      onPracticeInput,
      playBeepSound,
      playHintSound,
      playKeySound,
      completeWord,
      setWordState,
      state.chapterData.index,
      wordState,
    ],
  )

  const handleHoverWord = useCallback((checked: boolean) => {
    setIsHoveringWord(checked)
  }, [])

  useHotkeys(
    'tab',
    () => {
      handleHoverWord(true)
    },
    { enableOnFormTags: true, preventDefault: true },
    [],
  )

  useHotkeys(
    'tab',
    () => {
      handleHoverWord(false)
    },
    { enableOnFormTags: true, keyup: true, preventDefault: true },
    [],
  )
  useHotkeys(
    'ctrl+j',
    () => {
      if (state.isTyping) {
        wordPronunciationIconRef.current?.play()
      }
    },
    [state.isTyping],
    { enableOnFormTags: true, preventDefault: true },
  )

  useEffect(() => {
    if (currentPractice?.kind === 'vocabulary') return
    if (wordState.inputWord.length === 0 && state.isTyping) {
      wordPronunciationIconRef.current?.play && wordPronunciationIconRef.current?.play()
    }
  }, [currentPractice?.kind, state.isTyping, wordState.inputWord.length, wordPronunciationIconRef.current?.play])

  const getLetterVisible = useCallback(
    (index: number) => {
      if (isPracticeMode) {
        return isPracticeLetterVisible({
          config: wordDictationConfig,
          letter: wordState.displayWord[index],
          letterState: wordState.letterStates[index],
          randomVisible: wordState.randomLetterVisible[index],
        })
      }
      if (wordState.letterStates[index] === 'correct' || (isShowAnswerOnHover && isHoveringWord)) return true

      if (wordDictationConfig.isOpen) {
        if (wordDictationConfig.type === 'hideAll') return false

        const letter = wordState.displayWord[index]
        if (wordDictationConfig.type === 'hideVowel') {
          return vowelLetters.includes(letter.toUpperCase()) ? false : true
        }
        if (wordDictationConfig.type === 'hideConsonant') {
          return vowelLetters.includes(letter.toUpperCase()) ? true : false
        }
        if (wordDictationConfig.type === 'randomHide') {
          return wordState.randomLetterVisible[index]
        }
      }
      return true
    },
    [
      isHoveringWord,
      isPracticeMode,
      isShowAnswerOnHover,
      wordDictationConfig,
      wordState.displayWord,
      wordState.letterStates,
      wordState.randomLetterVisible,
    ],
  )

  useEffect(() => {
    if (wordState.hasWrong) {
      const timer = setTimeout(() => {
        setWordState((state) => {
          state.inputWord = ''
          state.letterStates = new Array(state.letterStates.length).fill('normal')
          state.hasWrong = false
        })
      }, 300)

      return () => {
        clearTimeout(timer)
      }
    }
  }, [wordState.hasWrong, setWordState])

  useEffect(() => {
    if (wordState.wrongCount >= 4) {
      dispatch({ type: TypingStateActionType.SET_IS_SKIP, payload: true })
    }
  }, [wordState.wrongCount, dispatch])

  useEffect(() => {
    if (!isPracticeMode || !state.isTyping || wordState.isFinished) return

    const currentLetter = currentLetterRef.current
    if (!currentLetter) return

    const rect = currentLetter.getBoundingClientRect()
    const edgeThreshold = 96
    if (rect.top < edgeThreshold || rect.bottom > window.innerHeight - edgeThreshold) {
      currentLetter.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }, [isPracticeMode, state.isTyping, wordState.inputWord.length, wordState.isFinished])

  return (
    <>
      <InputHandler target={wordState.displayWord} updateInput={updateInput} />
      <div
        lang={currentPractice?.language === 'japanese' ? 'ja' : currentLanguageCategory !== 'code' ? currentLanguageCategory : 'en'}
        className="flex flex-col items-center justify-center pb-1 pt-4"
      >
        {!isPracticeMode && ['romaji', 'hapin'].includes(currentLanguage) && word.notation && <Notation notation={word.notation} />}
        <div
          className={`tooltip-info relative w-fit bg-transparent p-0 leading-normal shadow-none dark:bg-transparent ${
            wordDictationConfig.isOpen && !isPracticeMode ? 'tooltip' : ''
          } ${isPracticeMode ? 'max-w-[calc(100vw-6rem)]' : ''}`}
          data-tip="按 Tab 快捷键显示完整单词"
        >
          <div
            data-testid={isPracticeMode ? 'practice-romaji-typing-row' : undefined}
            onMouseEnter={() => handleHoverWord(true)}
            onMouseLeave={() => handleHoverWord(false)}
            className={`flex flex-wrap items-center justify-center break-all ${
              isPracticeMode ? 'w-full max-w-full justify-start whitespace-pre-wrap break-words' : 'max-w-[calc(100vw-2rem)]'
            } ${isTextSelectable && 'select-all'} ${wordState.hasWrong ? style.wrong : ''}`}
          >
            {wordState.displayWord.split('').map((t, index) => {
              if (
                isPracticeMode &&
                currentSentencePresentation &&
                (index < currentSentencePresentation.targetStart || index >= currentSentencePresentation.targetEnd)
              ) {
                return null
              }
              const visualGroup = currentSentencePresentation?.visualGroups?.find(({ start, end }) => index >= start && index < end)
              return (
                <span key={`${index}-${t}`} className={visualGroup && index === visualGroup.end - 1 && index < wordState.displayWord.length - 1 ? 'mr-2' : ''} data-testid={visualGroup && index === visualGroup.end - 1 ? 'practice-romaji-visual-group' : undefined}>
                  <Letter
                    letter={t}
                    visible={getLetterVisible(index)}
                    state={wordState.letterStates[index]}
                    responsive={isPracticeMode}
                    isCurrent={isPracticeMode && !wordState.isFinished && index === wordState.inputWord.length}
                    globalIndex={index}
                    ref={isPracticeMode && !wordState.isFinished && index === wordState.inputWord.length ? currentLetterRef : undefined}
                  />
                </span>
              )
            })}
          </div>
          {pronunciationIsOpen && currentPractice?.language !== 'english' && currentPractice?.kind !== 'vocabulary' && (
            <div className="absolute -right-12 top-1/2 h-9 w-9 -translate-y-1/2 transform ">
              <Tooltip content={`快捷键${CTRL} + J`} className={isPracticeMode ? style.practiceSoundTooltip : undefined}>
                <WordPronunciationIcon word={word} lang={currentLanguage} ref={wordPronunciationIconRef} className="h-full w-full" />
              </Tooltip>
            </div>
          )}
        </div>
      </div>
      {!isPracticeMode && <TipAlert className="fixed bottom-10 right-3" show={showTipAlert} setShow={setShowTipAlert} />}
    </>
  )
}
