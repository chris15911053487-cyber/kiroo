/**
 * 环形图 - 用于领导风格等类别分布展示
 * SVG-based, no external dependencies
 */
interface PieChartProps {
  data: Array<{ label: string; value: number; color?: string }>
  size?: number
  innerRadius?: number   // 0 = pie, >0 = donut
  showLegend?: boolean
}

const DEFAULT_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4']

export default function PieChart({ data, size = 240, innerRadius = 60, showLegend = true }: PieChartProps) {
  if (data.length === 0) return null

  const cx = size / 2
  const cy = size / 2
  const outerRadius = size * 0.4
  const innerR = (innerRadius / 100) * outerRadius

  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return null

  // Calculate segments
  let currentAngle = -Math.PI / 2 // Start from top

  const segments = data.map((d, i) => {
    const pct = d.value / total
    const angle = pct * 2 * Math.PI
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    const x1 = cx + outerRadius * Math.cos(startAngle)
    const y1 = cy + outerRadius * Math.sin(startAngle)
    const x2 = cx + outerRadius * Math.cos(endAngle)
    const y2 = cy + outerRadius * Math.sin(endAngle)

    const largeArc = angle > Math.PI ? 1 : 0

    const color = d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
    const pctStr = Math.round(pct * 100)

    // For donut
    const path = innerR > 0
      ? `M ${cx + innerR * Math.cos(startAngle)} ${cy + innerR * Math.sin(startAngle)}
         L ${x1} ${y1}
         A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
         L ${cx + innerR * Math.cos(endAngle)} ${cy + innerR * Math.sin(endAngle)}
         A ${innerR} ${innerR} 0 ${largeArc} 0 ${cx + innerR * Math.cos(startAngle)} ${cy + innerR * Math.sin(startAngle)} Z`
      : `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${cx} ${cy} Z`

    // Label position (mid-angle, mid-radius)
    const midAngle = startAngle + angle / 2
    const labelR = innerR > 0 ? (outerRadius + innerR) / 2 : outerRadius * 0.65

    return {
      path,
      color,
      label: d.label,
      pct: pctStr,
      labelX: cx + labelR * Math.cos(midAngle),
      labelY: cy + labelR * Math.sin(midAngle),
    }
  })

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, i) => (
          <g key={`seg-${i}`}>
            <path
              d={seg.path}
              fill={seg.color}
              stroke="white"
              strokeWidth={2}
              className="transition-all duration-500 hover:opacity-80"
            >
              <title>{`${seg.label}: ${seg.pct}%`}</title>
            </path>
            {/* Percentage label */}
            {seg.pct > 5 && (
              <text
                x={seg.labelX}
                y={seg.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                className="font-bold"
                style={{ fontSize: '11px' }}
              >
                {seg.pct}%
              </text>
            )}
          </g>
        ))}
        {/* Center text for donut */}
        {innerR > 0 && (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-sm"
            fill="#6B7280"
          >
            总计
          </text>
        )}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-3 mt-3">
          {segments.map((seg, i) => (
            <div key={`legend-${i}`} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs text-gray-600">
                {seg.label} ({seg.pct}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
