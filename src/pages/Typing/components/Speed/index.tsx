import { TypingContext } from '../../store'
import InfoBox from './InfoBox'
import { calculateCPM } from './statistics'
import { isPracticeModeAtom } from '@/store'
import { useAtomValue } from 'jotai'
import { useContext } from 'react'

export default function Speed() {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state } = useContext(TypingContext)!
  const isPracticeMode = useAtomValue(isPracticeModeAtom)
  const seconds = state.timerData.time % 60
  const minutes = Math.floor(state.timerData.time / 60)
  const secondsString = seconds < 10 ? '0' + seconds : seconds + ''
  const minutesString = minutes < 10 ? '0' + minutes : minutes + ''
  const inputNumber = state.chapterData.correctCount + state.chapterData.wrongCount
  const speed = calculateCPM(state.chapterData.correctCount, state.timerData.time)

  if (isPracticeMode) {
    return (
      <div className="my-card grid w-[calc(100%_-_2rem)] max-w-4xl grid-cols-2 gap-x-2 gap-y-5 rounded-2xl border border-slate-200 bg-white p-4 py-6 shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-5 sm:py-8">
        <InfoBox info={`${minutesString}:${secondsString}`} description="經過時間" />
        <InfoBox info={`${speed} 字/分鐘`} description="速度" />
        <InfoBox info={inputNumber + ''} description="輸入數" />
        <InfoBox info={state.chapterData.correctCount + ''} description="正確數" />
        <InfoBox info={`${state.timerData.accuracy}%`} description="正確率" />
      </div>
    )
  }

  return (
    <div className="my-card flex w-3/5 rounded-xl bg-white p-4 py-10 opacity-50 transition-colors duration-300 dark:bg-gray-800">
      <InfoBox info={`${minutesString}:${secondsString}`} description="时间" />
      <InfoBox info={inputNumber + ''} description="输入数" />
      <InfoBox info={state.timerData.wpm + ''} description="WPM" />
      <InfoBox info={state.chapterData.correctCount + ''} description="正确数" />
      <InfoBox info={state.timerData.accuracy + ''} description="正确率" />
    </div>
  )
}
