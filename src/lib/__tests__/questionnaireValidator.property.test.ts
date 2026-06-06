// Feature: ai-assessment-assistant, Property 13: questionnaire validator correctly discriminates valid vs invalid configs

import fc from 'fast-check'
import { validateQuestionnaire } from '../questionnaireValidator'

const VALID_CATEGORIES = ['personality', 'temperament', 'mbti', 'leadership', 'career'] as const
const VALID_RULE_TYPES = ['additive', 'categorical'] as const

/** Generate a fully valid questionnaire-like object */
const validQuestionnaireArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  name: fc.string({ minLength: 1, maxLength: 10 }).map(s => s.padEnd(3, 'X').slice(0, 50)),
  category: fc.constantFrom(...VALID_CATEGORIES),
  description: fc.string({ minLength: 1, maxLength: 20 }).map(s => s.padEnd(5, 'X').slice(0, 100)),
  enabled: fc.boolean(),
  createdAt: fc.string({ minLength: 1, maxLength: 30 }),
  questions: fc.array(
    fc.record({
      id: fc.string({ minLength: 1, maxLength: 10 }),
      sequence: fc.integer({ min: 1, max: 100 }),
      text: fc.string({ minLength: 1, maxLength: 50 }),
      options: fc.array(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 10 }),
          text: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        { minLength: 2, maxLength: 5 },
      ),
    }),
    { minLength: 1, maxLength: 5 },
  ),
  scoring_rule: fc.record({
    type: fc.constantFrom(...VALID_RULE_TYPES),
    dimensions: fc.option(
      fc.array(
        fc.record({
          key: fc.string({ minLength: 1, maxLength: 10 }),
          name: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        { minLength: 1, maxLength: 5 },
      ),
      { nil: undefined },
    ),
    categories: fc.option(
      fc.array(
        fc.record({
          key: fc.string({ minLength: 1, maxLength: 5 }),
          name: fc.string({ minLength: 1, maxLength: 10 }),
        }),
        { minLength: 1, maxLength: 4 },
      ),
      { nil: undefined },
    ),
  }),
})

it('Feature: ai-assessment-assistant, Property 13: valid configurations pass validation', () => {
  fc.assert(
    fc.property(validQuestionnaireArb, (obj) => {
      const result = validateQuestionnaire(obj)
      expect(result).not.toBeNull()
      if (result) {
        expect(result.id).toBe(obj.id)
        expect(result.name).toBe(obj.name)
        expect(result.questions.length).toBe(obj.questions.length)
      }
    }),
    { numRuns: 100 },
  )
})

it('Feature: ai-assessment-assistant, Property 13: missing id returns null', () => {
  fc.assert(
    fc.property(validQuestionnaireArb, (obj) => {
      const { id, ...withoutId } = obj
      const result = validateQuestionnaire(withoutId)
      expect(result).toBeNull()
    }),
    { numRuns: 50 },
  )
})

it('Feature: ai-assessment-assistant, Property 13: missing name returns null', () => {
  fc.assert(
    fc.property(validQuestionnaireArb, (obj) => {
      const { name, ...withoutName } = obj
      const result = validateQuestionnaire(withoutName)
      expect(result).toBeNull()
    }),
    { numRuns: 50 },
  )
})

it('Feature: ai-assessment-assistant, Property 13: empty questions array returns null', () => {
  fc.assert(
    fc.property(validQuestionnaireArb, (obj) => {
      const invalid = { ...obj, questions: [] }
      const result = validateQuestionnaire(invalid)
      expect(result).toBeNull()
    }),
    { numRuns: 50 },
  )
})

it('Feature: ai-assessment-assistant, Property 13: invalid category returns null', () => {
  fc.assert(
    fc.property(validQuestionnaireArb, (obj) => {
      const invalid = { ...obj, category: 'invalid-category' }
      const result = validateQuestionnaire(invalid)
      expect(result).toBeNull()
    }),
    { numRuns: 50 },
  )
})

it('Feature: ai-assessment-assistant, Property 13: missing scoring_rule returns null', () => {
  fc.assert(
    fc.property(validQuestionnaireArb, (obj) => {
      const { scoring_rule, ...withoutRule } = obj
      const result = validateQuestionnaire(withoutRule)
      expect(result).toBeNull()
    }),
    { numRuns: 50 },
  )
})
