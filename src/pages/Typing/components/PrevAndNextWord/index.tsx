import { TypingContext, TypingStateActionType } from '../../store'
import ProductIcon from '@/components/ProductIcon'
import Tooltip from '@/components/Tooltip'
import { CTRL } from '@/utils'
import { ArrowLeft, ArrowRight } from 'lucide'
import { useCallback, useContext, useMemo } from 'react'

export default function PrevAndNextWord({ type, navigation }: LastAndNextWordProps) {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state, dispatch } = useContext(TypingContext)!

  const currentIndex = navigation?.currentIndex ?? state.chapterData.index
  const itemCount = navigation?.itemCount ?? state.chapterData.words.length
  const newIndex = useMemo(() => currentIndex + (type === 'prev' ? -1 : 1), [currentIndex, type])
  const hasAdjacentItem = newIndex >= 0 && newIndex < itemCount
  const shortCutKey = useMemo(() => (type === 'prev' ? `${CTRL} + Shift + ArrowLeft` : `${CTRL} + Shift + ArrowRight`), [type])
  const label = type === 'prev' ? '上一句' : '下一句'

  const onClickWord = useCallback(() => {
    if (!hasAdjacentItem) return

    if (navigation) {
      navigation.onNavigate(newIndex)
      return
    }

    dispatch({ type: TypingStateActionType.SKIP_2_WORD_INDEX, newIndex })
  }, [dispatch, hasAdjacentItem, navigation, newIndex])

  return (
    <>
      {hasAdjacentItem ? (
        <Tooltip content={`快捷键: ${shortCutKey}`} placement="bottom" className="practice-word-navigation z-20">
          <button
            type="button"
            data-testid={`practice-${type}-word`}
            aria-label={`${label}，快捷鍵：${shortCutKey}`}
            onClick={onClickWord}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClickWord()
              }
            }}
            className="inline-flex min-w-[6.5rem] select-none items-center justify-center gap-2 rounded-lg bg-slate-100/80 px-3 py-2 text-slate-800 shadow-sm transition-[background-color,color,transform] duration-150 ease-out hover:bg-slate-200 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 active:scale-[0.98] dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-white sm:px-4"
          >
            {type === 'prev' && <ProductIcon icon={ArrowLeft} size={18} className="shrink-0" />}
            <span className="text-sm font-medium leading-5">{label}</span>
            {type === 'next' && <ProductIcon icon={ArrowRight} size={18} className="shrink-0" />}
          </button>
        </Tooltip>
      ) : (
        <div />
      )}
    </>
  )
}

export type LastAndNextWordProps = {
  /** 上一句還是下一句 */
  type: 'prev' | 'next'
  navigation?: {
    currentIndex: number
    itemCount: number
    onNavigate: (newIndex: number) => void
  }
}
