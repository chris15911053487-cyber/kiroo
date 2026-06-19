import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { reportService, type ReportListItem } from '../services/reportService'
import { QUESTIONNAIRE_PRIORITY } from '../types'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [reports, setReports] = useState<ReportListItem[]>([])

  // 根据来源决定返回目标：URL 参数 > sessionStorage 标记 > 默认首页
  const fromParam = searchParams.get('from')
  const isMidsF2Context = fromParam === 'mids-f2' || sessionStorage.getItem('midsf2_context') === '1'
  const backTo = isMidsF2Context ? '/assess/mids-f2' : '/'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    reportService.getList()
      .then(data => setReports(data.reports))
      .catch(err => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [])

  function getQuestionnaireName(qid: string): string {
    const q = QUESTIONNAIRE_PRIORITY.find(q => q.id === qid)
    return q?.name || qid
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return ''
    // 优先用后端返回的中国时间显示字符串
    return dateStr
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'approved':
        return (
          <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
            已通过
          </span>
        )
      case 'rejected':
        return (
          <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
            修订中
          </span>
        )
      case 'pending':
      default:
        return (
          <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            审核中
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      <header className="bg-white border-b border-black/[0.04] sticky top-0 z-40">
        <div className="flex items-center px-6 h-14 max-w-2xl mx-auto gap-3">
          <button
            onClick={() => navigate(backTo)}
            className="text-gray-500 hover:text-indigo-600 transition-colors text-sm flex items-center gap-1 flex-shrink-0"
          >
            <span className="text-lg leading-none">←</span>
            <span className="hidden sm:inline">返回</span>
          </button>
          <h1 className="text-lg font-bold text-[#1a1a2e]">我的测评</h1>
        </div>
      </header>

      <main className="px-6 py-6 max-w-2xl mx-auto">
        {loading && (
          <div className="text-center py-20 text-gray-400">加载中…</div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-400 text-lg mb-4">暂无测评报告</p>
            <Link
              to={isMidsF2Context ? '/assess/mids-f2' : '/select'}
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-[0_4px_15px_rgba(99,102,241,0.3)]"
            >
              开始第一次测评
            </Link>
          </div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-gray-500 text-sm">共 {reports.length} 份报告</p>

            {reports.map(report => {
              const isApproved = report.reviewStatus === 'approved'
              const sharedClass = "bg-white border border-black/[0.04] rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-200"
              const cardContent = (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#1a1a2e] text-sm">综合测评报告</h3>
                      {getStatusBadge(report.reviewStatus)}
                    </div>
                    <span className="text-gray-400 text-xs">{formatDate(report.createdAtDisplay || report.createdAt)}</span>
                  </div>

                  {/* 综合得分 */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xl font-extrabold text-indigo-600">
                        {report.comprehensiveScore}
                      </span>
                      <span className="text-xs text-gray-400">分</span>
                    </div>
                  </div>

                  {/* 完成的问卷 */}
                  <div className="flex flex-wrap gap-1.5">
                    {report.questionnairesCompleted.map(qid => (
                      <span
                        key={qid}
                        className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 text-[10px] font-medium"
                      >
                        {getQuestionnaireName(qid)}
                      </span>
                    ))}
                  </div>

                  {/* 状态提示 */}
                  {isApproved ? (
                    <p className="text-indigo-500 text-xs mt-3 flex items-center gap-1">
                      <span>📄</span> 点击查看完整报告 →
                    </p>
                  ) : (
                    <p className="text-gray-400 text-xs mt-3 flex items-center gap-1">
                      <span>🔒</span>
                      {report.reviewStatus === 'pending' ? '审核通过后可查看报告详情' : '审核未通过，暂不可查看'}
                    </p>
                  )}
                </>
              )

              return isApproved ? (
                <Link
                  key={report.id}
                  to={`/report/${report.id}`}
                  className={`${sharedClass} hover:border-indigo-200 hover:shadow-[0_4px_16px_rgba(99,102,241,0.08)]`}
                >
                  {cardContent}
                </Link>
              ) : (
                <div
                  key={report.id}
                  className={`${sharedClass} opacity-70`}
                >
                  {cardContent}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
