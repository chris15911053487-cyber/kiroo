import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'

const MAJOR_OPTIONS = [
  '工商管理', '经济学/金融', '计算机/信息技术', '法学', '工程技术',
  '医学/健康科学', '艺术设计/传媒', '理学', '文学/教育', '其他',
]

const MIDS_F2_INTRO = {
  title: '家族二代多维创新力量表',
  subtitle: 'MIDS-F2',
  description: '这是一份专为家族企业二代设计的创新力画像测评。我们从五个维度照见你的核心潜能——不是打分，而是帮你看清自己已有的光芒和待释放的力量。',
  dimensions: [
    { name: '战略破局力', icon: '🎯', desc: '你看方向时的敏锐直觉' },
    { name: '执行颠覆力', icon: '⚡', desc: '你做事时的系统天赋' },
    { name: '资源整合力', icon: '🔗', desc: '你撬动资源时的联结本能' },
    { name: '逆商与灰度', icon: '🛡️', desc: '你面对压力时的坚韧内核' },
    { name: '伦理与格局', icon: '🌍', desc: '你内心深处的价值坐标' },
  ],
  info: [
    { label: '题量', value: '23 题' },
    { label: '时长', value: '约 8 分钟' },
    { label: '报告', value: '六章完整画像 + 职业路径建议' },
  ],
}

export default function MidsF2Landing() {
  const { user, token, loading, updateUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [education, setEducation] = useState('')
  const [graduationIntention, setGraduationIntention] = useState('')
  const [major, setMajor] = useState('')
  const [majorCustom, setMajorCustom] = useState('')
  const [showMajorInput, setShowMajorInput] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    // 标记 MIDS-F2 上下文，Navbar 据此为"我的测评"链接携带 ?from=mids-f2
    sessionStorage.setItem('midsf2_context', '1')
    // 已登录 → 展示表单（预填已有的学历/毕业意愿）
    if (!loading && user && token) {
      if (user.education) setEducation(user.education)
      if (user.graduationIntention) setGraduationIntention(user.graduationIntention)
      if (user.major) {
        if (MAJOR_OPTIONS.includes(user.major)) {
          setMajor(user.major)
          if (user.major === '其他') setShowMajorInput(true)
        } else {
          setMajor('其他')
          setShowMajorInput(true)
          setMajorCustom(user.major)
        }
      }
    }
  }, [loading, user, token])

  async function handleStartAssessment() {
    const effectiveMajor = major === '其他' ? majorCustom : major
    if (!education || !graduationIntention || !effectiveMajor) {
      setError('请选择学历、就职意向和专业')
      return
    }
    if (!token) return
    setSavingProfile(true)
    setError('')
    try {
      // Save to backend
      await authService.updateProfile(education, graduationIntention, effectiveMajor)
      // Update local state
      updateUser({ education, graduationIntention, major: effectiveMajor })
      // Create session and navigate
      const sessionId = await createMidsF2Session(token)
      navigate(`/quiz/${sessionId}`, { replace: true })
    } catch (err: any) {
      setError(err.message || '保存失败，请重试')
      setSavingProfile(false)
    }
  }

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#EEF2FF] to-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // 未登录 → 展示介绍页
  const loginUrl = `/login?redirect=${encodeURIComponent('/assess/mids-f2')}`
  const registerUrl = `/register?redirect=${encodeURIComponent('/assess/mids-f2')}`

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF2FF] to-white">
      {/* Hero */}
      <div className="px-6 pt-12 pb-8 text-center">
        <h1 className="text-2xl font-bold text-[#1E3A5F] mb-2">{MIDS_F2_INTRO.title}</h1>
        <p className="text-sm text-gray-400 mb-6">{MIDS_F2_INTRO.subtitle} · 测评报告</p>
        <p className="text-base text-gray-600 leading-relaxed max-w-sm mx-auto">
          {MIDS_F2_INTRO.description}
        </p>
      </div>

      {/* 五维度卡片 */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
          {MIDS_F2_INTRO.dimensions.map((dim, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-gray-100"
            >
              <span className="text-xl">{dim.icon}</span>
              <div>
                <p className="text-sm font-bold text-gray-800">{dim.name}</p>
                <p className="text-xs text-gray-400">{dim.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 基本信息 */}
      <div className="px-6 mb-10">
        <div className="flex justify-center gap-6 max-w-sm mx-auto">
          {MIDS_F2_INTRO.info.map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-lg font-bold text-[#1E3A5F]">{item.value}</p>
              <p className="text-xs text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 学历 + 毕业意愿表单 — 仅已登录用户可见 */}
      {user && (
        <div className="px-6 mb-8">
          <div className="max-w-sm mx-auto space-y-5">
            {/* 学历 */}
            <div>
              <label className="block text-sm font-bold text-[#1E3A5F] mb-2">学历</label>
              <div className="grid grid-cols-3 gap-2">
                {['高中/中专', '大专', '本科', '硕士', '博士'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setEducation(opt)}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      education === opt
                        ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#1E3A5F]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            {/* 就职意向 */}
            <div>
              <label className="block text-sm font-bold text-[#1E3A5F] mb-2">就职意向</label>
              <div className="grid grid-cols-3 gap-2">
                {['自主创业', '家业继承', '企业就职'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setGraduationIntention(opt)}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      graduationIntention === opt
                        ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#1E3A5F]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            {/* 专业 */}
            <div>
              <label className="block text-sm font-bold text-[#1E3A5F] mb-2">专业</label>
              <div className="grid grid-cols-2 gap-2">
                {MAJOR_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setMajor(opt)
                      setShowMajorInput(opt === '其他')
                      if (opt !== '其他') setMajorCustom('')
                    }}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      major === opt
                        ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#1E3A5F]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {showMajorInput && (
                <input
                  type="text"
                  value={majorCustom}
                  onChange={(e) => setMajorCustom(e.target.value)}
                  placeholder="请输入您的专业名称"
                  className="mt-2 w-full py-2.5 px-3 rounded-lg text-sm border border-gray-200 focus:border-[#1E3A5F] focus:outline-none"
                />
              )}
            </div>
            {/* 开始测评按钮 */}
            <button
              onClick={handleStartAssessment}
              disabled={savingProfile || !education || !graduationIntention || !(major === '其他' ? majorCustom : major)}
              className="w-full py-3 bg-[#1E3A5F] text-white rounded-lg font-bold text-base hover:bg-[#152E4D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingProfile ? '正在准备...' : '开始测评'}
            </button>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="px-6 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 text-center max-w-sm mx-auto">
            {error}
          </div>
        </div>
      )}

      {/* 操作按钮 — 仅未登录用户可见 */}
      {!user && (
        <div className="px-6 pb-12">
          <div className="flex flex-col gap-3 max-w-sm mx-auto">
            <Link
              to={loginUrl}
              className="block w-full py-3 bg-[#1E3A5F] text-white text-center rounded-lg font-bold text-base hover:bg-[#152E4D] transition-colors"
            >
              登录 · 开始测评
            </Link>
            <Link
              to={registerUrl}
              className="block w-full py-3 bg-white text-[#1E3A5F] text-center rounded-lg font-medium text-base border border-[#1E3A5F] hover:bg-gray-50 transition-colors"
            >
              注册新账号
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

/** 创建 MIDS-F2 专属会话 */
async function createMidsF2Session(token: string): Promise<number> {
  // 1. 先检查是否有进行中的会话
  const currentResp = await fetch('/api/sessions/current', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!currentResp.ok) throw new Error('网络异常，请重试')
  const currentData = await currentResp.json()

  // 如果有进行中的 MIDS-F2 会话，直接复用
  if (currentData.session) {
    const sess = currentData.session
    const questionnaires =
      typeof sess.orderedQuestionnaires === 'string'
        ? JSON.parse(sess.orderedQuestionnaires)
        : sess.orderedQuestionnaires
    if (questionnaires.length === 1 && questionnaires[0] === 'mids-f2') {
      return sess.id
    }
  }

  // 2. 创建新会话
  const createResp = await fetch('/api/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ selectedQuestionnaires: ['mids-f2'] }),
  })

  if (!createResp.ok) {
    const errData = await createResp.json().catch(() => ({}))
    if (createResp.status === 409) {
      // 有其他进行中的会话，使用 existingSessionId
      return errData.existingSessionId
    }
    throw new Error(errData.error || '创建测评失败')
  }

  const data = await createResp.json()
  return data.id
}
