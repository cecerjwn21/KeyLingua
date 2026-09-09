import type { PracticeDocument } from '@/typings'

export const MAX_PRACTICE_TEXT_LENGTH = 10000

const SENTENCE_ENDING_PATTERN = /[^。！？.!?]+[。！？.!?]+|[^。！？.!?]+$/g
const CJK_CHARACTER_PATTERN = /[\u3040-\u30ff\u3400-\u9fff]/

const joinWrappedLines = (lines: string[]): string => {
  return lines.reduce((text, line) => {
    if (!text) {
      return line
    }

    const previousCharacter = text.at(-1) ?? ''
    const nextCharacter = line[0] ?? ''
    const separator = CJK_CHARACTER_PATTERN.test(previousCharacter) && CJK_CHARACTER_PATTERN.test(nextCharacter) ? '' : ' '
    return `${text}${separator}${line}`
  }, '')
}

export const splitPracticeText = (text: string): string[] => {
  const paragraphs = text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n+/)
    .map((paragraph) =>
      joinWrappedLines(
        paragraph
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      ),
    )
    .filter(Boolean)

  return paragraphs.flatMap(
    (paragraph) =>
      paragraph
        .match(SENTENCE_ENDING_PATTERN)
        ?.map((sentence) => sentence.trim())
        .filter(Boolean) ?? [],
  )
}

export const createPastedPracticeDocument = ({ id, title, text }: CreatePastedPracticeDocumentArgs): PracticeDocument => {
  const trimmedText = text.trim()
  if (!trimmedText) {
    throw new Error('請貼上文章內容。')
  }
  if (trimmedText.length > MAX_PRACTICE_TEXT_LENGTH) {
    throw new Error(`文章長度不可超過 ${MAX_PRACTICE_TEXT_LENGTH.toLocaleString()} 個字元。`)
  }

  const sentences = splitPracticeText(trimmedText)
  if (sentences.length === 0) {
    throw new Error('找不到可練習的句子。')
  }

  return {
    id,
    title: title.trim() || '我的文章',
    source: 'pasted',
    language: 'ja',
    sentences: sentences.map((name) => ({ name, trans: [] })),
  }
}

type CreatePastedPracticeDocumentArgs = {
  id: string
  title: string
  text: string
}
