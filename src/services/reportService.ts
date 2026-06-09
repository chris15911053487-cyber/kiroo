const API_BASE = '/api/reports'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...authHeaders(), ...((options.headers as Record<string, string>) || {}) },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || '请求失败')
  }
  return data as T
}

export interface ReportListItem {
  id: number
  sessionId: number
  comprehensiveScore: number
  reviewStatus: 'pending' | 'approved' | 'rejected'
  createdAt: string
  questionnairesCompleted: string[]
}

export interface ReportDetail {
  id: number
  sessionId: number
  userId: number
  questionnairesCompleted: string[]
  scoreSummary: Record<string, unknown>
  reportContent: string | null
  reportHtml: string | null
  docxPath: string | null
  comprehensiveScore: number
  reviewStatus: 'pending' | 'approved' | 'rejected'
  reviewComment: string | null
  reviewedAt: string | null
  createdAt: string
}

export interface SaveReportData {
  sessionId: number
  userId: number
  questionnairesCompleted: string[]
  scoreSummary: Record<string, unknown>
  reportContent: string
  comprehensiveScore: number
  token: string
}

export const reportService = {
  /** 获取用户的综合报告列表 */
  getList() {
    return request<{ reports: ReportListItem[]; total: number }>('/')
  },

  /** 获取报告详情 */
  getDetail(id: number) {
    return request<{ report: ReportDetail }>(`/${id}`)
  },

  /** 保存综合报告（AI生成后调用） */
  save(data: SaveReportData) {
    return request<{ message: string; reportId: number }>('/save', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
