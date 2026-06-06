// Feature: ai-assessment-assistant, Property 2: questionnaire card render completeness

import fc from 'fast-check'
import { render, screen, cleanup } from '@testing-library/react'
import QuestionnaireCard from '../QuestionnaireCard'
import type { Questionnaire, QuestionnaireCategory } from '../../types'

function textArb(min: number, max: number): fc.Arbitrary<string> {
  return fc.stringOf(
    fc.char().filter(c => /[a-zA-Z0-9一-鿿]/.test(c)),
    { minLength: min, maxLength: max },
  ).filter(s => s.trim().length >= min)
}

const categoryArb: fc.Arbitrary<QuestionnaireCategory> = fc.constantFrom(
  'personality', 'temperament', 'mbti', 'leadership', 'career',
)

const questionnaireArb: fc.Arbitrary<Questionnaire> = fc.record({
  id: fc.hexaString({ minLength: 3, maxLength: 12 }),
  name: textArb(3, 20),
  category: categoryArb,
  description: textArb(3, 30),
  enabled: fc.constant(true),
  createdAt: fc.string({ minLength: 1, maxLength: 25 }),
  scoring_rule: fc.constant({ type: 'additive' as const, dimensions: [] }),
  questions: fc.array(
    fc.record({
      id: fc.hexaString({ minLength: 1, maxLength: 5 }),
      sequence: fc.integer({ min: 1, max: 99 }),
      text: fc.string({ minLength: 1, maxLength: 30 }),
      options: fc.constant([] as Array<never>),
    }),
    { minLength: 0, maxLength: 20 },
  ),
}).filter(q => q.name !== q.description && q.name !== q.id)

it('Feature: ai-assessment-assistant, Property 2: questionnaire card render completeness', () => {
  fc.assert(
    fc.property(questionnaireArb, (questionnaire) => {
      cleanup()
      render(
        <QuestionnaireCard questionnaire={questionnaire} onStart={() => {}} />,
      )

      // Must contain the questionnaire name
      expect(screen.getByText(questionnaire.name)).toBeInTheDocument()

      // Must contain the description
      expect(screen.getByText(questionnaire.description)).toBeInTheDocument()

      // Must contain a start button
      const button = screen.getByRole('button', { name: /开始/ })
      expect(button).toBeInTheDocument()
    }),
    { numRuns: 100 },
  )
})
