// Feature: ai-assessment-assistant, Property 7: additive scoring correctness
// Feature: ai-assessment-assistant, Property 8: categorical scoring with tie-breaking
// Feature: ai-assessment-assistant, Property 9: incomplete answers rejection

import fc from 'fast-check'
import { compute } from '../scoringEngine'
import type { Questionnaire, Question, Option, ScoringRule } from '../../types'

// ──── Property 7: Additive Scoring Correctness ──────────────

/**
 * Generate a random additive questionnaire with random answers.
 * We use a fixed set of 3 dimensions (d0, d1, d2) and vary the scores
 * per option to keep the generation simple and deterministic.
 */
it('Feature: ai-assessment-assistant, Property 7: additive scoring correctness', () => {
  fc.assert(
    fc.property(
      // Number of questions
      fc.integer({ min: 3, max: 10 }),
      // Number of options per question
      fc.integer({ min: 2, max: 5 }),
      // Score values for d0, d1, d2 per option per question (flattened)
      fc.array(
        fc.array(
          fc.record({
            d0: fc.integer({ min: 0, max: 5 }),
            d1: fc.integer({ min: 0, max: 5 }),
            d2: fc.integer({ min: 0, max: 5 }),
          }),
          { minLength: 2, maxLength: 5 },
        ),
        { minLength: 3, maxLength: 10 },
      ),
      (numQuestions, numOptions, optionScoresList) => {
        // Build questionnaire
        const actualNumQuestions = Math.min(numQuestions, optionScoresList.length)
        const questions: Question[] = []
        for (let qi = 0; qi < actualNumQuestions; qi++) {
          const opts: Option[] = optionScoresList[qi].slice(0, numOptions).map((scores, oi) => ({
            id: `q${qi + 1}-opt${oi}`,
            text: `Option ${oi}`,
            scores: { d0: scores.d0, d1: scores.d1, d2: scores.d2 },
          }))
          questions.push({
            id: `q${qi + 1}`,
            sequence: qi + 1,
            text: `Question ${qi + 1}`,
            options: opts,
          })
        }

        const scoringRule: ScoringRule = {
          type: 'additive',
          dimensions: [
            { key: 'd0', name: 'Dimension 0', min: 0, max: 100 },
            { key: 'd1', name: 'Dimension 1', min: 0, max: 100 },
            { key: 'd2', name: 'Dimension 2', min: 0, max: 100 },
          ],
        }

        const questionnaire: Questionnaire = {
          id: 'test-additive',
          name: 'Test Additive',
          category: 'personality',
          description: 'Test',
          enabled: true,
          createdAt: '2024-01-01T00:00:00Z',
          questions,
          scoring_rule: scoringRule,
        }

        // Build answers: pick the first option for each question
        const answers: Record<string, string> = {}
        for (const q of questions) {
          answers[q.id] = q.options[0].id
        }

        const result = compute(answers, questionnaire)

        if ('message' in result) {
          throw new Error(`Unexpected error: ${result.message}`)
        }

        expect(result.type).toBe('additive')

        // Verify each dimension score
        for (const dim of scoringRule.dimensions!) {
          let expected = 0
          for (const q of questions) {
            const selected = q.options.find(o => o.id === answers[q.id])
            expected += selected?.scores?.[dim.key] ?? 0
          }
          expect(result.dimensionScores![dim.key]).toBe(expected)
        }
      },
    ),
    { numRuns: 100 },
  )
})

// ──── Property 8: Categorical Scoring with Tie-breaking ─────

it('Feature: ai-assessment-assistant, Property 8: categorical scoring with tie-breaking', () => {
  fc.assert(
    fc.property(
      // Generate option categories per question
      fc.array(
        fc.array(fc.constantFrom('A', 'B', 'C', 'D'), { minLength: 2, maxLength: 4 }),
        { minLength: 3, maxLength: 10 },
      ),
      // Index of selected option per question
      fc.array(fc.integer({ min: 0, max: 3 }), { minLength: 3, maxLength: 10 }),
      (questionCategories, selectedIndices) => {
        const numQuestions = Math.min(questionCategories.length, selectedIndices.length)

        const questions: Question[] = []
        for (let qi = 0; qi < numQuestions; qi++) {
          const cats = questionCategories[qi]
          const opts: Option[] = cats.map((cat, oi) => ({
            id: `q${qi + 1}-opt${oi}`,
            text: `Option ${oi}`,
            category: cat,
          }))
          questions.push({
            id: `q${qi + 1}`,
            sequence: qi + 1,
            text: `Question ${qi + 1}`,
            options: opts,
          })
        }

        // Use distinct unique categories from the data
        const allCats = [...new Set(questionCategories.flat())]
        const scoringRule: ScoringRule = {
          type: 'categorical',
          categories: allCats.map(c => ({ key: c, name: `Category ${c}` })),
        }

        const questionnaire: Questionnaire = {
          id: 'test-categorical',
          name: 'Test Categorical',
          category: 'temperament',
          description: 'Test',
          enabled: true,
          createdAt: '2024-01-01T00:00:00Z',
          questions,
          scoring_rule: scoringRule,
        }

        // Build answers
        const answers: Record<string, string> = {}
        for (let qi = 0; qi < numQuestions; qi++) {
          const idx = selectedIndices[qi] % questions[qi].options.length
          answers[questions[qi].id] = questions[qi].options[idx].id
        }

        const result = compute(answers, questionnaire)

        if ('message' in result) {
          throw new Error(`Unexpected error: ${result.message}`)
        }

        expect(result.type).toBe('categorical')
        expect(result.categoryResult).toBeDefined()

        // Compute expected frequencies
        const freqs: Record<string, number> = {}
        for (const q of questions) {
          const sel = q.options.find(o => o.id === answers[q.id])
          if (sel?.category) {
            freqs[sel.category] = (freqs[sel.category] ?? 0) + 1
          }
        }

        const maxFreq = Math.max(0, ...Object.values(freqs))
        const expected = allCats
          .filter(c => (freqs[c] ?? 0) === maxFreq)
          .sort((a, b) => allCats.indexOf(a) - allCats.indexOf(b))[0]

        if (expected) {
          expect(result.categoryResult).toBe(expected)
        }
      },
    ),
    { numRuns: 100 },
  )
})

// ──── Property 9: Incomplete Answers Rejection ──────────────

it('Feature: ai-assessment-assistant, Property 9: incomplete answers rejection', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 3, max: 10 }),
      fc.integer({ min: 1, max: 3 }), // number of questions to skip
      (numQuestions, skipCount) => {
        const actualSkip = Math.min(skipCount, numQuestions - 1)
        if (actualSkip <= 0) return

        // Build a simple additive questionnaire
        const questions: Question[] = []
        for (let qi = 0; qi < numQuestions; qi++) {
          questions.push({
            id: `q${qi + 1}`,
            sequence: qi + 1,
            text: `Question ${qi + 1}`,
            options: [
              { id: `q${qi + 1}-a`, text: 'A', scores: { d0: 1 } },
              { id: `q${qi + 1}-b`, text: 'B', scores: { d0: 0 } },
            ],
          })
        }

        const questionnaire: Questionnaire = {
          id: 'test-additive',
          name: 'Test',
          category: 'personality',
          description: 'Test',
          enabled: true,
          createdAt: '2024-01-01T00:00:00Z',
          questions,
          scoring_rule: { type: 'additive', dimensions: [{ key: 'd0', name: 'D0' }] },
        }

        // Answer only some questions (skip the last `actualSkip` questions)
        const answers: Record<string, string> = {}
        const answeredCount = numQuestions - actualSkip
        for (let qi = 0; qi < answeredCount; qi++) {
          answers[questions[qi].id] = questions[qi].options[0].id
        }

        const result = compute(answers, questionnaire)

        expect('message' in result).toBe(true)
        if ('message' in result) {
          expect(result.message).toContain('存在未完成题目')
        }
      },
    ),
    { numRuns: 100 },
  )
})
