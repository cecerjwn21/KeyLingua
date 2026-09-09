import { TypingContext, TypingStateActionType } from '../../store'
import type { TypingState } from '../../store/type'
import PrevAndNextWord from '../PrevAndNextWord'
import Progress from '../Progress'
import Phonetic from './components/Phonetic'
import Translation from './components/Translation'
import WordComponent from './components/Word'
import PracticeNotation from './components/Word/PracticeNotation'
import ProductIcon from '@/components/ProductIcon'
import { usePrefetchPronunciationSound } from '@/hooks/usePronunciation'
import useSpeech from '@/hooks/useSpeech'
import { createEnglishDialogueTypingSession } from '@/pages/English/utils/englishPractice'
import { createArticleTypingSession } from '@/pages/Typing/utils/practiceArticle'
import { isPracticeAnswerVisible } from '@/pages/Typing/utils/practiceDictation'
import { getVocabularySpeechText } from '@/pages/Vocabulary/utils/vocabulary'
import {
  articleSpeechConfigAtom,
  currentTypingPracticeAtom,
  englishSpeechConfigAtom,
  isPracticeModeAtom,
  isReviewModeAtom,
  isShowPrevAndNextWordAtom,
  loopWordConfigAtom,
  phoneticConfigAtom,
  reviewModeInfoAtom,
  wordDictationConfigAtom,
} from '@/store'
import type { Word } from '@/typings'
import { useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { EyeOff, Volume2 } from 'lucide'

export default function WordPanel() {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state, dispatch } = useContext(TypingContext)!
  const phoneticConfig = useAtomValue(phoneticConfigAtom)
  const wordDictationConfig = useAtomValue(wordDictationConfigAtom)
  const isPracticeMode = useAtomValue(isPracticeModeAtom)
  const currentPractice = useAtomValue(currentTypingPracticeAtom)
  const currentPracticeDocument = currentPractice?.language === 'japanese' && currentPractice.kind === 'article' ? currentPractice.document : undefined
  const currentEnglishDialogue = currentPractice?.language === 'english' && currentPractice.kind === 'dialogue' ? currentPractice.document : undefined
  const articleSpeechConfig = useAtomValue(articleSpeechConfigAtom)
  const englishSpeechConfig = useAtomValue(englishSpeechConfigAtom)
  const speechConfig = currentPractice?.language === 'english' ? englishSpeechConfig : articleSpeechConfig
  const isDictationActive = isPracticeMode && !isPracticeAnswerVisible(wordDictationConfig)
  const isShowPrevAndNextWord = useAtomValue(isShowPrevAndNextWordAtom)
  const [wordComponentKey, setWordComponentKey] = useState(0)
  const [currentWordExerciseCount, setCurrentWordExerciseCount] = useState(0)
  const { times: loopWordTimes } = useAtomValue(loopWordConfigAtom)
  const currentWord = state.chapterData.words[state.chapterData.index]
  const currentJapaneseVocabularyItem =
    currentPractice?.language === 'japanese' && currentPractice.kind === 'vocabulary'
      ? currentPractice.items[state.chapterData.index]
      : undefined
  const currentEnglishVocabularyItem =
    currentPractice?.language === 'english' && currentPractice.kind === 'vocabulary'
      ? currentPractice.items[state.chapterData.index]
      : undefined
  const currentVocabularyItem = currentEnglishVocabularyItem ?? currentJapaneseVocabularyItem
  const nextWord = state.chapterData.words[state.chapterData.index + 1] as Word | undefined
  const continuousPracticeSession = useMemo(
    () =>
      currentPracticeDocument
        ? createArticleTypingSession(currentPracticeDocument)
        : currentEnglishDialogue
        ? createEnglishDialogueTypingSession(currentEnglishDialogue)
        : undefined,
    [currentEnglishDialogue, currentPracticeDocument],
  )
  const [isFullArticleVisible, setIsFullArticleVisible] = useState(false)
  const currentInputIndex = state.chapterData.correctCount
  const activeArticleSentenceIndex = useMemo(() => {
    const presentations = continuousPracticeSession?.sentencePresentations ?? []
    if (presentations.length === 0) return 0
    return (
      presentations.findIndex(({ targetStart, targetEnd }) => currentInputIndex >= targetStart && currentInputIndex < targetEnd) ??
      presentations.length - 1
    )
  }, [continuousPracticeSession, currentInputIndex])
  const [articleNavigationSentenceIndex, setArticleNavigationSentenceIndex] = useState(0)
  const resolvedCurrentSentenceIndex = currentPracticeDocument
    ? activeArticleSentenceIndex === -1
      ? Math.max(0, (continuousPracticeSession?.sentencePresentations.length ?? 1) - 1)
      : articleNavigationSentenceIndex
    : state.chapterData.index
  const currentSentence = currentPracticeDocument?.sentences[resolvedCurrentSentenceIndex]
  const currentEnglishSentence = currentEnglishDialogue?.sentences[resolvedCurrentSentenceIndex]
  const currentSentencePresentation = continuousPracticeSession?.sentencePresentations[resolvedCurrentSentenceIndex]

  useEffect(() => {
    if (!currentPracticeDocument) return
    setArticleNavigationSentenceIndex(activeArticleSentenceIndex === -1 ? Math.max(0, currentPracticeDocument.sentences.length - 1) : activeArticleSentenceIndex)
  }, [activeArticleSentenceIndex, currentPracticeDocument])

  useEffect(() => {
    if (isPracticeMode && state.isTyping && state.restartRevision > 0) {
      document.body.focus()
    }
  }, [isPracticeMode, state.isTyping, state.restartRevision])

  const setReviewModeInfo = useSetAtom(reviewModeInfoAtom)
  const isReviewMode = useAtomValue(isReviewModeAtom)

  const prevIndex = useMemo(() => {
    const newIndex = state.chapterData.index - 1
    return newIndex < 0 ? 0 : newIndex
  }, [state.chapterData.index])
  const nextIndex = useMemo(() => {
    const newIndex = state.chapterData.index + 1
    return newIndex > state.chapterData.words.length - 1 ? state.chapterData.words.length - 1 : newIndex
  }, [state.chapterData.index, state.chapterData.words.length])

  usePrefetchPronunciationSound(nextWord?.name)

  const reloadCurrentWordComponent = useCallback(() => {
    setWordComponentKey((old) => old + 1)
  }, [])

  const updateReviewRecord = useCallback(
    (state: TypingState) => {
      setReviewModeInfo((old) => ({
        ...old,
        reviewRecord: old.reviewRecord ? { ...old.reviewRecord, index: state.chapterData.index } : undefined,
      }))
    },
    [setReviewModeInfo],
  )

  const onFinish = useCallback(() => {
    if (state.chapterData.index < state.chapterData.words.length - 1 || currentWordExerciseCount < loopWordTimes - 1) {
      // 用户完成当前单词
      if (currentWordExerciseCount < loopWordTimes - 1) {
        setCurrentWordExerciseCount((old) => old + 1)
        dispatch({ type: TypingStateActionType.LOOP_CURRENT_WORD })
        reloadCurrentWordComponent()
      } else {
        setCurrentWordExerciseCount(0)
        if (isReviewMode) {
          dispatch({
            type: TypingStateActionType.NEXT_WORD,
            payload: {
              updateReviewRecord,
            },
          })
        } else {
          dispatch({ type: TypingStateActionType.NEXT_WORD })
        }
      }
    } else {
      // 用户完成当前章节
      dispatch({ type: TypingStateActionType.FINISH_CHAPTER })
      if (isReviewMode) {
        setReviewModeInfo((old) => ({ ...old, reviewRecord: old.reviewRecord ? { ...old.reviewRecord, isFinished: true } : undefined }))
      }
    }
  }, [
    state.chapterData.index,
    state.chapterData.words.length,
    currentWordExerciseCount,
    loopWordTimes,
    dispatch,
    reloadCurrentWordComponent,
    isReviewMode,
    updateReviewRecord,
    setReviewModeInfo,
  ])

  const onSkipWord = useCallback(
    (type: 'prev' | 'next') => {
      if (currentPracticeDocument) {
        setArticleNavigationSentenceIndex((currentIndex) => {
          const direction = type === 'prev' ? -1 : 1
          return Math.min(Math.max(currentIndex + direction, 0), currentPracticeDocument.sentences.length - 1)
        })
        return
      }

      if (type === 'prev') {
        dispatch({ type: TypingStateActionType.SKIP_2_WORD_INDEX, newIndex: prevIndex })
      }

      if (type === 'next') {
        dispatch({ type: TypingStateActionType.SKIP_2_WORD_INDEX, newIndex: nextIndex })
      }
    },
    [currentPracticeDocument, dispatch, prevIndex, nextIndex],
  )

  const resetArticleNavigationToActiveSentence = useCallback(() => {
    if (currentPracticeDocument) setArticleNavigationSentenceIndex(activeArticleSentenceIndex)
  }, [activeArticleSentenceIndex, currentPracticeDocument])

  useHotkeys(
    'Ctrl + Shift + ArrowLeft',
    (e) => {
      e.preventDefault()
      onSkipWord('prev')
    },
    { preventDefault: true },
  )

  useHotkeys(
    'Ctrl + Shift + ArrowRight',
    (e) => {
      e.preventDefault()
      onSkipWord('next')
    },
    { preventDefault: true },
  )
  const [isShowTranslation, setIsHoveringTranslation] = useState(false)

  const handleShowTranslation = useCallback((checked: boolean) => {
    setIsHoveringTranslation(checked)
  }, [])

  useHotkeys(
    'tab',
    () => {
      handleShowTranslation(true)
    },
    { enableOnFormTags: true, preventDefault: true },
    [],
  )

  useHotkeys(
    'tab',
    () => {
      handleShowTranslation(false)
    },
    { enableOnFormTags: true, keyup: true, preventDefault: true },
    [],
  )

  const shouldShowTranslation = useMemo(() => {
    return isShowTranslation || state.isTransVisible
  }, [isShowTranslation, state.isTransVisible])

  return (
    <div className={`container flex w-full flex-col items-center ${isPracticeMode ? 'min-h-full justify-start' : 'h-full justify-center'}`}>
      <div className={`container w-full shrink-0 grow-0 ${isPracticeMode ? 'practice-navigation-shell min-h-6 px-4 sm:px-8 lg:px-12' : 'h-24 px-12 pt-10'}`}>
        {isShowPrevAndNextWord && state.isTyping && (
          <div data-testid="practice-navigation" className="practice-navigation-grid">
            <div className="practice-navigation-slot practice-navigation-slot-prev">
              <PrevAndNextWord
                type="prev"
                navigation={
                  currentPracticeDocument
                    ? {
                        currentIndex: resolvedCurrentSentenceIndex,
                        itemCount: currentPracticeDocument.sentences.length,
                        onNavigate: setArticleNavigationSentenceIndex,
                      }
                    : undefined
                }
              />
            </div>
            <div className="practice-navigation-slot practice-navigation-slot-next">
              <PrevAndNextWord
                type="next"
                navigation={
                  currentPracticeDocument
                    ? {
                        currentIndex: resolvedCurrentSentenceIndex,
                        itemCount: currentPracticeDocument.sentences.length,
                        onNavigate: setArticleNavigationSentenceIndex,
                      }
                    : undefined
                }
              />
            </div>
          </div>
        )}
      </div>
      <div className={`container flex flex-grow flex-col items-center ${isPracticeMode ? 'w-full justify-start' : 'justify-center'}`}>
        {currentWord && (
          <div className={`relative flex w-full ${isPracticeMode ? 'justify-center' : 'justify-center'}`}>
            {!state.isTyping && !isPracticeMode && (
              <div className="absolute flex h-full w-full justify-center">
                <div className="z-10 flex w-full items-center backdrop-blur-sm">
                  <p className="w-full select-none text-center text-xl text-gray-600 dark:text-gray-50">
                    按任意键{state.timerData.time ? '继续' : '开始'}
                  </p>
                </div>
              </div>
            )}
            {isPracticeMode && (currentPracticeDocument || currentEnglishDialogue) ? (
              <article data-testid={currentEnglishDialogue ? 'english-dialogue-practice' : 'practice-article'} className="w-full max-w-5xl px-4 pb-8 pt-4 md:px-8">
                <header className="mb-8 border-b border-gray-200 pb-4 dark:border-gray-700">
                  <h1 data-testid={currentEnglishDialogue ? 'english-dialogue-title' : 'practice-article-title'} className="break-words text-2xl font-semibold text-gray-800 dark:text-gray-100">
                    {currentEnglishDialogue?.title ?? currentPracticeDocument?.title}
                  </h1>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                    {currentPracticeDocument?.jlptLevel && (
                      <p data-testid="practice-article-jlpt">JLPT：{currentPracticeDocument.jlptLevel}</p>
                    )}
                    {currentEnglishDialogue && <p>CEFR：{currentEnglishDialogue.level}</p>}
                    {currentPracticeDocument?.scenario && (
                      <p data-testid="practice-article-scenario">情境：{currentPracticeDocument.scenario}</p>
                    )}
                  </div>
                </header>
                <section data-testid="practice-current-sentence" className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      目前句 {resolvedCurrentSentenceIndex + 1} / {(currentEnglishDialogue ?? currentPracticeDocument)?.sentences.length}
                    </p>
                    {(currentSentence || currentEnglishSentence) && (
                      <ArticleSentenceSpeechControl
                        documentId={(currentEnglishDialogue ?? currentPracticeDocument)!.id}
                        restartRevision={state.restartRevision}
                        sentenceIndex={resolvedCurrentSentenceIndex}
                        sentence={currentEnglishSentence?.text ?? currentSentence!.name}
                        isTyping={state.isTyping}
                        autoReadSentence={speechConfig.autoReadSentence}
                        voiceURI={speechConfig.voiceURI}
                        rate={speechConfig.rate}
                        lang={currentEnglishDialogue ? 'en-US' : 'ja-JP'}
                        ariaLabel="朗讀目前句"
                      />
                    )}
                  </div>
                  {isDictationActive && (
                    <div
                      data-testid="dictation-prompt"
                      className="flex min-h-20 items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-left text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-100"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-300">
                        <ProductIcon icon={EyeOff} size={20} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">答案已隱藏</p>
                        <p className="mt-0.5 text-xs leading-5 text-indigo-700 dark:text-indigo-300">請先聆聽朗讀或參考翻譯，再輸入完整內容。</p>
                      </div>
                    </div>
                  )}
                  {currentSentence && (
                    <PracticeNotation
                      notation={currentSentence.notation ?? currentSentence.name}
                      showFurigana={phoneticConfig.isOpen}
                      testId="practice-japanese-display"
                      className="flex flex-wrap items-baseline gap-x-0.5 text-left font-mono text-2xl leading-loose text-gray-800 dark:text-gray-100 md:text-3xl"
                      hidden={isDictationActive}
                    />
                  )}
                  {currentEnglishSentence && (
                    <p data-testid="practice-english-display" hidden={isDictationActive} lang="en" className="break-words text-left font-mono text-2xl leading-loose text-gray-800 dark:text-gray-100 md:text-3xl">
                      {currentEnglishSentence.text}
                    </p>
                  )}
                  {currentSentence && (
                    <p className="text-left text-base leading-7 text-gray-600 dark:text-gray-300 md:text-lg">
                      {currentSentence.trans.join(' ')}
                    </p>
                  )}
                  {currentEnglishSentence && (
                    <p className="break-words text-left text-base leading-7 text-gray-600 dark:text-gray-300 md:text-lg">{currentEnglishSentence.meaning}</p>
                  )}
                  {!isDictationActive && <button
                    type="button"
                    className="app-button app-button-ghost px-3"
                    onClick={() => setIsFullArticleVisible((visible) => !visible)}
                  >
                    {isFullArticleVisible ? '收起全文' : '顯示全文'}
                  </button>}
                </section>
                {isFullArticleVisible && !isDictationActive && (
                  <section
                    data-testid="practice-full-article"
                    aria-label={currentEnglishDialogue ? currentEnglishDialogue.sentences.map((sentence) => sentence.text).join('\n') : currentPracticeDocument!.sentences.map((sentence) => sentence.name).join('\n')}
                    className="mt-6 space-y-3"
                  >
                    {currentPracticeDocument?.sentences.map((sentence, index) => (
                      <PracticeNotation
                        key={`${sentence.name}-${index}`}
                        notation={sentence.notation ?? sentence.name}
                        showFurigana={phoneticConfig.isOpen}
                        testId="practice-japanese-sentence"
                        className="flex flex-wrap items-baseline gap-x-0.5 text-left font-mono text-2xl leading-loose text-gray-800 dark:text-gray-100 md:text-3xl"
                      />
                    ))}
                    {currentEnglishDialogue?.sentences.map((sentence, index) => (
                      <p key={`${sentence.text}-${index}`} lang="en" className="break-words text-left font-mono text-2xl leading-loose text-gray-800 dark:text-gray-100 md:text-3xl">{sentence.text}</p>
                    ))}
                    <section
                      data-testid="practice-translation-display"
                      className="space-y-2 text-left text-base leading-7 text-gray-600 dark:text-gray-300 md:text-lg"
                    >
                      {currentPracticeDocument?.sentences.map((sentence, index) => (
                        <p key={`${sentence.name}-${index}`}>{sentence.trans.join(' ')}</p>
                      ))}
                      {currentEnglishDialogue?.sentences.map((sentence, index) => (
                        <p key={`${sentence.meaning}-${index}`}>{sentence.meaning}</p>
                      ))}
                    </section>
                  </section>
                )}
                <section aria-label={currentEnglishDialogue ? 'English typing' : 'Romaji typing'} className="mt-8 border-y border-gray-200 py-6 dark:border-gray-700">
                  <WordComponent
                    word={currentWord}
                    onFinish={onFinish}
                    key={`${wordComponentKey}-${state.restartRevision}-${state.chapterData.index}`}
                    currentSentencePresentation={currentSentencePresentation}
                    onPracticeInput={currentPracticeDocument ? resetArticleNavigationToActiveSentence : undefined}
                  />
                </section>
              </article>
            ) : currentPractice?.kind === 'vocabulary' && currentVocabularyItem ? (
              <article data-testid={currentPractice.language === 'english' ? 'english-vocabulary-practice' : 'vocabulary-practice'} className="w-full max-w-4xl px-4 pb-8 pt-4 md:px-8">
                <header className="mb-8 border-b border-gray-200 pb-4 dark:border-gray-700">
                  <h1 className="break-words text-2xl font-semibold text-gray-800 dark:text-gray-100">{currentPractice.set.title}</h1>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {currentPractice.language === 'english' ? `CEFR：${currentPractice.set.level}` : `JLPT：${currentPractice.set.jlptLevel}`}
                  </p>
                </header>
                <section data-testid="vocabulary-current-word" className="space-y-3 text-center">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">目前 {state.chapterData.index + 1} / {currentPractice.items.length}</p>
                    <ArticleSentenceSpeechControl
                      documentId={currentPractice.set.id}
                      restartRevision={state.restartRevision}
                      sentenceIndex={state.chapterData.index}
                      sentence={currentEnglishVocabularyItem?.word ?? getVocabularySpeechText(currentJapaneseVocabularyItem!)}
                      isTyping={state.isTyping}
                      autoReadSentence={speechConfig.autoReadSentence}
                      voiceURI={speechConfig.voiceURI}
                      rate={speechConfig.rate}
                      lang={currentPractice.language === 'english' ? 'en-US' : 'ja-JP'}
                      ariaLabel="朗讀目前單字"
                    />
                  </div>
                  {isDictationActive && (
                    <div data-testid="dictation-prompt" className="mx-auto flex max-w-xl items-center justify-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-4 text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-100">
                      <ProductIcon icon={EyeOff} size={20} />
                      <span className="text-sm font-semibold">答案已隱藏，請聆聽後輸入</span>
                    </div>
                  )}
                  <h2 hidden={isDictationActive} className="break-words text-4xl font-semibold text-gray-900 dark:text-gray-100 sm:text-5xl">{currentVocabularyItem.word}</h2>
                  {currentJapaneseVocabularyItem && phoneticConfig.isOpen && <p hidden={isDictationActive} className="text-2xl text-gray-700 dark:text-gray-200">{currentJapaneseVocabularyItem.reading}</p>}
                  <p className="text-lg text-gray-600 dark:text-gray-300">{currentVocabularyItem.meaning}</p>
                </section>
                <section aria-label={currentPractice.language === 'english' ? 'English typing' : 'Romaji typing'} className="mt-8 border-y border-gray-200 py-6 dark:border-gray-700">
                  <WordComponent word={currentWord} onFinish={onFinish} key={`${wordComponentKey}-${state.restartRevision}-${state.chapterData.index}`} />
                </section>
              </article>
            ) : (
              <div className="relative">
                <WordComponent word={currentWord} onFinish={onFinish} key={wordComponentKey} />
                {phoneticConfig.isOpen && <Phonetic word={currentWord} />}
                <Translation
                  trans={currentWord.trans.join('；')}
                  showTrans={shouldShowTranslation}
                  onMouseEnter={() => handleShowTranslation(true)}
                  onMouseLeave={() => handleShowTranslation(false)}
                />
              </div>
            )}
          </div>
        )}
      </div>
      <Progress
        className={`mb-10 mt-auto ${state.isTyping ? 'opacity-100' : 'opacity-0'}`}
        typingLength={currentPractice?.kind === 'article' || currentPractice?.kind === 'dialogue' ? currentWord?.name.length : undefined}
      />
    </div>
  )
}

function ArticleSentenceSpeechControl({
  documentId,
  restartRevision,
  sentenceIndex,
  sentence,
  isTyping,
  autoReadSentence,
  voiceURI,
  rate,
  lang,
  ariaLabel,
}: {
  documentId: string
  restartRevision: number
  sentenceIndex: number
  sentence: string
  isTyping: boolean
  autoReadSentence: boolean
  voiceURI: string
  rate: number
  lang: 'ja-JP' | 'en-US'
  ariaLabel: string
}) {
  const speechOptions = useMemo(() => ({ lang, voiceURI, rate }), [lang, rate, voiceURI])
  const { speak, cancel } = useSpeech(sentence, speechOptions)
  const lastSentenceKeyRef = useRef<string>()
  const hasBeenTypingRef = useRef(isTyping)
  const wasAutoReadEnabledRef = useRef(autoReadSentence)
  const autoReadSentenceKeysRef = useRef(new Set<string>())

  useEffect(() => {
    const sentenceKey = `${documentId}:${sentenceIndex === 0 ? restartRevision : 0}:${sentenceIndex}`
    const sentenceChanged = lastSentenceKeyRef.current !== sentenceKey
    const wasTyping = hasBeenTypingRef.current
    const wasAutoReadEnabled = wasAutoReadEnabledRef.current
    lastSentenceKeyRef.current = sentenceKey
    hasBeenTypingRef.current = isTyping
    wasAutoReadEnabledRef.current = autoReadSentence

    if (!isTyping) {
      cancel()
      return
    }

    if (
      !autoReadSentence ||
      (!sentenceChanged && wasTyping && !wasAutoReadEnabled) ||
      autoReadSentenceKeysRef.current.has(sentenceKey)
    )
      return

    let active = true
    void speak(true).then((enqueued) => {
      if (active && enqueued) autoReadSentenceKeysRef.current.add(sentenceKey)
    })

    return () => {
      active = false
      cancel()
    }
  }, [autoReadSentence, cancel, documentId, isTyping, restartRevision, sentenceIndex, speak])

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="app-icon-button"
      onClick={() => speak(true)}
    >
      <ProductIcon icon={Volume2} size={19} />
    </button>
  )
}
