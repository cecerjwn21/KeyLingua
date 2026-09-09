import { getNotationInfo, stripNotation } from '../components/WordPanel/components/Word/Notation'
import { kanaToImeRomaji } from './imeRomaji'
import { isJapaneseNumericCounter, isJapaneseNumericCounterSuffix, normalizeJapaneseNumericCounters } from './japaneseNumericReading'
import type { Word } from '@/typings'

export type PracticeTypingTargetPresentation = {
  typingTarget: string
  visualGroups?: { start: number; end: number }[]
}

type ReadingChunk = {
  start: number
  end: number
  base: string
  reading: string
  hasReading: boolean
}

type JapaneseSegment = {
  segment: string
  index: number
  isWordLike: boolean
}

const punctuationRomaji: Record<string, string> = {
  '、': ',',
  '。': '.',
  '！': '!',
  '？': '?',
  '：': ':',
  '；': ';',
  '「': '"',
  '」': '"',
  '『': '"',
  '』': '"',
  '…': '...',
}

const romanizeText = (text: string) =>
  text
    .replace(/[\r\n]/gu, '')
    .split(/([、。！？：；「」『』…])/u)
    .map((part) => punctuationRomaji[part] ?? kanaToImeRomaji(part))
    .join('')

export const getJapaneseReadingTypingTarget = (reading: string): string => romanizeText(reading)

const buildReadingChunks = (notation: string): ReadingChunk[] => {
  let start = 0
  const chunks = getNotationInfo(notation).map(({ word, phonetic }) => {
    const hasReading = Boolean(phonetic?.trim())
    const chunk = {
      start,
      end: start + word.length,
      base: word,
      reading: hasReading ? phonetic?.trim() ?? word : word,
      hasReading,
    }
    start = chunk.end
    return chunk
  })

  const resolvedChunks: ReadingChunk[] = []
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index]
    const nextChunk = chunks[index + 1]
    if (/^[0-9]+$/u.test(chunk.base) && nextChunk && isJapaneseNumericCounter(nextChunk.base)) {
      const fallbackReading = normalizeJapaneseNumericCounters(`${chunk.base}${nextChunk.base}`)
      if (fallbackReading !== `${chunk.base}${nextChunk.base}`) {
        resolvedChunks.push({
          start: chunk.start,
          end: nextChunk.end,
          base: `${chunk.base}${nextChunk.base}`,
          reading:
            nextChunk.hasReading && !isJapaneseNumericCounterSuffix(nextChunk.base, nextChunk.reading)
              ? nextChunk.reading
              : fallbackReading,
          hasReading: true,
        })
        index += 1
        continue
      }
    }

    resolvedChunks.push({
      ...chunk,
      reading: chunk.hasReading ? chunk.reading : normalizeJapaneseNumericCounters(chunk.reading),
    })
  }

  return resolvedChunks
}

const segmentJapanese = (text: string): JapaneseSegment[] => {
  const Segmenter = Intl.Segmenter
  if (!Segmenter) return [{ segment: text, index: 0, isWordLike: true }]

  return Array.from(new Segmenter('ja', { granularity: 'word' }).segment(text), ({ segment, index, isWordLike }) => ({
    segment,
    index,
    isWordLike: Boolean(isWordLike),
  }))
}

const readingPartsForRange = (chunks: ReadingChunk[], start: number, end: number) =>
  chunks
    .filter((chunk) => chunk.start < end && chunk.end > start)
    .map((chunk) => {
      const overlapStart = Math.max(start, chunk.start)
      const overlapEnd = Math.min(end, chunk.end)
      const coversWholeChunk = overlapStart === chunk.start && overlapEnd === chunk.end
      const text = chunk.hasReading ? chunk.reading : chunk.base.slice(overlapStart - chunk.start, overlapEnd - chunk.start)
      return { text, canMapExactly: !chunk.hasReading || coversWholeChunk }
    })

const romanizeParts = (parts: ReturnType<typeof readingPartsForRange>): string | undefined =>
  parts.every(({ canMapExactly }) => canMapExactly) ? parts.map(({ text }) => romanizeText(text)).join('') : undefined

export const getPracticeTypingTargetPresentation = (word: Word): PracticeTypingTargetPresentation => {
  const notation = word.notation?.trim()
  if (!notation || stripNotation(notation) !== word.name) return { typingTarget: word.name }

  const chunks = buildReadingChunks(notation)
  const typingTarget = chunks.map(({ reading }) => romanizeText(reading)).join('')
  const segments = segmentJapanese(word.name)
  let target = ''
  const visualGroups: { start: number; end: number }[] = []

  for (const segment of segments) {
    const start = target.length
    if (!segment.isWordLike) {
      if (/^[\r\n]+$/.test(segment.segment)) continue
      target += punctuationRomaji[segment.segment] ?? segment.segment
    } else {
      const end = segment.index + segment.segment.length
      const fragment = romanizeParts(readingPartsForRange(chunks, segment.index, end))
      if (fragment === undefined) return { typingTarget }
      target += fragment
    }
    if (target.length > start) visualGroups.push({ start, end: target.length })
  }

  return visualGroups.length > 0 && target === typingTarget ? { typingTarget, visualGroups } : { typingTarget }
}

export const getPracticeTypingTarget = (word: Word): string => getPracticeTypingTargetPresentation(word).typingTarget
