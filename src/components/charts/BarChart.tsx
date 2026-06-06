/**
 * 柱状图 - 用于16PF等因子得分展示
 * SVG-based, no external dependencies
 */
interface BarChartProps {
  data: Array<{ label: string; value: number; maxValue: number }>
  width?: number
  height?: number
  color?: string
}

export default function BarChart({ data, width = 600, height = 300, color = '#6366F1' }: BarChartProps) {
  if (data.length === 0) return null

  const padding = { top: 20, right: 20, bottom: 40, left: 20 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const maxVal = Math.max(...data.map(d => d.maxValue))
  const barWidth = Math.min(36, (chartW / data.length) * 0.7)
  const gap = chartW / data.length

  // Color scale based on value ratio
  function getBarColor(value: number, max: number): string {
    const ratio = value / max
    if (ratio >= 0.7) return '#10B981'
    if (ratio >= 0.5) return color
    if (ratio >= 0.35) return '#F59E0B'
    return '#EF4444'
  }

  return (
    <div className="overflow-x-auto">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const y = padding.top + chartH * (1 - ratio)
          return (
            <g key={`grid-${ratio}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#F3F4F6"
                strokeWidth={1}
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="text-xs"
                fill="#9CA3AF"
              >
                {Math.round(maxVal * ratio)}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = (d.value / maxVal) * chartH
          const x = padding.left + gap * i + (gap - barWidth) / 2
          const y = padding.top + chartH - barH
          const barColor = getBarColor(d.value, d.maxValue)

          return (
            <g key={`bar-${i}`}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 2)}
                rx={3}
                fill={barColor}
                className="transition-all duration-500"
              >
                <title>{`${d.label}: ${d.value}`}</title>
              </rect>
              {/* Value label */}
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="text-xs font-bold"
                fill={barColor}
                style={{ fontSize: '10px' }}
              >
                {d.value}
              </text>
              {/* Label */}
              <text
                x={x + barWidth / 2}
                y={padding.top + chartH + 16}
                textAnchor="middle"
                className="text-xs"
                fill="#6B7280"
                style={{ fontSize: '10px' }}
                transform={`rotate(-30, ${x + barWidth / 2}, ${padding.top + chartH + 16})`}
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
