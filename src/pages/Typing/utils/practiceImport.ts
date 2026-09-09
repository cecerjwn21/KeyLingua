import { PRACTICE_GENERATION_PROMPT_CONTRACT, validateGeneratedPracticeDocument } from './practiceGeneration'
import type { PracticeDocument, Word } from '@/typings'

export type PracticeImportResult = { document?: PracticeDocument; error?: string }
export type PracticeImportBatchResult = { documents?: PracticeDocument[]; error?: string }

const createGeneratedId = () => `generated-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const unwrapOuterCodeFence = (text: string) => {
  const lines = text.trim().split(/\r?\n/)
  const firstLine = lines[0]?.trim()
  if ((firstLine === '```json' || firstLine === '```') && lines.at(-1)?.trim() === '```') return lines.slice(1, -1).join('\n')
  return text.trim()
}

const toUserError = (error: string) => {
  if (error === 'JLPT 程度不合法。') return '文章程度必須是 N5、N4、N3、N2 或 N1。'
  const mismatch = error.match(/^(第 \d+ 句)讀音標記與原文不一致。$/)
  if (mismatch) return `${mismatch[1]}的 Furigana 格式與日文原文不一致。`
  return error
}

export const importChatGPTPracticeDocument = (text: string, createId: () => string = createGeneratedId): PracticeImportResult => {
  const result = importChatGPTPracticeDocuments([text], createId)
  return result.documents ? { document: result.documents[0] } : { error: result.error?.replace(/^第 1 篇文章格式錯誤：/, '') }
}

export const importChatGPTPracticeDocuments = (
  texts: string[],
  createId: () => string = createGeneratedId,
): PracticeImportBatchResult => {
  const documents: PracticeDocument[] = []

  for (const text of texts) {
  let parsed: unknown
  try {
    parsed = JSON.parse(unwrapOuterCodeFence(text))
  } catch {
      return { error: `第 ${documents.length + 1} 篇文章格式錯誤：無法讀取文章格式，請確認貼上的是 ChatGPT 產生的 JSON。` }
  }

    const candidates = Array.isArray(parsed) ? parsed : [parsed]
    if (candidates.length === 0) return { error: `第 ${documents.length + 1} 篇文章格式錯誤：文章資料格式錯誤。` }
    for (const candidate of candidates) {
      const document: PracticeDocument = {
        id: createId(),
        source: 'generated',
        language: 'ja',
        title: (candidate as Partial<PracticeDocument>)?.title as string,
        jlptLevel: (candidate as Partial<PracticeDocument>)?.jlptLevel,
        scenario: (candidate as Partial<PracticeDocument>)?.scenario,
        format: (candidate as Partial<PracticeDocument>)?.format,
        sentences: (candidate as Partial<PracticeDocument>)?.sentences as Word[],
      }
      const validation = validateGeneratedPracticeDocument(document)
      if (!validation.valid) return { error: `第 ${documents.length + 1} 篇文章格式錯誤：${toUserError(validation.errors[0] ?? '文章資料格式錯誤。')}` }
      documents.push(document)
    }
  }

  return { documents }
}

export const buildChatGPTPracticePrompt = () => {
  const contract = PRACTICE_GENERATION_PROMPT_CONTRACT
  return [
    '請產生一篇日文打字練習文章，並且只輸出 JSON，不要加入 Markdown code fence 或說明文字。',
    '文章程度必須是 JLPT N5、N4、N3、N2 或 N1；請選擇一個自然且連貫的日常情境與合適篇幅（短篇 5～8 句、中篇 9～15 句、長篇 16～25 句）。',
    ...contract.quality,
    `可用情境：${Object.values(contract.scenarios).join('；')}`,
    'JSON 格式：{"title":"文章標題","jlptLevel":"N4","scenario":"izakaya","sentences":[{"name":"日文原文","notation":"漢字(かな)標記的日文原文","trans":["繁體中文翻譯"]}]}。',
  ].join('\n')
}
