import ImeHint from './ImeHint'
import { getNotationInfo, stripNotation } from './Notation'
import { getSpecialKanaHint, kanaToImeRomaji, splitKanaIntoImeUnits } from '@/pages/Typing/utils/imeRomaji'
import { Fragment, useMemo } from 'react'

type PracticeNotationProps = {
  notation: string
  showFurigana: boolean
  testId?: string | false
  className?: string
  hidden?: boolean
}

export default function PracticeNotation({ notation, showFurigana, testId = 'practice-japanese-display', className, hidden }: PracticeNotationProps) {
  const infos = useMemo(() => getNotationInfo(notation), [notation])

  return (
    <div
      data-testid={testId || undefined}
      aria-label={stripNotation(notation)}
      hidden={hidden}
      className={`${hidden ? 'hidden' : ''} ${
        className ??
        'mx-auto flex min-h-[5rem] max-w-[calc(100vw-2rem)] flex-wrap items-baseline justify-center pb-3 text-center font-mono text-3xl font-normal leading-relaxed text-gray-800 dark:text-gray-100 dark:text-opacity-80 md:text-4xl xl:text-5xl'
      }`}
    >
      {infos.map(({ word, phonetic }, infoIndex) => {
        const hasFurigana = Boolean(phonetic?.trim())

        if (!hasFurigana) {
          let unitOffset = 0
          return (
            <Fragment key={`${word}-${infoIndex}`}>
              {splitKanaIntoImeUnits(word).map((normalizedUnit, unitIndex) => {
                const unit = word.slice(unitOffset, unitOffset + normalizedUnit.length)
                unitOffset += normalizedUnit.length
                if (!/^[ぁ-ゖァ-ヺー]+$/.test(unit)) return <Fragment key={`${infoIndex}-${unitOffset}-${unit}`}>{unit}</Fragment>

                const specialHint = getSpecialKanaHint(unit)
                const lines = specialHint ?? [unit, kanaToImeRomaji(unit)]
                return (
                  <ImeHint key={`${infoIndex}-${unitOffset}-${unit}-${unitIndex}`} label={unit} lines={lines}>
                    {unit}
                  </ImeHint>
                )
              })}
            </Fragment>
          )
        }

        const reading = phonetic ?? ''

        return (
          <ImeHint key={`${word}-${reading}-${infoIndex}`} label={word} lines={[reading, kanaToImeRomaji(reading)]}>
            <ruby className="align-baseline leading-[inherit]">
              {word}
              {showFurigana && <rt className="select-none text-base font-normal leading-none">{phonetic}</rt>}
            </ruby>
          </ImeHint>
        )
      })}
    </div>
  )
}
