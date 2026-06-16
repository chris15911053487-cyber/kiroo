import type { Questionnaire, QuestionnaireCategory } from '../types'

interface QuestionnaireCardProps {
  questionnaire: Questionnaire
  onStart: (id: string) => void
}

const CATEGORY_LABELS: Record<QuestionnaireCategory, string> = {
  personality: '人格测试',
  temperament: '气质类型',
  mbti: 'MBTI',
  leadership: '领导风格',
  career: '职业兴趣',
  big5: '大五人格',
  '16pf': '16PF',
  creativity: '创造力',
  holland: '霍兰德',
  'lzu-leadership': '领导风格',
  'lzu-personality': '人格测试',
  'lzu-creativity': '创造力',
  'family-business': '家族企业',
}

const CATEGORY_ICONS: Record<QuestionnaireCategory, string> = {
  personality: '🧠',
  temperament: '💫',
  mbti: '⚡',
  leadership: '👑',
  career: '🎯',
  big5: '🔬',
  '16pf': '📐',
  creativity: '💡',
  holland: '🧭',
  'lzu-leadership': '👑',
  'lzu-personality': '🧠',
  'lzu-creativity': '💡',
  'family-business': '🏢',
}

const CATEGORY_ICON_BG: Record<QuestionnaireCategory, string> = {
  personality: 'bg-gradient-to-br from-violet-50 to-purple-50',
  temperament: 'bg-gradient-to-br from-pink-50 to-orange-50',
  mbti: 'bg-gradient-to-br from-blue-50 to-indigo-50',
  leadership: 'bg-gradient-to-br from-amber-50 to-yellow-50',
  career: 'bg-gradient-to-br from-teal-50 to-emerald-50',
  big5: 'bg-gradient-to-br from-cyan-50 to-blue-50',
  '16pf': 'bg-gradient-to-br from-slate-50 to-gray-50',
  creativity: 'bg-gradient-to-br from-yellow-50 to-orange-50',
  holland: 'bg-gradient-to-br from-green-50 to-teal-50',
  'lzu-leadership': 'bg-gradient-to-br from-amber-50 to-yellow-50',
  'lzu-personality': 'bg-gradient-to-br from-violet-50 to-purple-50',
  'lzu-creativity': 'bg-gradient-to-br from-yellow-50 to-orange-50',
  'family-business': 'bg-gradient-to-br from-sky-50 to-blue-50',
}

const CATEGORY_BADGE: Record<QuestionnaireCategory, string> = {
  personality: 'bg-purple-50 text-purple-600',
  temperament: 'bg-pink-50 text-pink-600',
  mbti: 'bg-indigo-50 text-indigo-600',
  leadership: 'bg-amber-50 text-amber-600',
  career: 'bg-teal-50 text-teal-600',
  big5: 'bg-cyan-50 text-cyan-600',
  '16pf': 'bg-slate-50 text-slate-600',
  creativity: 'bg-orange-50 text-orange-600',
  holland: 'bg-emerald-50 text-emerald-600',
  'lzu-leadership': 'bg-amber-50 text-amber-600',
  'lzu-personality': 'bg-violet-50 text-violet-600',
  'lzu-creativity': 'bg-orange-50 text-orange-600',
  'family-business': 'bg-sky-50 text-sky-600',
}

/** 估算答题时间（每题约 30 秒） */
function estimateTime(questionCount: number): string {
  const minutes = Math.ceil((questionCount * 0.5))
  if (minutes < 1) return '<1 分钟'
  return `约 ${minutes} 分钟`
}

export default function QuestionnaireCard({ questionnaire, onStart }: QuestionnaireCardProps) {
  const categoryLabel = CATEGORY_LABELS[questionnaire.category] ?? questionnaire.category
  const categoryIcon = CATEGORY_ICONS[questionnaire.category] ?? '📋'
  const iconBg = CATEGORY_ICON_BG[questionnaire.category] ?? 'bg-gray-50'
  const badgeStyle = CATEGORY_BADGE[questionnaire.category] ?? 'bg-gray-50 text-gray-600'
  const questionCount = questionnaire.questions?.length ?? 0

  return (
    <div className="bg-white border border-black/[0.04] rounded-2xl p-5 flex flex-col gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.08)] hover:-translate-y-0.5 transition-all duration-200">
      {/* 顶部：图标 + 分类标签 */}
      <div className="flex justify-between items-start">
        <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center text-xl ${iconBg}`}>
          {categoryIcon}
        </div>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${badgeStyle}`}>
          {categoryLabel}
        </span>
      </div>

      {/* 标题 */}
      <h3 className="text-[15px] font-bold text-[#1a1a2e] leading-tight">{questionnaire.name}</h3>

      {/* 描述 */}
      <p className="text-xs text-gray-400 leading-relaxed flex-1">{questionnaire.description}</p>

      {/* 底部：元信息 + 开始按钮 */}
      <div className="flex justify-between items-center pt-1">
        <div className="flex gap-3 text-[11px] text-gray-300 font-medium">
          <span>⏱ {estimateTime(questionCount)}</span>
          {questionCount > 0 && <span>📋 {questionCount}题</span>}
        </div>
        <button
          onClick={() => onStart(questionnaire.id)}
          className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold shadow-[0_3px_10px_rgba(99,102,241,0.2)] hover:scale-[1.03] transition-transform"
        >
          开始
        </button>
      </div>
    </div>
  )
}
