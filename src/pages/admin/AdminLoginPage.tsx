import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) {
      setError('请输入用户名和密码')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '登录失败')

      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_info', JSON.stringify(data.admin))
      navigate('/admin/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">管理后台</h1>
          <p className="text-gray-500 text-sm mt-1">AI 测评小助手</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="请输入管理员用户名"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none text-sm"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white font-medium transition-all disabled:opacity-50"
            >
              {loading ? '登录中…' : '登录'}
            </button>
          </form>

          <p className="mt-4 text-center">
            <a href="/" className="text-sm text-gray-400 hover:text-purple-600 transition-colors">
              返回前台
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
