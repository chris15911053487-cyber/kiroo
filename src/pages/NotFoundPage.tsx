import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-purple-500 mb-4">404</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">页面未找到</h1>
        <p className="text-gray-500 mb-8">
          抱歉，您访问的页面不存在或已被移除。
        </p>
        <Link
          to="/"
          className="inline-block px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}
