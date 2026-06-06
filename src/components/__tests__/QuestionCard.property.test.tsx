// Feature: ai-assessment-assistant, Property 3: question card render completeness
// Feature: ai-assessment-assistant, Property 4: option selection state consistency

import fc from 'fast-check'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import QuestionCard from '../QuestionCard'
import type { Question } from '../../types'

function textArb(min: number, max: number): fc.Arbitrary<string> {
  return fc.stringOf(
    fc.char().filter(c => /[a-zA-Z0-9一-鿿]/.test(c)),
    { minLength: min, maxLength: max },
  ).filter(s => s.trim().length >= min)
}

const questionArb: fc.Arbitrary<Question> = fc.record({
  id: fc.hexaString({ minLength: 3, maxLength: 8 }),
  sequence: fc.integer({ min: 2, max: 99 }),
  text: textArb(3, 80),
  options: fc
    .array(
      fc.record({
        id: fc.hexaString({ minLength: 1, maxLength: 8 }),
        text: textArb(2, 30),
      }),
      { minLength: 2, maxLength: 6 },
    )
    .map(opts => {
      const seen = new Set<string>()
      return opts
        .filter(o => {
          if (seen.has(o.text)) return false
          seen.add(o.text)
          return true
        })
        .map((o, i) => ({ ...o, id: `opt-${i}` }))
    })
    .filter(opts => opts.length >= 2),
})

// ──── Property 3: Question Card Renders All Options ─────────

it('Feature: ai-assessment-assistant, Property 3: question card renders all options with radio indicators', () => {
  fc.assert(
    fc.property(questionArb, (question) => {
      cleanup()
      render(
        <QuestionCard
          question={question}
          selectedOptionId={null}
          onSelect={() => {}}
        />,
      )

      // Must contain all option texts as buttons
      for (const option of question.options) {
        const btn = screen.getByRole('button', { name: option.text })
        expect(btn).toBeInTheDocument()
        // Each option should have aria-pressed (false when not selected)
        expect(btn.getAttribute('aria-pressed')).toBe('false')
      }
    }),
    { numRuns: 100 },
  )
})

// ──── Property 4: Option Selection State Consistency ────────

it('Feature: ai-assessment-assistant, Property 4: selected option has visual distinction', () => {
  fc.assert(
    fc.property(
      questionArb,
      fc.nat({ max: 99 }),
      (question, optIdx) => {
        cleanup()
        const selectedIdx = optIdx % question.options.length
        const selectedId = question.options[selectedIdx].id

        render(
          <QuestionCard
            question={question}
            selectedOptionId={selectedId}
            onSelect={() => {}}
          />,
        )

        // (a) Selected option must have aria-pressed="true"
        const selectedBtn = screen.getByRole('button', { name: question.options[selectedIdx].text })
        expect(selectedBtn.getAttribute('aria-pressed')).toBe('true')

        // (b) All other options must have aria-pressed="false"
        for (let i = 0; i < question.options.length; i++) {
          if (i === selectedIdx) continue
          const otherBtn = screen.getByRole('button', { name: question.options[i].text })
          expect(otherBtn.getAttribute('aria-pressed')).toBe('false')
        }
      },
    ),
    { numRuns: 100 },
  )
})

it('Feature: ai-assessment-assistant, Property 4: onSelect called with correct option id', () => {
  fc.assert(
    fc.property(
      questionArb,
      fc.nat({ max: 99 }),
      (question, optIdx) => {
        cleanup()
        const clickedIdx = optIdx % question.options.length
        const clickedId = question.options[clickedIdx].id
        const onSelect = vi.fn()

        render(
          <QuestionCard
            question={question}
            selectedOptionId={null}
            onSelect={onSelect}
          />,
        )

        fireEvent.click(screen.getByRole('button', { name: question.options[clickedIdx].text }))

        // (c) onSelect must have been called with the correct option id
        expect(onSelect).toHaveBeenCalledWith(clickedId)
      },
    ),
    { numRuns: 100 },
  )
})
