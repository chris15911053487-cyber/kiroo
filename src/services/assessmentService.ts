const API_BASE = '/api/assessments'

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

interface SaveData {
  questionnaireId: string
  questionnaireName: string
  answers: Record<string, string>
  scoreResult: Record<string, unknown>
  aiReport?: string
  aiAnalysis?: string
  suggestions?: string
}

interface HistoryRecord {
  id: number
  questionnaireName: string
  scoreResult: Record<string, unknown>
  reviewStatus: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface DetailRecord extends Omit<HistoryRecord, 'scoreResult'> {
  questionnaireId: string
  scoreResult: Record<string, unknown> | null
  answers: Record<string, string> | null
  aiReport: string | null
  reviewComment: string | null
}

export const assessmentService = {
  save(data: SaveData) {
    return request<{ id: number; message: string }>('/save', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getHistory() {
    return request<{ records: HistoryRecord[]; total: number }>('/history')
  },

  getDetail(id: number) {
    return request<{ record: DetailRecord }>(`/${id}`)
  },

  getStatus(id: number) {
    return request<{ reviewStatus: string; reviewComment: string | null }>(`/${id}/status`)
  },
}
