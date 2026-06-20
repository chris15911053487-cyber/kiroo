import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { sessionService, type SessionData } from '../services/sessionService'
import { QUESTIONNAIRE_PRIORITY, LZU_QUESTIONNAIRE_PRIORITY, IS_LZU_MODE } from '../types'

/** 兰大测评序数词映射 */
const LZU_ORDINAL: Record<number, string> = {
  1: '一',
  2: '二',
  3: '三',
}

export default function TransitionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      navigate('/select', { replace: true })
      return
    }

    sessionService.getById(Number(sessionId))
      .then(data => {
        setSession(data.session)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : '获取会话信息失败')
      })
      .finally(() => setLoading(false))
  }, [sessionId, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <p className="text-gray-400">加载中…</p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-red-500">{error || '会话不存在'}</p>
        <button
          onClick={() => navigate(IS_LZU_MODE ? '/' : '/select', { replace: true })}
          className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold"
        >
          {IS_LZU_MODE ? '返回首页' : '返回选择页'}
        </button>
      </div>
    )
  }

  const priorityList = IS_LZU_MODE ? LZU_QUESTIONNAIRE_PRIORITY : QUESTIONNAIRE_PRIORITY

  const currentIndex = session.currentIndex
  const totalQuestionnaires = session.orderedQuestionnaires.length
  const isFinished = currentIndex >= totalQuestionnaires

  // 当前刚完成的问卷名
  const completedQuestionnaireId = session.orderedQuestionnaires[currentIndex - 1]
  const completedQuestionnaire = priorityList.find(q => q.id === completedQuestionnaireId)

  const nextQuestionnaireId = session.orderedQuestionnaires[currentIndex]
  const nextQuestionnaire = priorityList.find(q => q.id === nextQuestionnaireId)

  function handleContinue() {
    if (isFinished) {
      navigate('/submitted', { state: { sessionId: session!.id } })
    } else {
      navigate(`/quiz/${session!.id}`)
    }
  }

  // ========== 兰大模式专用UI ==========
  if (IS_LZU_MODE) {
    const ordinal = LZU_ORDINAL[currentIndex] || String(currentIndex)

    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-6 pb-20">
        {/* 完成动画 */}
        <div className="mb-8 text-center">
          <div className="text-6xl mb-4 animate-bounce">
            {isFinished ? '🏆' : '🎉'}
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a2e] mb-2">
            {isFinished
              ? '恭喜完成全部测评！'
              : `恭喜完成第${ordinal}项测评！`}
          </h1>
          {completedQuestionnaire && (
            <p className="text-gray-400">
              「{completedQuestionnaire.name}」已完成
            </p>
          )}
        </div>

        {/* 进度展示 */}
        <div className="bg-white border border-black/[0.04] rounded-2xl p-6 w-full max-w-sm shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">整体进度</span>
            <span className="text-sm font-bold text-indigo-600">
              {currentIndex}/{totalQuestionnaires}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentIndex / totalQuestionnaires) * 100}%` }}
            />
          </div>

          {/* 进度详情 */}
          <div className="space-y-1.5">
            {session.orderedQuestionnaires.map((qid, idx) => {
              const q = priorityList.find(qq => qq.id === qid)
              const isDone = idx < currentIndex
              const isCurrent = idx === currentIndex

              return (
                <div key={qid} className="flex items-center gap-2 text-sm">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    isDone
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isDone ? '✓' : idx + 1}
                  </span>
                  <span className={`truncate ${
                    isDone ? 'text-green-600' : isCurrent ? 'text-indigo-600 font-medium' : 'text-gray-400'
                  }`}>
                    {q?.name || qid}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 鼓励语 */}
        <p className="text-center text-gray-400 text-sm mb-8 max-w-xs">
          {isFinished
            ? '所有测评已完成！请提交审核，专家团队将为您把关报告质量。'
            : nextQuestionnaire
            ? `接下来是「${nextQuestionnaire.name}」，请保持耐心，认真作答 ✨`
            : '继续保持，你的每一份回答都在描绘更清晰的潜能星图 ✨'}
        </p>

        {/* 继续按钮 */}
        <button
          onClick={handleContinue}
          className="w-full max-w-sm py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold text-base shadow-[0_4px_20px_rgba(99,102,241,0.3)] transition-all duration-200"
        >
          {isFinished
            ? '提交审核'
            : nextQuestionnaire
            ? `继续第${LZU_ORDINAL[currentIndex + 1] || String(currentIndex + 1)}项测评：${nextQuestionnaire.name} →`
            : '继续'}
        </button>
      </div>
    )
  }

  // ========== 通用模式UI ==========
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-6 pb-20">
      {/* 完成动画 */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h1 className="text-2xl font-bold text-[#1a1a2e] mb-2">
          恭喜完成第 {currentIndex} 个测评！
        </h1>
        {completedQuestionnaire && (
          <p className="text-gray-400">
            「{completedQuestionnaire.name}」已完成
          </p>
        )}
      </div>

      {/* 进度展示 */}
      <div className="bg-white border border-black/[0.04] rounded-2xl p-6 w-full max-w-sm shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">整体进度</span>
          <span className="text-sm font-bold text-indigo-600">
            {currentIndex}/{totalQuestionnaires}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div
            className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentIndex / totalQuestionnaires) * 100}%` }}
          />
        </div>

        {/* 进度详情 */}
        <div className="space-y-1.5">
          {session.orderedQuestionnaires.map((qid, idx) => {
            const q = QUESTIONNAIRE_PRIORITY.find(qq => qq.id === qid)
            const isDone = idx < currentIndex
            const isCurrent = idx === currentIndex

            return (
              <div key={qid} className="flex items-center gap-2 text-sm">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  isDone
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {isDone ? '✓' : idx + 1}
                </span>
                <span className={`truncate ${
                  isDone ? 'text-green-600' : isCurrent ? 'text-indigo-600 font-medium' : 'text-gray-400'
                }`}>
                  {q?.name || qid}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 鼓励语 */}
      <p className="text-center text-gray-400 text-sm mb-8 max-w-xs">
        {isFinished
          ? '所有测评已完成！'
          : '继续保持，你的每一份回答都在描绘更清晰的潜能星图 ✨'
        }
      </p>

      {/* 继续按钮 */}
      <button
        onClick={handleContinue}
        className="w-full max-w-sm py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold text-base shadow-[0_4px_20px_rgba(99,102,241,0.3)] transition-all duration-200"
      >
        {isFinished ? '提交生成报告' : nextQuestionnaire ? `继续下一个：${nextQuestionnaire.name} →` : '继续'}
      </button>
    </div>
  )
}
