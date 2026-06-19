import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAssessment } from '../context/AssessmentContext'
import { useAuth } from '../context/AuthContext'
import { sessionService, type SessionData } from '../services/sessionService'
import QuestionCard from '../components/QuestionCard'
import { compute } from '../lib/scoringEngine'
import { IS_LZU_MODE } from '../types'
import type { Questionnaire } from '../types'

export default function QuizPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { state, dispatch } = useAssessment()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showNoAnswerWarning, setShowNoAnswerWarning] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 加载session和当前问卷
  useEffect(() => {
    if (!sessionId || !user) {
      navigate(IS_LZU_MODE ? '/' : '/select', { replace: true })
      return
    }

    sessionService.getById(Number(sessionId))
      .then(data => {
        if (!data.session || (data.session.status !== 'in_progress' && data.session.status !== 'completed')) {
          navigate(IS_LZU_MODE ? '/' : '/select', { replace: true })
          return
        }
        // 已完成答题但未提交，直接跳转提交
        if (data.session.status === 'completed') {
          navigate(`/quiz/${data.session.id}/transition`, { replace: true })
          return
        }
        setSession(data.session)
        dispatch({ type: 'SET_SESSION', payload: data.session as any })

        // 加载当前问卷到context
        const currentQId = data.session.orderedQuestionnaires[data.session.currentIndex]
        if (currentQId) {
          const q = state.questionnaires.find(qq => qq.id === currentQId)
          if (q) {
            dispatch({ type: 'START_ASSESSMENT', payload: q })
          }
        }
      })
      .catch(() => navigate(IS_LZU_MODE ? '/' : '/select', { replace: true }))
      .finally(() => setLoading(false))
  }, [sessionId, user, navigate, dispatch, state.questionnaires])

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <p className="text-gray-400">加载中…</p>
      </div>
    )
  }

  const orderedQIds = session.orderedQuestionnaires
  const sessionCurrentIdx = session.currentIndex
  const currentQId = orderedQIds[sessionCurrentIdx]
  const currentQuestionnaire: Questionnaire | undefined = state.questionnaires.find(
    q => q.id === currentQId
  )

  if (!currentQuestionnaire) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-red-500">问卷数据未找到：{currentQId}</p>
        <button
          onClick={() => navigate(IS_LZU_MODE ? '/' : '/select')}
          className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold"
        >
          {IS_LZU_MODE ? '返回首页' : '返回选择页'}
        </button>
      </div>
    )
  }

  const questions = currentQuestionnaire.questions
  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex]
  const selectedOptionId = state.answers[currentQuestion.id] ?? null
  const isLastQuestion = currentIndex === totalQuestions - 1
  const progressPct = ((currentIndex + 1) / totalQuestions) * 100

  async function handleSelectOption(optionId: string) {
    // 如果已经选中同一个选项，不重复操作
    if (selectedOptionId === optionId && !isLastQuestion) {
      setCurrentIndex(prev => prev + 1)
      return
    }

    dispatch({
      type: 'SET_ANSWER',
      payload: { questionId: currentQuestion.id, optionId },
    })
    setShowNoAnswerWarning(false)

    // 最后一题只记录答案，不自动提交，等待用户点击
    if (isLastQuestion) {
      return
    }
    // 非最后一题自动进入下一题
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
    }, 200)
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setShowNoAnswerWarning(false)
    }
  }

  function handleNext() {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1)
      setShowNoAnswerWarning(false)
    }
  }

  async function handleSubmit() {
    if (!selectedOptionId) {
      setShowNoAnswerWarning(true)
      return
    }

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      // 确保最新答案被提交
      const latestAnswers = { ...state.answers, [currentQuestion.id]: selectedOptionId }
      const result = compute(latestAnswers, currentQuestionnaire!)

      if ('message' in result) {
        setSubmitError(result.message)
        setIsSubmitting(false)
        return
      }

      dispatch({ type: 'SET_SCORE_RESULT', payload: result })
      dispatch({
        type: 'ADD_COMPLETED_SCORE',
        payload: { questionnaireId: currentQId, scoreResult: result },
      })

      // 保存答案到后端
      await sessionService.saveAnswers(session!.id, {
        questionnaireId: currentQId,
        questionnaireName: currentQuestionnaire!.name,
        answers: latestAnswers,
        scoreResult: result as unknown as Record<string, unknown>,
      })

      // 跳转到过渡页
      navigate(`/quiz/${session!.id}/transition`, { replace: true })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '保存失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const remainingQuestions = totalQuestions - currentIndex - 1
  const estimatedMinutes = Math.ceil(remainingQuestions * 0.25)

  return (
    <div className="bg-[#fafafa] min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-black/[0.04]">
        <div className="flex items-center gap-3 px-6 h-14 max-w-xl mx-auto">
          <button
            onClick={() => navigate(IS_LZU_MODE ? '/' : '/select')}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium shrink-0"
          >
            ← 退出
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-[#1a1a2e] truncate">
              {currentQuestionnaire.name}
            </h1>
            <p className="text-[10px] text-gray-400">
              第 {sessionCurrentIdx + 1}/{orderedQIds.length} 个问卷
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 h-1.5">
          <div
            className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Progress text */}
        <div className="flex items-center justify-between px-6 py-2 max-w-xl mx-auto">
          <span className="text-xs font-bold text-indigo-600">
            {currentIndex + 1} / {totalQuestions}
          </span>
          {remainingQuestions > 0 && (
            <span className="text-[10px] text-gray-400">
              预计还需 {estimatedMinutes} 分钟
            </span>
          )}
        </div>
      </header>

      {/* Question area */}
      <main className="flex-1 px-6 py-6 max-w-xl mx-auto w-full pb-28 md:pb-6">
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wide mb-2">
            问题 {currentIndex + 1}
          </p>
          <h2 className="text-lg md:text-xl font-bold text-[#1a1a2e] leading-snug">
            {currentQuestion.text}
          </h2>
        </div>

        <QuestionCard
          question={currentQuestion}
          selectedOptionId={selectedOptionId}
          onSelect={handleSelectOption}
        />

        {showNoAnswerWarning && (
          <p className="mt-4 text-center text-sm text-red-500 font-medium">
            请先完成当前题目
          </p>
        )}

        {submitError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
            {submitError}
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 md:relative bg-gradient-to-t from-[#fafafa] via-[#fafafa] to-transparent pt-6 pb-6 md:pb-0 px-6 z-30">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          {currentIndex > 0 ? (
            <button
              onClick={handlePrev}
              className="flex-1 py-3.5 px-4 rounded-2xl border-2 border-black/[0.06] bg-white text-[#1a1a2e] font-semibold text-sm hover:border-indigo-200 hover:text-indigo-600 transition-all duration-150"
            >
              ← 上一题
            </button>
          ) : (
            <div className="flex-1" />
          )}

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedOptionId}
              className="flex-[2] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold text-sm shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-all duration-150 disabled:opacity-50"
            >
              {isSubmitting ? '正在生成报告…' : '提交答卷'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 py-3.5 px-4 rounded-2xl border-2 border-indigo-200 bg-white text-indigo-600 font-semibold text-sm hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-150"
            >
              下一题 →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
