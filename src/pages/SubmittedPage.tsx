import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { sessionService } from '../services/sessionService'
import { reportService } from '../services/reportService'
import { useAssessment } from '../context/AssessmentContext'
import { useAuth } from '../context/AuthContext'
import { IS_LZU_MODE } from '../types'

const POLL_INTERVAL = 5000 // 每 5 秒轮询审核状态
const POLL_TIMEOUT = 120_000 // 最多轮询 2 分钟

export default function SubmittedPage() {
  const { dispatch } = useAssessment()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const sessionId = (location.state as { sessionId?: number })?.sessionId

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportId, setReportId] = useState<number | null>(null)
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollStartRef = useRef<number>(0)

  // 提交 + 开始轮询
  useEffect(() => {
    if (!sessionId || !user) {
      navigate(IS_LZU_MODE ? '/' : '/select', { replace: true })
      return
    }

    let cancelled = false

    async function submit() {
      try {
        const result = await sessionService.submit(sessionId!)
        if (cancelled) return

        dispatch({ type: 'SET_ALL_SCORES', payload: result.scoreSummary as Record<string, any> })

        if (result.reportId) {
          setReportId(result.reportId)
          startPolling(result.reportId)
        }
        setLoading(false)
      } catch (err) {
        if (!cancelled) {
          console.error('Submission error:', err)
          setError(err instanceof Error ? err.message : '提交失败，请稍后重试')
          setLoading(false)
        }
      }
    }

    submit()

    return () => {
      cancelled = true
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [sessionId, user, navigate, dispatch])

  function startPolling(rid: number) {
    pollStartRef.current = Date.now()

    pollTimerRef.current = setInterval(async () => {
      // 超时停止轮询
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current)
        return
      }

      try {
        const { report } = await reportService.getDetail(rid)
        setReviewStatus(report.reviewStatus)

        // 审核通过或退回，停止轮询
        if (report.reviewStatus === 'approved' || report.reviewStatus === 'rejected') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
        }
      } catch {
        // 报告尚未生成完毕，静默重试
      }
    }, POLL_INTERVAL)
  }

  // ==================== Loading ====================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <p className="text-gray-400">已提交，生成报告中…预计等待 15s~60s</p>
      </div>
    )
  }

  // ==================== Error ====================

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center gap-4 px-6 pb-20">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-[#1a1a2e] mb-2">提交遇到问题</h1>
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button
          onClick={() => navigate(IS_LZU_MODE ? '/' : '/select', { replace: true })}
          className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold"
        >
          返回首页
        </button>
      </div>
    )
  }

  // ==================== Ready — 二维码 + 审核状态 ====================

  const statusConfig = {
    pending: {
      icon: '⏳',
      label: '审核中',
      desc: '报告正在审核中，请添加微信获取通知',
      cardBg: 'bg-amber-50 border-amber-200',
      textColor: 'text-amber-700',
    },
    approved: {
      icon: '✅',
      label: '审核通过',
      desc: '恭喜！你的报告已审核通过，可以查看了',
      cardBg: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
    },
    rejected: {
      icon: '🔄',
      label: '重新审核中',
      desc: '报告已退回修订，请添加微信获取最新通知',
      cardBg: 'bg-orange-50 border-orange-200',
      textColor: 'text-orange-700',
    },
  }

  const status = statusConfig[reviewStatus]

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-6 pb-20">
      <div className="text-center max-w-sm w-full">
        {/* 提交成功 */}
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-[#1a1a2e] mb-2">提交成功！</h1>
        <p className="text-gray-400 text-sm mb-8">
          测评数据已提交，后台正在生成报告
        </p>

        {/* 微信二维码 */}
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] mb-5">
          <img
            src="/images/wechat-qr.jpg"
            alt="微信二维码"
            className="w-48 h-48 mx-auto rounded-lg object-cover"
            onError={(e) => {
              // 图片加载失败时显示占位
              const el = e.currentTarget
              el.style.display = 'none'
              const placeholder = el.nextElementSibling as HTMLElement | null
              if (placeholder) placeholder.style.display = 'flex'
            }}
          />
          <div
            className="w-48 h-48 mx-auto rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex-col items-center justify-center"
            style={{ display: 'none' }}
          >
            <span className="text-3xl mb-1">📱</span>
            <span className="text-xs text-gray-400">二维码图片</span>
            <span className="text-[10px] text-gray-300 mt-0.5">/images/wechat-qr.jpg</span>
          </div>
          <p className="text-sm font-semibold text-[#1a1a2e] mt-3">添加微信获取报告结果</p>
          <p className="text-xs text-gray-400 mt-1">
            扫描二维码添加微信，审核通过后将第一时间通知你
          </p>
        </div>

        {/* 审核状态 */}
        <div className={`rounded-xl border px-4 py-3 mb-6 ${status.cardBg}`}>
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">{status.icon}</span>
            <span className={`text-sm font-bold ${status.textColor}`}>
              📋 审核状态：{status.label}
            </span>
          </div>
          <p className={`text-xs mt-1 ${status.textColor} opacity-80`}>{status.desc}</p>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-3">
          {reviewStatus === 'approved' && reportId && (
            <Link
              to={`/report/${reportId}`}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-base shadow-[0_4px_20px_rgba(99,102,241,0.3)] text-center hover:from-indigo-600 hover:to-violet-600 transition-all"
            >
              查看报告
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
      </div>
    </div>
  )
}
