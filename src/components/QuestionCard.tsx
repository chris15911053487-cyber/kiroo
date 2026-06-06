import type { Question } from '../types'

interface QuestionCardProps {
  question: Question
  selectedOptionId: string | null
  onSelect: (optionId: string) => void
}

export default function QuestionCard({
  question,
  selectedOptionId,
  onSelect,
}: QuestionCardProps) {
  return (
    <div className="flex flex-col gap-3">
      {question.options.map(option => {
        const isSelected = selectedOptionId === option.id
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`w-full text-left px-5 py-4 rounded-2xl border-2 flex items-center gap-3.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 ${
              isSelected
                ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-violet-50 shadow-[0_4px_12px_rgba(99,102,241,0.1)]'
                : 'border-black/[0.04] bg-white hover:border-indigo-200 hover:bg-indigo-50/30'
            }`}
            aria-pressed={isSelected}
          >
            {/* Radio indicator */}
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
            }`}>
              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <span className={`text-sm ${isSelected ? 'text-indigo-800 font-semibold' : 'text-gray-600 font-medium'}`}>
              {option.text}
            </span>
          </button>
        )
      })}
    </div>
  )
}
