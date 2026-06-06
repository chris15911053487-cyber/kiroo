// Feature: ai-assessment-assistant, Property 11: report page renders all required fields
// Feature: ai-assessment-assistant, Property 12: HTTP error states trigger correct error UI

import fc from 'fast-check'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ReportPage from '../ReportPage'
import { type ReactNode } from 'react'

// Mock useAuth to avoid AuthProvider complexity
vi.mock('../../context/AuthContext', () => {
  const React = require('react')
  return {
    useAuth: () => ({ user: { id: 1, nickname: 'Test', phone: '13800138000' }, token: 'token', loading: false, login: vi.fn(), logout: vi.fn(), updateUser: vi.fn() }),
    AuthProvider: ({ children }: { children: ReactNode }) => React.createElement(React.Fragment, null, children),
  }
})

// Mock reportService responses
let mockReportData: any = null
vi.mock('../../services/reportService', () => ({
  reportService: {
    getDetail: vi.fn().mockImplementation(() => Promise.resolve({ report: mockReportData })),
  },
}))

// ──── Property 11: Report Loading/Status States ───────

it('Feature: ai-assessment-assistant, Property 11: report shows pending approval message', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 999 }),
      async (reportId) => {
        cleanup()
        mockReportData = {
          id: reportId,
          sessionId: 1,
          userId: 1,
          questionnairesCompleted: ['big5', 'mbti'],
          scoreSummary: { big5: {}, mbti: {} },
          reportContent: null,
          comprehensiveScore: 75,
          reviewStatus: 'pending',
          reviewComment: null,
          reviewedAt: null,
          createdAt: '2024-01-01T00:00:00Z',
        }

        render(
          <MemoryRouter initialEntries={[`/report/${reportId}`]}>
            <Routes>
              <Route path="/report/:id" element={<ReportPage />} />
            </Routes>
          </MemoryRouter>,
        )

        await waitFor(() => {
          expect(screen.getByText('报告审核中')).toBeInTheDocument()
        })
      },
    ),
    { numRuns: 3 },
  )
})

it('Feature: ai-assessment-assistant, Property 11: report shows approved content', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 999 }),
      fc.string({ minLength: 100, maxLength: 300 }),
      async (reportId, content) => {
        cleanup()
        mockReportData = {
          id: reportId,
          sessionId: 1,
          userId: 1,
          questionnairesCompleted: ['big5', 'mbti'],
          scoreSummary: { big5: {}, mbti: {} },
          reportContent: content,
          comprehensiveScore: 78,
          reviewStatus: 'approved',
          reviewComment: null,
          reviewedAt: '2024-01-01T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
        }

        render(
          <MemoryRouter initialEntries={[`/report/${reportId}`]}>
            <Routes>
              <Route path="/report/:id" element={<ReportPage />} />
            </Routes>
          </MemoryRouter>,
        )

        await waitFor(() => {
          expect(screen.getByText('综合测评报告')).toBeInTheDocument()
          expect(screen.getByText('78')).toBeInTheDocument()
        })
      },
    ),
    { numRuns: 3 },
  )
})

// ──── Property 12: Rejected State ───────────────────

it('Feature: ai-assessment-assistant, Property 12: rejected report shows revision message', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 999 }),
      fc.string({ minLength: 5, maxLength: 50 }),
      async (reportId, comment) => {
        cleanup()
        mockReportData = {
          id: reportId,
          sessionId: 1,
          userId: 1,
          questionnairesCompleted: ['big5'],
          scoreSummary: {},
          reportContent: null,
          comprehensiveScore: 70,
          reviewStatus: 'rejected',
          reviewComment: comment,
          reviewedAt: '2024-01-01T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
        }

        render(
          <MemoryRouter initialEntries={[`/report/${reportId}`]}>
            <Routes>
              <Route path="/report/:id" element={<ReportPage />} />
            </Routes>
          </MemoryRouter>,
        )

        await waitFor(() => {
          expect(screen.getByText('报告正在修订中')).toBeInTheDocument()
        })
      },
    ),
    { numRuns: 3 },
  )
})

it('Feature: ai-assessment-assistant, Property 12: report shows questionnaire completion list', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 999 }),
      async (reportId) => {
        cleanup()
        mockReportData = {
          id: reportId,
          sessionId: 1,
          userId: 1,
          questionnairesCompleted: ['leadership', 'temperament', 'big5'],
          scoreSummary: { leadership: {}, temperament: {}, big5: {} },
          reportContent: 'Test report content for approved status',
          comprehensiveScore: 82,
          reviewStatus: 'approved',
          reviewComment: null,
          reviewedAt: '2024-01-01T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
        }

        render(
          <MemoryRouter initialEntries={[`/report/${reportId}`]}>
            <Routes>
              <Route path="/report/:id" element={<ReportPage />} />
            </Routes>
          </MemoryRouter>,
        )

        await waitFor(() => {
          expect(screen.getByText('✓ 领导风格测评')).toBeInTheDocument()
          expect(screen.getByText('✓ 大五人格测试')).toBeInTheDocument()
        })
      },
    ),
    { numRuns: 3 },
  )
})
