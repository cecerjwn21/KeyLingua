import { TypingContext, TypingStateActionType } from '../../store'
import ProductIcon from '@/components/ProductIcon'
import Tooltip from '@/components/Tooltip'
import { randomConfigAtom } from '@/store'
import { autoUpdate, offset, useFloating, useHover, useInteractions } from '@floating-ui/react'
import { useAtomValue } from 'jotai'
import { Pause, Play, RotateCcw } from 'lucide'
import { useCallback, useContext, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

export default function StartButton({ isLoading, articleMode = false }: { isLoading: boolean; articleMode?: boolean }) {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state, dispatch } = useContext(TypingContext)!
  const randomConfig = useAtomValue(randomConfigAtom)

  const onToggleIsTyping = useCallback(() => {
    !isLoading && dispatch({ type: TypingStateActionType.TOGGLE_IS_TYPING })
  }, [isLoading, dispatch])

  const onClickRestart = useCallback(() => {
    dispatch({ type: TypingStateActionType.REPEAT_CHAPTER, shouldShuffle: articleMode ? false : randomConfig.isOpen })
  }, [articleMode, dispatch, randomConfig.isOpen])

  const onEnterShortcut = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof Element && target.closest('[data-testid="practice-prev-word"], [data-testid="practice-next-word"]')) {
        return
      }
      onToggleIsTyping()
    },
    [onToggleIsTyping],
  )

  useHotkeys('enter', onEnterShortcut, { enableOnFormTags: true, preventDefault: true }, [onEnterShortcut])

  const [isShowReStartButton, setIsShowReStartButton] = useState(false)
  const { refs, floatingStyles, context } = useFloating({
    open: isShowReStartButton,
    onOpenChange: setIsShowReStartButton,
    whileElementsMounted: autoUpdate,
    placement: 'bottom-start',
    middleware: [offset(5)],
  })
  const hoverButton = useHover(context)
  const { getReferenceProps, getFloatingProps } = useInteractions([hoverButton])

  const label = state.isTyping ? '暫停' : articleMode ? '繼續' : '開始'
  const stableButtonClass =
    'app-button h-10 w-28 min-w-28 px-3 transition-[background-color,border-color,color,box-shadow] active:transform-none'

  const primaryButton = (
    <button
      className={`${
        state.isTyping
          ? 'border border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-400 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:border-slate-500 dark:hover:bg-slate-600'
          : 'border border-indigo-600 bg-indigo-600 text-white shadow-sm hover:border-indigo-700 hover:bg-indigo-700 dark:border-indigo-500 dark:bg-indigo-500 dark:hover:border-indigo-400 dark:hover:bg-indigo-400'
      } ${stableButtonClass}`}
      type="button"
      onClick={onToggleIsTyping}
      aria-label={label}
    >
      <ProductIcon icon={state.isTyping ? Pause : Play} size={17} />
      <span>{label}</span>
    </button>
  )

  if (articleMode) {
    return (
      <div data-testid={state.isTyping ? 'typing-actions' : 'pause-actions'} className="min-w-28 group relative h-10 w-28 shrink-0">
        <Tooltip content={`${label} （Enter）`} className="h-10 w-28 shrink-0 whitespace-nowrap">
          {primaryButton}
        </Tooltip>
        {!state.isTyping && (
          <div
            data-testid="restart-menu"
            className="pointer-events-none invisible absolute left-0 top-full z-[80] w-28 bg-transparent p-0 pt-1.5 opacity-0 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100"
          >
            <button
              className={`${stableButtonClass} app-button-secondary`}
              type="button"
              onClick={(event) => {
                onClickRestart()
                event.currentTarget.blur()
              }}
              aria-label="重新"
            >
              <ProductIcon icon={RotateCcw} size={16} />
              <span>重新</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Tooltip content={`${label} （Enter）`} className="min-w-28 flex-shrink-0 whitespace-nowrap">
      <div ref={refs.setReference} {...getReferenceProps()} className="min-w-28 relative h-10 w-28">
        {primaryButton}
        {isShowReStartButton && (
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            data-testid="restart-menu"
            className="z-[80] w-28 rounded-xl bg-transparent p-0 pt-1.5"
          >
            <button
              className="app-button app-button-ghost h-10 w-full justify-start px-3"
              type="button"
              onClick={(event) => {
                onClickRestart()
                event.currentTarget.blur()
              }}
              aria-label="重新"
            >
              <ProductIcon icon={RotateCcw} size={16} />
              <span>重新</span>
            </button>
          </div>
        )}
      </div>
    </Tooltip>
  )
}
