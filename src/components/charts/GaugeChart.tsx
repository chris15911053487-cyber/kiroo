/**
 * 仪表盘图表 - 用于展示综合得分
 * SVG-based, no external dependencies
 */
interface GaugeChartProps {
  value: number      // 0-100
  min?: number       // default 65
  max?: number       // default 85
  label?: string
  size?: number
}

export default function GaugeChart({ value, min = 65, max = 85, label, size = 200 }: GaugeChartProps) {
  const strokeWidth = 16
  const radius = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size * 0.65

  // Arc path for the gauge
  const startAngle = -140  // degrees, start from left-bottom
  const endAngle = 140     // degrees, end at right-bottom
  const range = max - min
  const pct = Math.max(0, Math.min(1, (value - min) / range))
  const currentAngle = startAngle + (endAngle - startAngle) * pct

  function polarToCartesian(angle: number, r: number): { x: number; y: number } {
    const rad = (angle * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function describeArc(start: number, end: number, r: number): string {
    const s = polarToCartesian(start, r)
    const e = polarToCartesian(end, r)
    const largeArc = end - start > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`
  }

  // Color based on score
  const getColor = (v: number) => {
    if (v >= 80) return '#10B981'  // emerald
    if (v >= 75) return '#6366F1'  // indigo
    if (v >= 70) return '#F59E0B'  // amber
    return '#EF4444'               // red
  }

  const color = getColor(value)

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background arc */}
        <path
          d={describeArc(startAngle, endAngle, radius)}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={describeArc(startAngle, currentAngle, radius)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
        {/* Center value */}
        <text
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          className="text-3xl font-extrabold"
          fill={color}
          style={{ fontSize: size * 0.18 }}
        >
          {value}
        </text>
        {/* Min label */}
        <text
          x={polarToCartesian(startAngle, radius + 20).x}
          y={polarToCartesian(startAngle, radius + 20).y + 4}
          textAnchor="middle"
          className="text-xs"
          fill="#9CA3AF"
        >
          {min}
        </text>
        {/* Max label */}
        <text
          x={polarToCartesian(endAngle, radius + 20).x}
          y={polarToCartesian(endAngle, radius + 20).y + 4}
          textAnchor="middle"
          className="text-xs"
          fill="#9CA3AF"
        >
          {max}
        </text>
      </svg>
      {label && (
        <p className="text-sm text-gray-500 mt-1">{label}</p>
      )}
    </div>
  )
}
