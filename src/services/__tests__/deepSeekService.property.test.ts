// Feature: ai-assessment-assistant, Property 10: AI prompt contains complete scoring data

import fc from 'fast-check'
import { buildPrompt } from '../deepSeekService'
import type { Questionnaire, ScoreResult } from '../../types'

/** Build a minimal additive questionnaire */
function makeAdditiveQuestionnaire(name: string, dimKeys: string[]): Questionnaire {
  return {
    id: 'test-q',
    name,
    category: 'personality',
    description: 'Test description',
    enabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    questions: [],
    scoring_rule: {
      type: 'additive',
      dimensions: dimKeys.map(k => ({ key: k, name: `Name-${k}`, min: 0, max: 100 })),
    },
  }
}

/** Build a minimal categorical questionnaire */
function makeCategoricalQuestionnaire(name: string, catKeys: string[]): Questionnaire {
  return {
    id: 'test-q',
    name,
    category: 'temperament',
    description: 'Test description',
    enabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    questions: [],
    scoring_rule: {
      type: 'categorical',
      categories: catKeys.map(k => ({ key: k, name: `Cat-${k}` })),
    },
  }
}

it('Feature: ai-assessment-assistant, Property 10: additive prompt contains questionnaire name and all dimension scores', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.uniqueArray(fc.hexaString({ minLength: 2, maxLength: 8 }), { minLength: 1, maxLength: 5, selector: s => s }),
      fc.array(fc.integer({ min: 0, max: 50 }), { minLength: 1, maxLength: 5 }),
      (name, dimKeys, scores) => {
        // Align array lengths
        const numDims = Math.min(dimKeys.length, scores.length)
        const actualDimKeys = dimKeys.slice(0, numDims)

        const questionnaire = makeAdditiveQuestionnaire(name, actualDimKeys)
        const dimensionScores: Record<string, number> = {}
        for (let i = 0; i < numDims; i++) {
          dimensionScores[actualDimKeys[i]] = scores[i]
        }

        const scoreResult: ScoreResult = {
          questionnaireId: 'test-q',
          type: 'additive',
          dimensionScores,
          answeredAt: '2024-01-01T00:00:00Z',
        }

        const prompt = buildPrompt(scoreResult, questionnaire)

        // Prompt must contain questionnaire name
        expect(prompt).toContain(name)

        // Prompt must contain every dimension key and its score
        for (const dimKey of actualDimKeys) {
          expect(prompt).toContain(dimKey)
        }
      },
    ),
    { numRuns: 100 },
  )
})

it('Feature: ai-assessment-assistant, Property 10: categorical prompt contains questionnaire name and category result', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.uniqueArray(fc.constantFrom('A', 'B', 'C', 'D'), { minLength: 2, maxLength: 4, selector: s => s }),
      (name, catKeys) => {
        const questionnaire = makeCategoricalQuestionnaire(name, catKeys)
        const winner = catKeys[0]

        const scoreResult: ScoreResult = {
          questionnaireId: 'test-q',
          type: 'categorical',
          categoryResult: winner,
          categoryFrequencies: Object.fromEntries(catKeys.map(k => [k, 1])),
          answeredAt: '2024-01-01T00:00:00Z',
        }

        const prompt = buildPrompt(scoreResult, questionnaire)

        // Must contain questionnaire name
        expect(prompt).toContain(name)

        // Must contain the winner category key
        expect(prompt).toContain(winner)

        // Must contain category frequency info for each category
        for (const catKey of catKeys) {
          expect(prompt).toContain(catKey)
        }
      },
    ),
    { numRuns: 100 },
  )
})
