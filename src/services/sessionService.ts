const API_BASE = '/api/sessions'

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

export interface SessionData {
  id: number
  selectedQuestionnaires: string[]
  orderedQuestionnaires: string[]
  currentIndex: number
  status: string
  createdAt?: string
  updatedAt?: string
}

export interface AnswerSaveResult {
  currentIndex: number
  status: string
  totalQuestionnaires: number
  isLastQuestionnaire: boolean
  message: string
}

export interface SubmitResult {
  sessionId: number
  reportId?: number
  questionnairesCompleted: string[]
  scoreSummary: Record<string, unknown>
  comprehensiveScore?: number
  status: string
  message: string
}

export const sessionService = {
  /** 创建测评会话 */
  create(selectedQuestionnaires: string[]) {
    return request<SessionData>('/', {
      method: 'POST',
      body: JSON.stringify({ selectedQuestionnaires }),
    })
  },

  /** 获取当前进行中的会话 */
  getCurrent() {
    return request<{ session: SessionData | null }>('/current')
  },

  /** 获取会话详情 */
  getById(id: number) {
    return request<{ session: SessionData }>(`/${id}`)
  },

  /** 提交单个问卷答案（存档点） */
  saveAnswers(
    sessionId: number,
    data: {
      questionnaireId: string
      questionnaireName: string
      answers: Record<string, string>
      scoreResult: Record<string, unknown>
    }
  ) {
    return request<AnswerSaveResult>(`/${sessionId}/answers`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /** 完成所有问卷，提交会话 */
  submit(sessionId: number) {
    return request<SubmitResult>(`/${sessionId}/submit`, {
      method: 'POST',
    })
  },

  /** 放弃进行中的测评会话 */
  cancel(sessionId: number) {
    return request<{ message: string }>(`/${sessionId}`, {
      method: 'DELETE',
    })
  },
}
