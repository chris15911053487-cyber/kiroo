import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()

  const [nickname, setNickname] = useState(user?.nickname || '')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (!user) return null

  async function handleUpdateNickname(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    try {
      const data = await authService.updateNickname(nickname)
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      updateUser({ nickname: data.nickname || nickname })
      setMessage({ type: 'success', text: '昵称修改成功' })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '修改失败' })
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密码至少6位' })
      return
    }
    setMessage(null)
    try {
      await authService.updatePassword(oldPassword, newPassword)
      setOldPassword('')
      setNewPassword('')
      setMessage({ type: 'success', text: '密码修改成功' })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '修改失败' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-gray-500 hover:text-purple-600 transition-colors text-sm">
            ← 返回首页
          </Link>
          <h1 className="text-xl font-bold text-gray-800">个人中心</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-lg">
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm text-center ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
            {user.nickname.charAt(0)}
          </div>
          <h2 className="text-lg font-semibold text-gray-800">{user.nickname}</h2>
          <p className="text-sm text-gray-400">{user.phone}</p>
        </div>

        {/* Edit Nickname */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">修改昵称</h3>
          <form onSubmit={handleUpdateNickname} className="flex gap-3">
            <input
              type="text"
              maxLength={50}
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none text-sm"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium text-sm transition-all"
            >
              保存
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="font-semibold text-gray-800 mb-4">修改密码</h3>
          <form onSubmit={handleUpdatePassword}>
            <input
              type="password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              placeholder="原密码"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none text-sm mb-3"
            />
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="新密码（至少6位）"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none text-sm mb-4"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium text-sm transition-all"
            >
              修改密码
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
