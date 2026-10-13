import { TypingContext, TypingStateActionType } from '../../store'
import { calculateCPM } from '../Speed/statistics'
import ProductIcon from '@/components/ProductIcon'
import { useUiTranslation } from '@/i18n/useUiTranslation'
import { currentTypingPracticeAtom, getLibraryCompletionKey, libraryCompletionAtom } from '@/store'
import { useAtomValue, useSetAtom } from 'jotai'
import { ArrowLeft, RotateCcw } from 'lucide'
import { useCallback, useContext, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

const ArticleResultScreen = () => {
  const { t } = useUiTranslation()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { state, dispatch } = useContext(TypingContext)!
  const currentPractice = useAtomValue(currentTypingPracticeAtom)
  const setLibraryCompletion = useSetAtom(libraryCompletionAtom)
  const navigate = useNavigate()

  const completionKey = currentPractice
    ? currentPractice.kind === 'article'
      ? getLibraryCompletionKey({ language: 'japanese', practiceType: 'article', id: currentPractice.document.id })
      : currentPractice.kind === 'dialogue'
      ? getLibraryCompletionKey({ language: 'english', practiceType: 'dialogue', id: currentPractice.document.id })
      : currentPractice.language === 'english'
      ? getLibraryCompletionKey({ language: 'english', practiceType: 'vocabulary', id: currentPractice.set.id })
      : getLibraryCompletionKey({ language: 'japanese', practiceType: 'vocabulary', id: currentPractice.set.id })
    : null

  useEffect(() => {
    dispatch({ type: TypingStateActionType.TICK_TIMER, addTime: 0 })
  }, [dispatch])

  useEffect(() => {
    if (!completionKey) return
    setLibraryCompletion((current) => (current[completionKey] ? current : { ...current, [completionKey]: true }))
  }, [completionKey, setLibraryCompletion])

  const statistics = useMemo(
    () => [
      { label: t('result.time'), value: formatTime(state.timerData.time) },
      {
        label: t('result.speed'),
        value: t('result.speedValue', { value: calculateCPM(state.chapterData.correctCount, state.timerData.time) }),
      },
      { label: t('result.accuracy'), value: `${state.timerData.accuracy}%` },
      { label: t('result.errors'), value: String(state.chapterData.wrongCount) },
    ],
    [state.chapterData.correctCount, state.chapterData.wrongCount, state.timerData.accuracy, state.timerData.time, t],
  )

  const repeatPractice = useCallback(() => {
    dispatch({ type: TypingStateActionType.REPEAT_CHAPTER, shouldShuffle: false })
  }, [dispatch])

  const isVocabulary = currentPractice?.kind === 'vocabulary'
  const isEnglish = currentPractice?.language === 'english'
  const isDialogue = currentPractice?.kind === 'dialogue'
  const title =
    currentPractice?.kind === 'article' || currentPractice?.kind === 'dialogue'
      ? currentPractice.document.title
      : currentPractice?.set.title
  const level =
    currentPractice?.kind === 'article'
      ? currentPractice.document.jlptLevel
      : currentPractice?.kind === 'dialogue'
      ? currentPractice.document.level
      : currentPractice?.language === 'english'
      ? currentPractice.set.level
      : currentPractice?.set.jlptLevel
  const scenario = currentPractice?.kind === 'article' ? currentPractice.document.scenario : undefined
  const returnPath = isEnglish ? (isVocabulary ? '/en/vocabulary' : '/en/dialogues') : isVocabulary ? '/ja/vocabulary' : '/ja/articles'
  const returnLabel = isEnglish
    ? isVocabulary
      ? t('library.backEnglishVocabulary')
      : t('library.backEnglishDialogue')
    : isVocabulary
    ? t('library.backVocabulary')
    : t('library.backArticle')
  const testId = isEnglish
    ? isVocabulary
      ? 'english-vocabulary-result-screen'
      : 'english-dialogue-result-screen'
    : isVocabulary
    ? 'vocabulary-result-screen'
    : 'article-result-screen'
  const returnToLibrary = useCallback(() => navigate(returnPath), [navigate, returnPath])

  return (
    <div data-testid={testId} className="fixed inset-0 z-30 overflow-y-auto bg-gray-200/90 px-4 py-8 dark:bg-gray-950/90">
      <main className="mx-auto flex min-h-full w-full max-w-3xl items-center justify-center">
        <section className="w-full rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-xl dark:border-slate-700 dark:bg-slate-800 md:px-12">
          <div className="text-center">
            <p
              data-testid={!isVocabulary ? 'article-completion-status' : undefined}
              className="text-sm font-semibold tracking-wide text-green-600 dark:text-green-400"
            >
              {t(isVocabulary ? 'result.vocabularyCompleted' : isDialogue ? 'result.dialogueCompleted' : 'result.articleCompleted')}
            </p>
            <h1 className="mt-3 break-words text-3xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
            <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
              {level && (
                <span>
                  {isEnglish ? 'CEFR' : 'JLPT'}：{level}
                </span>
              )}
              {scenario && <span>{t('result.scenario', { scenario })}</span>}
              {currentPractice?.kind === 'vocabulary' && <span>{t('result.wordCount', { count: currentPractice.items.length })}</span>}
              {currentPractice?.kind === 'dialogue' && (
                <span>{t('result.sentenceCount', { count: currentPractice.document.sentences.length })}</span>
              )}
            </div>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {statistics.map(({ label, value }) => (
              <div key={label} className="rounded-2xl bg-gray-50 px-3 py-5 text-center dark:bg-gray-700">
                <dt className="text-sm text-gray-500 dark:text-gray-300">{label}</dt>
                <dd className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" className="app-button app-button-primary h-12 px-8 text-base" onClick={repeatPractice}>
              <ProductIcon icon={RotateCcw} size={18} />
              {t('result.repeat')}
            </button>
            <button type="button" className="app-button app-button-secondary h-12 px-8 text-base" onClick={returnToLibrary}>
              <ProductIcon icon={ArrowLeft} size={18} />
              {returnLabel}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default ArticleResultScreen
