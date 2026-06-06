interface LoadingSpinnerProps {
  label?: string
}

export default function LoadingSpinner({ label = '加载中…' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-600 text-lg">{label}</p>
    </div>
  )
}
