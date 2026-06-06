// Feature: ai-assessment-assistant, Property 5: progress indicator numerical accuracy
// Feature: ai-assessment-assistant, Property 6: back navigation preserves existing answers

import fc from 'fast-check'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AssessmentProvider } from '../../context/AssessmentContext'
import QuizPage from '../QuizPage'
import type { Questionnaire, Question, Option } from '../../types'
import { type ReactNode } from 'react'

// Mock auth
vi.mock('../../context/AuthContext', () => {
  const React = require('react')
  return {
    useAuth: () => ({ user: { id: 1, nickname: 'Test', phone: '13800138000' }, token: 'token', loading: false, login: vi.fn(), logout: vi.fn(), updateUser: vi.fn() }),
    AuthProvider: ({ children }: { children: ReactNode }) => React.createElement(React.Fragment, null, children),
  }
})

// Mock sessionService
vi.mock('../../services/sessionService', () => ({
  sessionService: {
    getById: vi.fn().mockResolvedValue({
      session: {
        id: 1,
        selectedQuestionnaires: ['test-quiz'],
        orderedQuestionnaires: ['test-quiz'],
        currentIndex: 0,
        status: 'in_progress',
      },
    }),
    saveAnswers: vi.fn().mockResolvedValue({ currentIndex: 1, status: 'in_progress', totalQuestionnaires: 1, isLastQuestionnaire: true }),
  },
}))

function buildQuestionnaire(numQuestions: number): Questionnaire {
  const questions: Question[] = []
  for (let i = 0; i < numQuestions; i++) {
    const opts: Option[] = [
      { id: `q${i + 1}-a`, text: `OptA-Q${i + 1}` },
      { id: `q${i + 1}-b`, text: `OptB-Q${i + 1}` },
    ]
    questions.push({
      id: `q${i + 1}`,
      sequence: i + 1,
      text: `Q${i + 1}Text`,
      options: opts,
    })
  }

  return {
    id: 'test-quiz',
    name: 'TestQuiz',
    category: 'personality',
    description: 'Test',
    enabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    questions,
    scoring_rule: { type: 'additive', dimensions: [{ key: 'd0', name: 'D0' }] },
  }
}

// ──── Property 5: Progress Indicator ────────────────────────

it('Feature: ai-assessment-assistant, Property 5: progress indicator numerical accuracy', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 2, max: 10 }),
      async (totalQuestions) => {
        cleanup()
        const questionnaire = buildQuestionnaire(totalQuestions)

        render(
          <AssessmentProvider
            __initialState={{
              questionnaires: [questionnaire],
              currentQuestionnaire: questionnaire,
            }}
          >
            <MemoryRouter initialEntries={['/quiz/1']}>
              <Routes>
                <Route path="/quiz/:sessionId" element={<QuizPage />} />
              </Routes>
            </MemoryRouter>
          </AssessmentProvider>,
        )

        await waitFor(() => {
          // Should show progress text like "1 / N"
          expect(screen.getByText(`1 / ${totalQuestions}`)).toBeInTheDocument()
        })
      },
    ),
    { numRuns: 1, endOnFailure: true },
  )
})

// ──── Property 6: Back Navigation Preserves Answers ─────────

it('Feature: ai-assessment-assistant, Property 6: back navigation preserves existing answers', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 3, max: 10 }),
      async (totalQuestions) => {
        cleanup()
        const questionnaire = buildQuestionnaire(totalQuestions)

        render(
          <AssessmentProvider
            __initialState={{
              questionnaires: [questionnaire],
              currentQuestionnaire: questionnaire,
            }}
          >
            <MemoryRouter initialEntries={['/quiz/1']}>
              <Routes>
                <Route path="/quiz/:sessionId" element={<QuizPage />} />
              </Routes>
            </MemoryRouter>
          </AssessmentProvider>,
        )

        await waitFor(() => {
          expect(screen.getByText('Q1Text')).toBeInTheDocument()
        })

        // Step 1: Answer Q1
        fireEvent.click(screen.getByRole('button', { name: 'OptA-Q1' }))

        // Step 2: Next question
        fireEvent.click(screen.getByRole('button', { name: /下一题/ }))
        await waitFor(() => {
          expect(screen.getByText('Q2Text')).toBeInTheDocument()
        })

        // Step 3: Previous question
        fireEvent.click(screen.getByRole('button', { name: /上一题/ }))
        await waitFor(() => {
          expect(screen.getByText('Q1Text')).toBeInTheDocument()
        })

        // Step 4: Answer preserved
        const q1Btn = screen.getByRole('button', { name: 'OptA-Q1' })
        expect(q1Btn.getAttribute('aria-pressed')).toBe('true')
      },
    ),
    { numRuns: 1, endOnFailure: true },
  )
})
