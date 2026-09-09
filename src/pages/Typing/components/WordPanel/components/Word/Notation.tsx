import { isKanji } from '@/utils/kana'
import { Fragment, useMemo } from 'react'

export type NotationInfo = {
  word: string
  phonetic?: string
}

type NotationProps = {
  notation: string
}

export default function Notation({ notation }: NotationProps) {
  const infos = useMemo(() => getNotationInfo(notation), [notation])
  return (
    <div className="mx-auto flex h-20 items-end">
      <ruby className="mb-1 p-0 font-mono text-5xl text-gray-800 dark:text-opacity-80">
        {infos.map(({ word, phonetic }, index) => {
          const hasPhonetic = phonetic && phonetic.length > 0
          const isEmptyPhonetic = hasPhonetic && phonetic.trim().length == 0
          return (
            <Fragment key={`${word}-${phonetic}-${index}`}>
              {word}
              {hasPhonetic && isEmptyPhonetic ? (
                <>
                  <rt>{phonetic}</rt>
                </>
              ) : (
                <>
                  <rp>{'('}</rp>
                  <rt>{phonetic}</rt>
                  <rp>{')'}</rp>
                </>
              )}
            </Fragment>
          )
        })}
      </ruby>
    </div>
  )
}

export const getNotationInfo = (notation: string): NotationInfo[] => {
  const re = /(.+?)\((.+?)\)/g
  let match
  let start = 0
  const ret = []
  while ((match = re.exec(notation))) {
    const [fullMatch, , phonetic] = match
    let word = match[1]
    if (match.index > start) {
      ret.push({ word: notation.substring(start, match.index), phonetic: '' })
    }
    let kanjiStart = 0
    for (let i = 0; i < word.length; i++) {
      if (!isKanji(word[i])) {
        kanjiStart += 1
      } else if (kanjiStart > 0) {
        ret.push({
          word: word.substring(0, i),
          phonetic: ' ',
        })
        word = word.substring(i)
        break
      }
    }
    ret.push({
      word,
      phonetic,
    })
    start = match.index + fullMatch.length
  }
  if (start < notation.length) {
    ret.push({
      word: notation.substring(start),
      phonetic: '',
    })
  }
  return ret
}

export const stripNotation = (notation: string): string => getNotationInfo(notation).map(({ word }) => word).join('')

export const isNotationCompatible = (notation: string, wordName: string): boolean => stripNotation(notation) === wordName
