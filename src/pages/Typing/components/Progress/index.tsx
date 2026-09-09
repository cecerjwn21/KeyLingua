import { TypingContext } from '../../store'
import { isPracticeModeAtom } from '@/store'
import { useAtomValue } from 'jotai'
import { useContext, useEffect, useState } from 'react'

export default function Progress({ className, typingLength }: { className?: string; typingLength?: number }) {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state } = useContext(TypingContext)!
  const isPracticeMode = useAtomValue(isPracticeModeAtom)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(0)

  const colorSwitcher: { [key: number]: string } = {
    0: 'bg-indigo-200 dark:bg-indigo-300',
    1: 'bg-indigo-300 dark:bg-indigo-400',
    2: 'bg-indigo-400 dark:bg-indigo-500',
  }

  useEffect(() => {
    const newProgress =
      isPracticeMode && typingLength
        ? Math.floor((state.chapterData.correctCount / typingLength) * 100)
        : Math.floor((state.chapterData.index / state.chapterData.words.length) * 100)
    setProgress(newProgress)
    const colorPhase = Math.floor(newProgress / 33.4)
    setPhase(colorPhase)
  }, [isPracticeMode, state.chapterData.correctCount, state.chapterData.index, state.chapterData.words.length, typingLength])

  return (
    <div
      data-testid={isPracticeMode ? 'article-progress' : undefined}
      aria-valuemin={isPracticeMode ? 0 : undefined}
      aria-valuemax={isPracticeMode ? 100 : undefined}
      aria-valuenow={isPracticeMode ? progress : undefined}
      className={`relative w-1/4 pt-1 ${className}`}
    >
      <div className="mb-4 flex h-2 overflow-hidden rounded-xl bg-indigo-100 text-xs transition-all duration-300 dark:bg-indigo-200">
        <div
          style={{ width: `${progress}%` }}
          className={`flex flex-col justify-center whitespace-nowrap rounded-xl text-center text-white shadow-none transition-all duration-300 ${
            colorSwitcher[phase] ?? 'bg-indigo-200 dark:bg-indigo-300'
          }`}
        ></div>
      </div>
    </div>
  )
}
