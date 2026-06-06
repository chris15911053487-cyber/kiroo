import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [tab, setTab] = useState<'password' | 'code'>('password')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [codeSending, setCodeSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Clean up countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  function startCountdown() {
    // Clear any existing timer
    if (countdownRef.current) clearInterval(countdownRef.current)
    setCountdown(60)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleSendCode() {
    if (!/^\d{11}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }
    setError('')
    setCodeSending(true)
    try {
      await authService.sendCode(phone)
      startCountdown()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '发送失败')
    } finally {
      setCodeSending(false)
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!phone || !password) {
      setError('请输入手机号和密码')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await authService.loginByPassword(phone, password)
      login(data.token, data.user)
      navigate(redirect, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleCodeLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!phone || !code) {
      setError('请输入手机号和验证码')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await authService.loginByPhone(phone, code)
      login(data.token, data.user)
      navigate(redirect, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">登录</h1>
          <p className="text-gray-500 mt-2">登录后可保存和查看您的测评记录</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          {/* Tabs */}
          <div className="flex mb-6 border-b">
            <button
              onClick={() => { setTab('password'); setError('') }}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'password'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              密码登录
            </button>
            <button
              onClick={() => { setTab('code'); setError('') }}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'code'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              验证码登录
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* Password Login Form */}
          {tab === 'password' && (
            <form onSubmit={handlePasswordLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <input
                  type="tel"
                  maxLength={11}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="请输入手机号"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all duration-200 disabled:opacity-50"
              >
                {loading ? '登录中…' : '登录'}
              </button>
            </form>
          )}

          {/* Code Login Form */}
          {tab === 'code' && (
            <form onSubmit={handleCodeLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <input
                  type="tel"
                  maxLength={11}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="请输入手机号"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="请输入验证码"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={codeSending || countdown > 0}
                    className="shrink-0 px-4 py-3 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {countdown > 0 ? `${countdown}秒后重发` : codeSending ? '发送中…' : '获取验证码'}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium transition-all duration-200 disabled:opacity-50"
              >
                {loading ? '登录中…' : '登录'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            还没有账号？
            <Link to="/register" className="text-purple-600 hover:text-purple-700 font-medium ml-1">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
