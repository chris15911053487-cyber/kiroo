import { Link, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const location = useLocation()

  // 隐藏BottomNav的页面
  const hideOn = [
    '/',        // HelloPage
    '/login',
    '/register',
    '/submitted',
    '/admin/',
  ]
  const isQuiz = location.pathname.startsWith('/quiz/')
  const shouldHide = hideOn.some(p => location.pathname === p || location.pathname.startsWith(p)) || isQuiz

  if (shouldHide) {
    return null
  }

  const navItems = [
    { path: '/select', icon: '🧭', label: '探索' },
    { path: '/history', icon: '📊', label: '报告' },
    { path: '/profile', icon: '👤', label: '我的' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 backdrop-blur-xl border-t border-gray-100">
      <div className="flex items-center justify-around h-16 pb-safe">
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.path)

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${
                isActive ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
