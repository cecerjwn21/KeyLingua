import type { PracticeDocument } from '.'

export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'

export type PracticeScenario = 'travel' | 'izakaya' | 'small-talk' | 'random'

export type PracticeLength = 'short' | 'medium' | 'long'

export type PracticeGenerationRequest = {
  jlptLevel: JLPTLevel
  scenario: PracticeScenario
  length: PracticeLength
  topic?: string
}

export interface PracticeGenerator {
  generate(request: PracticeGenerationRequest): Promise<PracticeDocument>
}
