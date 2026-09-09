import { getPracticeTypingTargetPresentation } from './practiceTypingTarget'
import type { ArticleTypingSession, PracticeDocument } from '@/typings'

export const MAX_ARTICLE_TYPING_LENGTH = 2000

export const createArticleTypingSession = (document: PracticeDocument): ArticleTypingSession => {
  const sentenceTargets = document.sentences.map(getPracticeTypingTargetPresentation)
  const typingTarget = sentenceTargets.map(({ typingTarget }) => typingTarget).join('')
  if (typingTarget.length > MAX_ARTICLE_TYPING_LENGTH) {
    throw new Error('這篇文章太長，請先縮短內容後再開始練習。')
  }

  let targetStart = 0
  const sentencePresentations = sentenceTargets.map(({ typingTarget: sentenceTarget, visualGroups }) => {
    const presentation = {
      targetStart,
      targetEnd: targetStart + sentenceTarget.length,
      visualGroups: visualGroups?.map(({ start, end }) => ({ start: targetStart + start, end: targetStart + end })),
    }
    targetStart = presentation.targetEnd
    return presentation
  })

  return {
    article: {
      id: document.id,
      title: document.title,
      source: document.source,
      language: document.language,
      jlptLevel: document.jlptLevel,
      scenario: document.scenario,
      format: document.format ?? 'prose',
      blocks: document.sentences.map(({ name, notation, trans }) => ({ name, notation, trans })),
    },
    typingTarget,
    typingLength: typingTarget.length,
    typingItem: {
      name: typingTarget,
      trans: document.sentences.flatMap((sentence) => sentence.trans),
    },
    sentencePresentations,
  }
}
