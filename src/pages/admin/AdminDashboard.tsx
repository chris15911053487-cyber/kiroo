import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ==================== Types ====================

interface Stats {
  totalUsers: number
  totalAssessments: number
  todayAssessments: number
  totalReports: number
  pendingReports: number
  questionnaireDistribution: Array<{ id: string; name: string; count: number }>
}

interface ReportItem {
  id: number
  sessionId: number
  comprehensiveScore: number
  reviewStatus: 'pending' | 'approved' | 'rejected'
  reviewComment: string | null
  reviewedAt: string | null
  createdAt: string
  nickname: string
  phone: string
  orderedQuestionnaires: string[]
}

interface ReportDetail {
  id: number
  sessionId: number
  userId: number
  questionnairesCompleted: string[]
  scoreSummary: Record<string, any>
  reportContent: string
  comprehensiveScore: number
  reviewStatus: 'pending' | 'approved' | 'rejected'
  reviewComment: string | null
  reviewedAt: string | null
  createdAt: string
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

// ==================== Component ====================

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [reports, setReports] = useState<ReportItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterKeyword, setFilterKeyword] = useState('')

  // Detail modal
  const [detailReport, setDetailReport] = useState<ReportDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [editingReport, setEditingReport] = useState(false)
  const [editReportText, setEditReportText] = useState('')
  const [editScore, setEditScore] = useState(0)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [structuredEdit, setStructuredEdit] = useState(false)
  const [structuredFields, setStructuredFields] = useState<Record<string, string>>({})

  // Tab: 'reports' | 'assessments' | 'users'
  const [activeTab, setActiveTab] = useState<'reports' | 'assessments' | 'users'>('reports')

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }
    loadStats()
    loadReports(1)
  }, [])

  async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
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
  }

  async function loadStats() {
    try {
      const data = await apiFetch<Stats>('/api/admin/stats')
      setStats(data)
    } catch { /* handled */ }
  }

  async function loadReports(p: number) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('pageSize', '20')
      if (filterStatus) params.set('review_status', filterStatus)
      if (filterKeyword) params.set('keyword', filterKeyword)

      const data = await apiFetch<{ reports: ReportItem[]; total: number }>(
        `/api/admin/reports?${params.toString()}`
      )
      setReports(data.reports)
      setTotal(data.total)
      setPage(p)
    } catch { /* handled */ }
    finally { setLoading(false) }
  }

  async function loadDetail(id: number) {
    setDetailLoading(true)
    setEditingReport(false)
    try {
      const data = await apiFetch<{ report: ReportDetail }>(`/api/admin/reports/${id}`)
      setDetailReport(data.report)
      setEditReportText(data.report.reportContent || '')
      setEditScore(data.report.comprehensiveScore)
    } catch { /* handled */ }
    finally { setDetailLoading(false) }
  }

  function closeDetail() {
    setDetailReport(null)
  }

  async function handleApprove(id: number) {
    setReviewLoading(true)
    try {
      await apiFetch(`/api/admin/reports/${id}/approve`, { method: 'POST' })
      setDetailReport(prev => prev ? { ...prev, reviewStatus: 'approved' } : null)
      loadReports(page)
    } catch { /* handled */ }
    finally { setReviewLoading(false) }
  }

  async function handleReject(id: number) {
    const comment = prompt('请输入退回原因（可选）：')
    setReviewLoading(true)
    try {
      await apiFetch(`/api/admin/reports/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ comment: comment || undefined }),
      })
      setDetailReport(prev => prev ? { ...prev, reviewStatus: 'rejected', reviewComment: comment || null } : null)
      loadReports(page)
    } catch { /* handled */ }
    finally { setReviewLoading(false) }
  }

  async function handleSaveReport(id: number) {
    try {
      await apiFetch(`/api/admin/reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          reportContent: editReportText,
          comprehensiveScore: editScore,
        }),
      })
      setDetailReport(prev =>
        prev ? { ...prev, reportContent: editReportText, comprehensiveScore: editScore } : null
      )
      setEditingReport(false)
      setStructuredEdit(false)
    } catch { /* handled */ }
  }

  /** 尝试解析JSON并打开结构化编辑 */
  function tryStructuredEdit() {
    if (!detailReport?.reportContent) return
    try {
      const json = JSON.parse(detailReport.reportContent)
      const fields: Record<string, string> = {
        comprehensiveScore: String(json.comprehensiveScore || 75),
        coreEvaluation: json.coreEvaluation || '',
        summary: json.summary || '',
        teamRolePrimary: json.teamRole?.primary || '',
        teamRoleSecondary: json.teamRole?.secondary || '',
        teamRoleDescription: json.teamRole?.description || '',
        careerSuggestions: JSON.stringify(json.careerSuggestions || [], null, 2),
        improvementSuggestions: JSON.stringify(json.improvementSuggestions || [], null, 2),
        coreAdvantages: JSON.stringify(json.coreAdvantages || [], null, 2),
      }
      setStructuredFields(fields)
      setEditScore(Number(fields.comprehensiveScore))
      setStructuredEdit(true)
      setEditingReport(true)
    } catch {
      // 解析失败，使用原始JSON编辑
      setEditReportText(detailReport.reportContent || '')
      setEditScore(detailReport.comprehensiveScore)
      setEditingReport(true)
    }
  }

  /** 从结构化字段重建JSON */
  function rebuildJsonFromFields(): string {
    const orig = (() => { try { return JSON.parse(detailReport?.reportContent || '{}') } catch { return {} } })()
    orig.comprehensiveScore = Number(structuredFields.comprehensiveScore) || 75
    orig.coreEvaluation = structuredFields.coreEvaluation || ''
    orig.summary = structuredFields.summary || ''
    orig.teamRole = {
      primary: structuredFields.teamRolePrimary || '',
      secondary: structuredFields.teamRoleSecondary || '',
      description: structuredFields.teamRoleDescription || '',
    }
    try { orig.careerSuggestions = JSON.parse(structuredFields.careerSuggestions || '[]') } catch { orig.careerSuggestions = [] }
    try { orig.improvementSuggestions = JSON.parse(structuredFields.improvementSuggestions || '[]') } catch { orig.improvementSuggestions = [] }
    try { orig.coreAdvantages = JSON.parse(structuredFields.coreAdvantages || '[]') } catch { orig.coreAdvantages = [] }
    return JSON.stringify(orig, null, 2)
  }

  function getQuestionnaireLabel(qid: string): string {
    const labels: Record<string, string> = {
      leadership: '领导风格',
      temperament: '气质类型',
      big5: '大五人格',
      mbti: 'MBTI',
      '16pf': '16PF',
      creativity: '创造力',
      holland: '霍兰德',
    }
    return labels[qid] || qid
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-gray-800">管理后台</h1>
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'reports' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                综合报告
              </button>
              <button
                onClick={() => setActiveTab('assessments')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'assessments' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                测评记录
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                用户管理
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('admin_token')
              localStorage.removeItem('admin_info')
              navigate('/admin/login', { replace: true })
            }}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            退出
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-gray-400 text-xs mb-1">总用户数</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-gray-400 text-xs mb-1">总测评数</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalAssessments}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-gray-400 text-xs mb-1">今日测评</p>
              <p className="text-2xl font-bold text-gray-800">{stats.todayAssessments}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-gray-400 text-xs mb-1">综合报告</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalReports}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-amber-400">
              <p className="text-gray-400 text-xs mb-1">待审核</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pendingReports}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">审核状态</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 outline-none"
              >
                <option value="">全部</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已退回</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">关键词</label>
              <input
                type="text"
                value={filterKeyword}
                onChange={e => setFilterKeyword(e.target.value)}
                placeholder="昵称/手机号"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 outline-none w-36"
              />
            </div>
            <button
              onClick={() => loadReports(1)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              搜索
            </button>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">用户</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">手机号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">综合得分</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">完成问卷</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">时间</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-400">加载中…</td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-400">暂无数据</td>
                  </tr>
                ) : (
                  reports.map(r => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">#{r.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{r.nickname}</td>
                      <td className="px-4 py-3 text-gray-500">{r.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
                          {r.comprehensiveScore}分
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {r.orderedQuestionnaires?.map(qid => (
                            <span key={qid} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px]">
                              {getQuestionnaireLabel(qid)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {r.reviewStatus === 'approved' && (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">已通过</span>
                        )}
                        {r.reviewStatus === 'pending' && (
                          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">待审核</span>
                        )}
                        {r.reviewStatus === 'rejected' && (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">已退回</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(r.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => loadDetail(r.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-gray-500">共 {total} 条</span>
              <div className="flex gap-1">
                <button
                  onClick={() => loadReports(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1 rounded-lg text-sm border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
                <button
                  onClick={() => loadReports(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1 rounded-lg text-sm border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {(detailReport || detailLoading) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeDetail}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="p-10 text-center text-gray-400">加载中…</div>
            ) : detailReport && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">综合报告详情</h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {detailReport.nickname} · {detailReport.phone || '无手机号'} · {new Date(detailReport.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
                  {/* 综合得分 + 问卷完成情况 */}
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-indigo-50 rounded-xl px-5 py-4 flex items-center gap-3">
                      <span className="text-sm text-gray-500">综合得分</span>
                      {editingReport ? (
                        <input
                          type="number"
                          value={editScore}
                          onChange={e => setEditScore(Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-xl font-bold text-indigo-600 text-center"
                          min={65}
                          max={85}
                          step={0.5}
                        />
                      ) : (
                        <span className="text-2xl font-extrabold text-indigo-600">{detailReport.comprehensiveScore}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-xs text-gray-400 mb-1.5">已完成问卷：</p>
                      <div className="flex flex-wrap gap-1.5">
                        {detailReport.orderedQuestionnaires?.map(qid => {
                          const completed = detailReport.questionnairesCompleted.includes(qid)
                          return (
                            <span
                              key={qid}
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                completed
                                  ? 'bg-green-100 text-green-700 border border-green-200'
                                  : 'bg-gray-100 text-gray-400 border border-gray-200'
                              }`}
                            >
                              {completed ? '✓ ' : '✗ '}{getQuestionnaireLabel(qid)}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 各问卷得分摘要 */}
                  {detailReport.assessmentRecords.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">📊 各问卷得分</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {detailReport.assessmentRecords.map(record => (
                          <div key={record.id} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                            <span className="font-medium text-gray-700">{record.questionnaireName}</span>
                            {record.scoreResult.type === 'categorical' && record.scoreResult.categoryResult && (
                              <span className="ml-2 text-indigo-600 font-bold">
                                {String(record.scoreResult.categoryResult)}
                              </span>
                            )}
                            {record.scoreResult.type === 'additive' && record.scoreResult.dimensionScores && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {Object.entries(record.scoreResult.dimensionScores as Record<string, number>)
                                  .slice(0, 4)
                                  .map(([k, v]) => (
                                    <span key={k} className="text-xs text-gray-500">
                                      {k}: {v}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI报告内容 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-700">🤖 AI综合报告</h3>
                      {!editingReport && (
                        <div className="flex gap-2">
                          <button
                            onClick={tryStructuredEdit}
                            className="text-xs text-green-600 hover:text-green-800 font-medium"
                          >
                            📋 结构化编辑
                          </button>
                          <button
                            onClick={() => {
                              setEditReportText(detailReport.reportContent || '')
                              setEditScore(detailReport.comprehensiveScore)
                              setEditingReport(true)
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            ✏️ 编辑JSON
                          </button>
                        </div>
                      )}
                    </div>

                    {editingReport ? (
                      <div>
                        {structuredEdit ? (
                          /* 结构化编辑模式 */
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">综合得分</label>
                                <input type="number" value={editScore} min={65} max={85} step={0.5}
                                  onChange={e => { setEditScore(Number(e.target.value)); setStructuredFields(prev => ({ ...prev, comprehensiveScore: e.target.value })) }}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-indigo-600" />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">团队角色-主</label>
                                <input type="text" value={structuredFields.teamRolePrimary || ''}
                                  onChange={e => setStructuredFields(prev => ({ ...prev, teamRolePrimary: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">核心评价</label>
                              <textarea value={structuredFields.coreEvaluation || ''}
                                onChange={e => setStructuredFields(prev => ({ ...prev, coreEvaluation: e.target.value }))}
                                className="w-full h-16 p-2 border border-gray-200 rounded-lg text-sm resize-y" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">核心优势（JSON数组）</label>
                              <textarea value={structuredFields.coreAdvantages || ''}
                                onChange={e => setStructuredFields(prev => ({ ...prev, coreAdvantages: e.target.value }))}
                                className="w-full h-20 p-2 border border-gray-200 rounded-lg text-xs font-mono resize-y" />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">总结</label>
                              <textarea value={structuredFields.summary || ''}
                                onChange={e => setStructuredFields(prev => ({ ...prev, summary: e.target.value }))}
                                className="w-full h-16 p-2 border border-gray-200 rounded-lg text-sm resize-y" />
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => setStructuredEdit(false)} className="text-xs text-gray-500 hover:text-gray-700">切换到JSON编辑</button>
                            </div>
                          </div>
                        ) : (
                          /* 原始JSON编辑模式 */
                          <textarea
                            value={editReportText}
                            onChange={e => setEditReportText(e.target.value)}
                            className="w-full h-64 p-3 border border-gray-200 rounded-lg text-sm text-gray-700 focus:border-indigo-400 outline-none resize-y font-mono"
                            placeholder="编辑报告JSON..."
                          />
                        )}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => {
                              if (structuredEdit) {
                                const json = rebuildJsonFromFields()
                                setEditReportText(json)
                              }
                              handleSaveReport(detailReport.id)
                            }}
                            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                          >
                            保存修改
                          </button>
                          <button
                            onClick={() => { setEditingReport(false); setStructuredEdit(false) }}
                            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                        {detailReport.reportContent || '暂无报告内容'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer - 审核操作 */}
                <div className="px-6 py-3 border-t flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    {detailReport.reviewStatus === 'pending' && (
                      <>
                        <span className="text-xs text-gray-400">审核操作：</span>
                        <button
                          onClick={() => handleApprove(detailReport.id)}
                          disabled={reviewLoading}
                          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          ✅ 审核通过
                        </button>
                        <button
                          onClick={() => handleReject(detailReport.id)}
                          disabled={reviewLoading}
                          className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                        >
                          ❌ 退回
                        </button>
                      </>
                    )}
                    {detailReport.reviewStatus === 'approved' && (
                      <span className="text-sm text-green-600 font-medium">✅ 已通过审核</span>
                    )}
                    {detailReport.reviewStatus === 'rejected' && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-red-500 font-medium">❌ 已退回</span>
                        {detailReport.reviewComment && (
                          <span className="text-xs text-gray-400">原因：{detailReport.reviewComment}</span>
                        )}
                        <button
                          onClick={() => handleApprove(detailReport.id)}
                          disabled={reviewLoading}
                          className="ml-2 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          改为通过
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={closeDetail}
                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200"
                  >
                    关闭
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
