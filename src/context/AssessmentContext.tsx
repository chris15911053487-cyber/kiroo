import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from 'react'
import type {
  AssessmentAction,
  AssessmentState,
} from '../types'

const initialState: AssessmentState = {
  questionnaires: [],
  currentSession: null,
  currentQuestionnaire: null,
  answers: {},
  scoreResult: null,
  allScoreResults: {},
  report: null,
  reportStatus: 'idle',
  reportError: null,
  comprehensiveReport: null,
}

function assessmentReducer(
  state: AssessmentState,
  action: AssessmentAction,
): AssessmentState {
  switch (action.type) {
    case 'SET_QUESTIONNAIRES':
      return {
        ...state,
        questionnaires: action.payload,
      }

    case 'SET_SESSION':
      return {
        ...state,
        currentSession: action.payload,
      }

    case 'START_ASSESSMENT':
      return {
        ...state,
        currentQuestionnaire: action.payload,
        answers: {},
        scoreResult: null,
        report: null,
        reportStatus: 'idle',
        reportError: null,
      }

    case 'SET_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: action.payload.optionId,
        },
      }

    case 'SET_SCORE_RESULT':
      return {
        ...state,
        scoreResult: action.payload,
      }

    case 'ADD_COMPLETED_SCORE':
      return {
        ...state,
        allScoreResults: {
          ...state.allScoreResults,
          [action.payload.questionnaireId]: action.payload.scoreResult,
        },
      }

    case 'SET_ALL_SCORES':
      return {
        ...state,
        allScoreResults: action.payload,
      }

    case 'SET_REPORT_LOADING':
      return {
        ...state,
        reportStatus: 'loading',
        reportError: null,
      }

    case 'SET_REPORT_SUCCESS':
      return {
        ...state,
        report: action.payload,
        reportStatus: 'success',
        reportError: null,
      }

    case 'SET_REPORT_ERROR':
      return {
        ...state,
        reportStatus: 'error',
        reportError: action.payload,
      }

    case 'SET_COMPREHENSIVE_REPORT':
      return {
        ...state,
        comprehensiveReport: action.payload,
      }

    case 'RETRY_REPORT':
      return {
        ...state,
        reportStatus: 'loading',
        reportError: null,
      }

    case 'RESET':
      return {
        ...initialState,
        questionnaires: state.questionnaires,
        currentSession: state.currentSession,
      }

    default:
      return state
  }
}

interface AssessmentContextValue {
  state: AssessmentState
  dispatch: React.Dispatch<AssessmentAction>
}

const AssessmentContext = createContext<AssessmentContextValue | undefined>(undefined)

interface AssessmentProviderProps {
  children: ReactNode
  /** For testing: override initial state */
  __initialState?: Partial<AssessmentState>
}

export function AssessmentProvider({ children, __initialState }: AssessmentProviderProps) {
  const [state, dispatch] = useReducer(
    assessmentReducer,
    __initialState ? { ...initialState, ...__initialState } : initialState,
  )

  return (
    <AssessmentContext.Provider value={{ state, dispatch }}>
      {children}
    </AssessmentContext.Provider>
  )
}

export function useAssessment(): AssessmentContextValue {
  const context = useContext(AssessmentContext)
  if (context === undefined) {
    throw new Error('useAssessment must be used within an AssessmentProvider')
  }
  return context
}
