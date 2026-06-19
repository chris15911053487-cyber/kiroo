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

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }
    loadStats()
    loadReports(1)
  }, [])

  // 懒加载排名数据
  useEffect(() => {
    if (activeTab === 'ranking' && ranking.length === 0) {
      loadRanking()
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
    </div>
  )
}
