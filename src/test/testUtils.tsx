import { type ReactNode, useLayoutEffect } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AssessmentProvider, useAssessment } from '../context/AssessmentContext'
import type { Questionnaire } from '../types'

/**
 * Helper component that sets initial state in the AssessmentContext.
 * Both dispatches happen in a single useEffect to avoid race conditions
 * where QuizPage's route guard fires before state is initialized.
 */
function StateInitializer({
  questionnaires,
  currentQuestionnaire,
}: {
  questionnaires?: Questionnaire[]
  currentQuestionnaire?: Questionnaire
}) {
  const { dispatch } = useAssessment()

  useLayoutEffect(() => {
    if (questionnaires && questionnaires.length > 0) {
      dispatch({ type: 'SET_QUESTIONNAIRES', payload: questionnaires })
    }
    if (currentQuestionnaire) {
      dispatch({ type: 'START_ASSESSMENT', payload: currentQuestionnaire })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

/**
 * Renders children inside AssessmentProvider + MemoryRouter.
 * Optionally pre-loads questionnaires and/or currentQuestionnaire into state.
 */
export function TestWrapper({
  children,
  questionnaires,
  currentQuestionnaire,
  initialRoute = '/',
}: {
  children: ReactNode
  questionnaires?: Questionnaire[]
  currentQuestionnaire?: Questionnaire
  initialRoute?: string
}) {
  return (
    <AssessmentProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <StateInitializer
          questionnaires={questionnaires}
          currentQuestionnaire={currentQuestionnaire}
        />
        {children}
      </MemoryRouter>
    </AssessmentProvider>
  )
}
