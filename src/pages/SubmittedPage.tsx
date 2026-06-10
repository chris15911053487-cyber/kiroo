import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { sessionService } from '../services/sessionService'
import { useAssessment } from '../context/AssessmentContext'
import { useAuth } from '../context/AuthContext'
import { IS_LZU_MODE } from '../types'

export default function SubmittedPage() {
  const { dispatch } = useAssessment()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const sessionId = (location.state as { sessionId?: number })?.sessionId

  const [status, setStatus] = useState<'submitting' | 'generating' | 'done' | 'error'>('submitting')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [reportId, setReportId] = useState<number | null>(null)

  useEffect(() => {
    if (!sessionId || !user) {
      navigate(IS_LZU_MODE ? '/' : '/select', { replace: true })
      return
    }

    async function processSubmission() {
      try {
        // 后端submit接口：精准计分 → AI生成标准化报告 → 存入数据库
        setStatus('submitting')
        const submitResult = await sessionService.submit(sessionId!)

        // AI正在生成...
        setStatus('generating')

        // 后端已完成所有处理（含AI生成+模版组装+DOCX）
        if (submitResult.reportId) {
          setReportId(submitResult.reportId)
        }

        dispatch({ type: 'SET_ALL_SCORES', payload: submitResult.scoreSummary as Record<string, any> })
        setStatus('done')
      } catch (err) {
        console.error('Submission error:', err)
        setErrorMsg(err instanceof Error ? err.message : '处理失败，请稍后重试')
        setStatus('error')
      }
    }

    processSubmission()
  }, [sessionId, user, navigate, dispatch])

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-6 pb-20">
      <div className="text-center max-w-sm">
        {status === 'submitting' && (
          <>
            <div className="text-6xl mb-6 animate-spin">⏳</div>
            <h1 className="text-xl font-bold text-[#1a1a2e] mb-3">正在生成报告</h1>
            <p className="text-gray-400 text-sm">请稍候，系统正在处理你的测评数据…</p>
          </>
        )}

        {status === 'generating' && (
          <>
            <div className="text-6xl mb-6 animate-pulse">🧠</div>
            <h1 className="text-xl font-bold text-[#1a1a2e] mb-3">AI正在生成综合报告</h1>
            <p className="text-gray-400 text-sm">
              DeepSeek正在综合分析你的多维测评数据，
              <br />生成标准化Word格式综合报告…
            </p>
            <div className="mt-6 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </>
        )}

        {status === 'done' && (
          <>
            <div className="text-6xl mb-6">✅</div>
            <h1 className="text-2xl font-bold text-[#1a1a2e] mb-3">所有测评已完成！</h1>
            <p className="text-gray-400 text-sm mb-2">
              你的综合报告已生成并提交审核
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6 mb-8">
              <div className="flex items-center justify-center gap-2 text-amber-700">
                <span className="text-xl">📋</span>
                <span className="font-medium text-sm">等待管理员审核</span>
              </div>
              <p className="text-amber-600 text-xs mt-2">
                审核通过后，你可以在「我的报告」中查看和下载Word格式的完整报告
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {reportId && (
                <Link
                  to={`/report/${reportId}`}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-base shadow-[0_4px_20px_rgba(99,102,241,0.3)] text-center hover:from-indigo-600 hover:to-violet-600 transition-all"
                >
                  查看报告状态
                </Link>
              )}
              <Link
                to="/history"
                className="w-full py-3.5 rounded-2xl border-2 border-black/[0.04] bg-white text-[#1a1a2e] font-semibold text-sm text-center hover:border-indigo-200 transition-all"
              >
                我的报告列表
              </Link>
              <Link
                to={IS_LZU_MODE ? '/' : '/select'}
                className="w-full py-3.5 rounded-2xl text-gray-400 text-sm text-center hover:text-indigo-600 transition-all"
              >
                返回首页
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-6">⚠️</div>
            <h1 className="text-xl font-bold text-[#1a1a2e] mb-3">提交遇到问题</h1>
            <p className="text-red-500 text-sm mb-6">{errorMsg}</p>
            <button
              onClick={() => navigate(IS_LZU_MODE ? '/' : '/select', { replace: true })}
              className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold"
            >
              返回首页
            </button>
          </>
        )}
      </div>
    </div>
  )
}
