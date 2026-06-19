import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  parseReportJSON,
  LZUScoreSection,
  LZULeadershipSection,
  LZUPersonalitySection,
  LZUCreativityBarrierSection,
  LZUImprovementPlanSection,
  LZUCareerSection,
  LZUReportSummary,
} from '../../components/LZUReportSections'
import MidsF2ReportPage from '../MidsF2ReportPage'

// ==================== Types ====================

interface ReportDetail {
  id: number
  sessionId: number
  userId: number
  questionnairesCompleted: string[]
  scoreSummary: Record<string, any>
  reportContent: string
  reportHtml: string | null
  docxPath: string | null
  comprehensiveScore: number
  reviewStatus: 'pending' | 'approved' | 'rejected'
  reviewComment: string | null
  reviewedAt: string | null
  createdAt: string
  createdAtDisplay?: string
  nickname: string
  phone: string
  orderedQuestionnaires: string[]
  selectedQuestionnaires: string[]
  assessmentRecords: Array<{
    id: number
    questionnaireId: string
    questionnaireName: string
    scoreResult: Record<string, any>
    createdAt: string
  }>
}

// ==================== Helpers ====================

function adminHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_token')
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' }
}

function isMidsF2ReportContent(reportContent: string | null): boolean {
  if (!reportContent) return false
  try {
    const parsed = JSON.parse(reportContent)
    return parsed?.reportType === 'mids-f2' || !!parsed?.midsF2Result
  } catch {
    return false
  }
}

// ==================== Component ====================

export default function AdminReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [report, setReport] = useState<ReportDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState<'html' | 'json'>('html')

  // API helper with auto-redirect on 401
  const apiFetch = useCallback(async <T,>(url: string, options?: RequestInit): Promise<T> => {
    const res = await fetch(url, {
      ...options,
      headers: { ...adminHeaders(), ...((options?.headers as Record<string, string>) || {}) },
    })
    if (res.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_info')
      navigate('/admin/login', { replace: true })
      throw new Error('Unauthorized')
    }
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '请求失败')
    return data as T
  }, [navigate])

  // Load report detail
  const loadDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await apiFetch<{ report: ReportDetail }>(`/api/admin/reports/${id}`)
      setReport(data.report)
    } catch (err: any) {
      if (err.message !== 'Unauthorized') {
        alert('加载失败：' + (err.message || '未知错误'))
      }
    } finally {
      setLoading(false)
    }
  }, [id, apiFetch])

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }
    loadDetail()
  }, [loadDetail, navigate])

  // Actions
  async function handleGenerate() {
    if (!report || !confirm('确认生成报告？系统将调用AI分析并组装标准化报告模版。')) return
    setGenerateLoading(true)
    try {
      await apiFetch(`/api/admin/reports/${report.id}/generate`, { method: 'POST' })
      alert('报告生成成功！')
      await loadDetail()
    } catch (err: any) {
      alert('生成失败：' + (err.message || '未知错误'))
    } finally {
      setGenerateLoading(false)
    }
  }

  function handleDownload() {
    if (!report) return
    const token = localStorage.getItem('admin_token')
    if (!token) return
    fetch(`/api/admin/reports/${report.id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      if (!res.ok) throw new Error('下载失败')
      const disposition = res.headers.get('Content-Disposition')
      let filename = `人才测评报告_${report.id}`
      if (disposition) {
        const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;\s]+)/)
        if (match) {
          filename = decodeURIComponent(match[1])
        }
      }
      return res.blob().then(blob => ({ blob, filename }))
    }).then(({ blob, filename }) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }).catch(err => alert('下载失败：' + err.message))
  }

  async function handleApprove() {
    if (!report) return
    setReviewLoading(true)
    try {
      await apiFetch(`/api/admin/reports/${report.id}/approve`, { method: 'POST' })
      setReport(prev => prev ? { ...prev, reviewStatus: 'approved' } : null)
    } catch { /* handled */ }
    finally { setReviewLoading(false) }
  }

  async function handleReject() {
    if (!report) return
    const comment = prompt('请输入退回原因（可选）：')
    setReviewLoading(true)
    try {
      await apiFetch(`/api/admin/reports/${report.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ comment: comment || undefined }),
      })
      setReport(prev => prev ? { ...prev, reviewStatus: 'rejected', reviewComment: comment || null } : null)
    } catch { /* handled */ }
    finally { setReviewLoading(false) }
  }

  // ==================== Render ====================

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm shrink-0">
        <div className="px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1 shrink-0"
            >
              ← 返回
            </button>
            {report && (
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-gray-800 truncate">综合报告详情</h1>
                <p className="text-xs text-gray-400 truncate">
                  {report.nickname} · {report.phone || '无手机号'} ·{' '}
                  {report.createdAtDisplay || (report.createdAt ? new Date(report.createdAt).toLocaleString('zh-CN') : '')}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('admin_token')
              localStorage.removeItem('admin_info')
              navigate('/admin/login', { replace: true })
            }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0 ml-2"
          >
            退出
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-auto px-3 py-3 sm:px-6 sm:py-4">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">加载中…</div>
        ) : !report ? (
          <div className="flex items-center justify-center h-64 text-gray-400">报告不存在</div>
        ) : (
          <>
            {/* Preview mode switch */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setPreviewMode('html')}
                className={`text-xs px-3 py-1 rounded-full ${
                  previewMode === 'html'
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                标准化报告
              </button>
              <button
                onClick={() => setPreviewMode('json')}
                className={`text-xs px-3 py-1 rounded-full ${
                  previewMode === 'json'
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                JSON数据
              </button>
              {!report.reportHtml && !isMidsF2ReportContent(report.reportContent) && (
                <span className="text-[10px] text-amber-500 ml-1">报告尚未生成，请先点击生成</span>
              )}
            </div>

            {/* ===== HTML Preview ===== */}
            {previewMode === 'html' && report.reportHtml ? (
              <iframe
                srcDoc={report.reportHtml}
                title="报告预览"
                className="w-full border border-gray-200 rounded-lg"
                style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}
                sandbox="allow-same-origin allow-scripts"
              />
            ) : previewMode === 'html' && isMidsF2ReportContent(report.reportContent) ? (
              (() => {
                const midsData = JSON.parse(report.reportContent)
                const dimensionScores =
                  midsData.midsF2Result?.dimensionAverages ||
                  midsData.midsF2Scores ||
                  midsData.scoreSummary?.['mids-f2']?.dimensionScores ||
                  {}
                return (
                  <div className="border border-gray-200 rounded-lg overflow-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                    <MidsF2ReportPage
                      scoreResult={dimensionScores}
                      aiReport={midsData}
                      reportId={report.id}
                      userName={report.nickname}
                      userEducation={midsData.education || ''}
                      userGraduationIntention={midsData.graduationIntention || ''}
                    />
                  </div>
                )
              })()
            ) : previewMode === 'html' && !report.reportHtml ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                <p className="text-amber-700 text-sm mb-3">⚠️ 报告尚未生成</p>
                <p className="text-amber-600 text-xs mb-4">
                  当前系统已放弃JSON自动生成方案。请点击下方"生成报告"按钮，系统将调用AI分析并组装标准化报告模版。
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={generateLoading}
                  className="px-6 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                >
                  {generateLoading ? '生成中…' : '🚀 生成标准化报告'}
                </button>
              </div>
            ) : (
              /* ===== JSON Data View ===== */
              (() => {
                const parsed = parseReportJSON(report.reportContent)
                if (!parsed) {
                  return (
                    <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-400">
                      {report.reportContent ? (
                        <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">{report.reportContent}</pre>
                      ) : (
                        '暂无报告内容'
                      )}
                    </div>
                  )
                }
                return (
                  <div className="max-w-2xl mx-auto">
                    <LZUScoreSection score={parsed.comprehensiveScore} grade={parsed.grade} gradeDescription={parsed.gradeDescription} />
                    <LZUReportSummary evaluation={parsed.coreEvaluation} advantages={parsed.coreAdvantages || []} summary={parsed.summary || ''} />
                    {parsed.leadershipAnalysis && <LZULeadershipSection data={parsed.leadershipAnalysis} />}
                    {parsed.personalityAnalysis && <LZUPersonalitySection data={parsed.personalityAnalysis} />}
                    {parsed.creativityBarrierAnalysis && <LZUCreativityBarrierSection data={parsed.creativityBarrierAnalysis} />}
                    {parsed.careerSuggestions && parsed.careerSuggestions.length > 0 && (
                      <LZUCareerSection suggestions={parsed.careerSuggestions} />
                    )}
                    {parsed.improvementPlan && <LZUImprovementPlanSection plan={parsed.improvementPlan} />}
                  </div>
                )
              })()
            )}
          </>
        )}
      </main>

      {/* Footer — Review actions */}
      {report && (
        <div className="bg-white border-t px-3 py-2 sm:px-6 sm:py-3 flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {report.reviewStatus === 'pending' && (
              <>
                <span className="text-xs text-gray-400">审核：</span>
                <button
                  onClick={handleApprove}
                  disabled={reviewLoading}
                  className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  ✅ 通过
                </button>
                <button
                  onClick={handleReject}
                  disabled={reviewLoading}
                  className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 disabled:opacity-50"
                >
                  ❌ 退回
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generateLoading}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 disabled:opacity-50"
                >
                  {generateLoading ? '生成中…' : '🤖 重新生成'}
                </button>
              </>
            )}
            {report.reviewStatus === 'approved' && (
              <span className="text-sm text-green-600 font-medium">✅ 已通过审核</span>
            )}
            {report.reviewStatus === 'rejected' && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-red-500 font-medium">❌ 已退回</span>
                {report.reviewComment && (
                  <span className="text-xs text-gray-400">原因：{report.reviewComment}</span>
                )}
                <button
                  onClick={handleApprove}
                  disabled={reviewLoading}
                  className="ml-2 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  改为通过
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generateLoading}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 disabled:opacity-50"
                >
                  {generateLoading ? '生成中…' : '🤖 重新生成'}
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {report.reportHtml && (
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600"
              >
                📥 下载PDF
              </button>
            )}
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs hover:bg-gray-200"
            >
              返回列表
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
