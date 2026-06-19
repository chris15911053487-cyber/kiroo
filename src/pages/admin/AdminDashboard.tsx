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
  createdAtDisplay?: string
  nickname: string
  phone: string
  orderedQuestionnaires: string[]
}

interface RankingItem {
  userId: number
  nickname: string
  phone: string | null
  bestScore: number
  assessmentCount: number
  latestAssessmentDate: string
  latestAssessmentDisplay?: string
}

interface AssessmentRecord {
  id: number
  nickname: string
  phone: string | null
  questionnaireName: string
  questionnaireId: string
  scoreResult: Record<string, any>
  reviewStatus: string
  createdAt: string
  createdAtDisplay?: string
}

interface AnswerDetail {
  id: number
  user: { nickname: string; phone: string | null }
  questionnaireId: string
  questionnaireName: string
  scoreResult: Record<string, any>
  questions: Array<{
    id: string
    sequence: number
    text: string
    selectedOption: {
      id: string
      text: string
      scores: Record<string, number> | null
    } | null
  }>
  createdAt: string
  createdAtDisplay?: string
}

// ==================== Helpers ====================

function adminHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_token')
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' }
}

function getGrade(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 90) return { label: '卓越型', color: 'text-purple-700', bgColor: 'bg-purple-100' }
  if (score >= 75) return { label: '进取型', color: 'text-blue-700', bgColor: 'bg-blue-100' }
  if (score >= 60) return { label: '成长型', color: 'text-green-700', bgColor: 'bg-green-100' }
  return { label: '待发展型', color: 'text-amber-700', bgColor: 'bg-amber-100' }
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

  // Ranking
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [rankingLoading, setRankingLoading] = useState(false)

  // Tab: 'reports' | 'ranking' | 'assessments' | 'users'
  const [activeTab, setActiveTab] = useState<'reports' | 'ranking' | 'assessments' | 'users'>('reports')

  // Assessments tab
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([])
  const [assessmentsTotal, setAssessmentsTotal] = useState(0)
  const [assessmentsPage, setAssessmentsPage] = useState(1)
  const [assessmentsLoading, setAssessmentsLoading] = useState(false)
  const [assessFilterQ, setAssessFilterQ] = useState('')
  const [assessFilterKeyword, setAssessFilterKeyword] = useState('')

  // Answer detail modal
  const [answerDetail, setAnswerDetail] = useState<AnswerDetail | null>(null)
  const [answerDetailLoading, setAnswerDetailLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }
    loadStats()
    loadReports(1)
  }, [])

  // 懒加载排名数据 / 测评记录
  useEffect(() => {
    if (activeTab === 'ranking' && ranking.length === 0) {
      loadRanking()
    }
    if (activeTab === 'assessments' && assessments.length === 0) {
      loadAssessments(1)
    }
  }, [activeTab])

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

  async function loadRanking() {
    setRankingLoading(true)
    try {
      const data = await apiFetch<{ ranking: RankingItem[] }>('/api/admin/ranking')
      setRanking(data.ranking)
    } catch { /* handled */ }
    finally { setRankingLoading(false) }
  }

  async function loadAssessments(p: number) {
    setAssessmentsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('pageSize', '20')
      if (assessFilterQ) params.set('questionnaire_id', assessFilterQ)
      if (assessFilterKeyword) params.set('keyword', assessFilterKeyword)

      const data = await apiFetch<{ records: AssessmentRecord[]; total: number }>(
        `/api/admin/assessments?${params.toString()}`
      )
      setAssessments(data.records)
      setAssessmentsTotal(data.total)
      setAssessmentsPage(p)
    } catch { /* handled */ }
    finally { setAssessmentsLoading(false) }
  }

  async function loadAnswerDetail(recordId: number) {
    setAnswerDetailLoading(true)
    try {
      const data = await apiFetch<AnswerDetail>(`/api/admin/assessments/${recordId}/detail`)
      setAnswerDetail(data)
    } catch (err: any) {
      alert('加载答案失败：' + (err.message || '未知错误'))
    } finally {
      setAnswerDetailLoading(false)
    }
  }

  function scoreSummaryText(sr: Record<string, any>): string {
    if (!sr) return '-'
    if (sr.type === 'categorical' && sr.categoryResult) return sr.categoryResult
    if (sr.type === 'additive' && sr.dimensionScores) {
      return Object.entries(sr.dimensionScores as Record<string, number>)
        .map(([k, v]) => `${k}:${v}`)
        .join(' · ')
    }
    if (sr.total) return `${sr.total}分`
    return '-'
  }

  const assessQuestionnaireOptions = [
    { id: '', name: '全部问卷' },
    { id: 'big5', name: '大五人格' },
    { id: 'mbti', name: 'MBTI' },
    { id: '16pf', name: '16PF' },
    { id: 'leadership', name: '领导风格' },
    { id: 'temperament', name: '气质类型' },
    { id: 'creativity', name: '创造力' },
    { id: 'holland', name: '霍兰德' },
    { id: 'lzu-leadership', name: 'LZU领导力' },
    { id: 'lzu-personality', name: 'LZU人格' },
    { id: 'lzu-creativity', name: 'LZU创造力' },
    { id: 'mids-f2', name: 'MIDS-F2' },
  ]

  const assessmentsTotalPages = Math.ceil(assessmentsTotal / 20)

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
                onClick={() => setActiveTab('ranking')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'ranking' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                综合排名
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

        {/* Filters — only for reports tab */}
        {activeTab === 'reports' && (<>
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
                placeholder="姓名/手机号"
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
                        {r.createdAtDisplay || (r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : '')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/admin/reports/${r.id}`)}
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
        </>)}

        {/* Assessments Table */}
        {activeTab === 'assessments' && (<>
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">问卷类型</label>
              <select
                value={assessFilterQ}
                onChange={e => setAssessFilterQ(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 outline-none"
              >
                {assessQuestionnaireOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">关键词</label>
              <input
                type="text"
                value={assessFilterKeyword}
                onChange={e => setAssessFilterKeyword(e.target.value)}
                placeholder="姓名/手机号"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 outline-none w-36"
              />
            </div>
            <button
              onClick={() => loadAssessments(1)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              搜索
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">用户</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">手机号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">问卷</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">得分</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">时间</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {assessmentsLoading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">加载中…</td></tr>
                ) : assessments.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">暂无数据</td></tr>
                ) : (
                  assessments.map(r => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">#{r.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{r.nickname}</td>
                      <td className="px-4 py-3 text-gray-500">{r.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-xs font-medium">
                          {r.questionnaireName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{scoreSummaryText(r.scoreResult)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {r.createdAtDisplay || (r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : '')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => loadAnswerDetail(r.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                        >
                          查看答案
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {assessmentsTotalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-gray-500">共 {assessmentsTotal} 条</span>
              <div className="flex gap-1">
                <button
                  onClick={() => loadAssessments(assessmentsPage - 1)}
                  disabled={assessmentsPage <= 1}
                  className="px-3 py-1 rounded-lg text-sm border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">{assessmentsPage} / {assessmentsTotalPages}</span>
                <button
                  onClick={() => loadAssessments(assessmentsPage + 1)}
                  disabled={assessmentsPage >= assessmentsTotalPages}
                  className="px-3 py-1 rounded-lg text-sm border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
        </>)}

        {/* Ranking Table */}
        {activeTab === 'ranking' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-center px-4 py-3 font-medium text-gray-600 w-16">排名</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">用户</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">手机号</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">综合得分</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">等级</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">测评次数</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">最近测评</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400">加载中…</td>
                    </tr>
                  ) : ranking.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400">暂无排名数据</td>
                    </tr>
                  ) : (
                    ranking.map((item, index) => {
                      const grade = getGrade(item.bestScore)
                      return (
                        <tr key={item.userId} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-center">
                            {index < 3 ? (
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white ${
                                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                              }`}>
                                {index + 1}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-medium">{index + 1}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">{item.nickname}</td>
                          <td className="px-4 py-3 text-gray-500">{item.phone || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
                              {item.bestScore}分
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${grade.color} ${grade.bgColor}`}>
                              {grade.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">{item.assessmentCount}次</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {item.latestAssessmentDisplay
                              || (item.latestAssessmentDate
                                ? new Date(item.latestAssessmentDate).toLocaleString('zh-CN')
                                : '-')}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            {!rankingLoading && ranking.length > 0 && (
              <div className="px-4 py-3 border-t text-xs text-gray-400">
                共 {ranking.length} 位用户参与排名
              </div>
            )}
          </div>
        )}
      </main>

      {/* Answer Detail Modal */}
      {(answerDetail || answerDetailLoading) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-1 sm:p-4" onClick={() => setAnswerDetail(null)}>
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {answerDetailLoading ? (
              <div className="p-10 text-center text-gray-400">加载中…</div>
            ) : answerDetail && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-3 sm:px-6 sm:py-4 border-b shrink-0">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-800">答题详情</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {answerDetail.user.nickname} · {answerDetail.user.phone || '无手机号'} · {answerDetail.questionnaireName}
                      {' · '}{answerDetail.createdAtDisplay || new Date(answerDetail.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <button onClick={() => setAnswerDetail(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0 ml-2">×</button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-3 py-3 sm:px-6 sm:py-4">
                  {answerDetail.questions.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">无法加载题目数据</div>
                  ) : (
                    <div className="space-y-3">
                      {answerDetail.questions
                        .sort((a, b) => a.sequence - b.sequence)
                        .map((q, i) => (
                          <div key={q.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                            <p className="text-sm font-medium text-gray-800 mb-2">
                              <span className="text-indigo-500 font-bold mr-1">{i + 1}.</span>
                              {q.text}
                            </p>
                            {q.selectedOption ? (
                              <div className="flex items-center gap-2 ml-5">
                                <span className="text-xs text-gray-400">选择：</span>
                                <span className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                  {q.selectedOption.text}
                                </span>
                                {q.selectedOption.scores && (
                                  <span className="text-[10px] text-gray-400">
                                    (得分: {Object.entries(q.selectedOption.scores)
                                      .filter(([, v]) => v > 0)
                                      .map(([k, v]) => `${k}=${v}`)
                                      .join(', ') || '-'})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-red-400 ml-5">未作答</p>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-3 py-2 sm:px-6 sm:py-3 border-t flex items-center justify-end shrink-0">
                  <button
                    onClick={() => setAnswerDetail(null)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs hover:bg-gray-200"
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
