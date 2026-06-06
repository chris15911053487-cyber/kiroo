/**
 * 六边形图 - 用于霍兰德职业兴趣六维度展示
 * SVG-based, no external dependencies
 */
interface HexagonChartProps {
  data: Array<{ label: string; value: number; maxValue: number }>
  size?: number
  color?: string
}

export default function HexagonChart({ data, size = 280, color = '#10B981' }: HexagonChartProps) {
  if (data.length !== 6) {
    // Fallback: render as radar chart style for non-6 data
    return (
      <div className="text-center text-gray-400 text-sm py-8">
        霍兰德六边形需要6个维度数据
      </div>
    )
  }

  const cx = size / 2
  const cy = size / 2
  const maxRadius = size * 0.35
  const labelRadius = maxRadius + 28

  // Holland RIASEC order: R, I, A, S, E, C
  // Start from top-right and go clockwise
  const startAngle = -Math.PI / 6 // -30 degrees

  function getPoint(index: number, radius: number): { x: number; y: number } {
    const angle = startAngle + (Math.PI / 3) * index
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    }
  }

  // Hexagon corners
  const hexPoints = data.map((_, i) => getPoint(i, maxRadius))

  // Data polygon
  const dataPoints = data.map((d, i) => {
    const ratio = d.value / d.maxValue
    return getPoint(i, maxRadius * ratio)
  })

  return (
    <div className="flex justify-center">
      <svg width={size + 60} height={size + 60} viewBox={`-30 -30 ${size + 60} ${size + 60}`}>
        {/* Grid levels */}
        {[0.25, 0.5, 0.75, 1].map(level => {
          const pts = data.map((_, i) => getPoint(i, maxRadius * level))
          return (
            <polygon
              key={`level-${level}`}
              points={pts.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth={level === 1 ? 1.5 : 0.5}
            />
          )
        })}

        {/* Axes from center to corners */}
        {hexPoints.map((hp, i) => (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={hp.x}
            y2={hp.y}
            stroke="#E5E7EB"
            strokeWidth={0.5}
          />
        ))}

        {/* Data polygon */}
        <polygon
          points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill={color}
          fillOpacity={0.2}
          stroke={color}
          strokeWidth={2.5}
        />

        {/* Data points */}
        {dataPoints.map((dp, i) => (
          <circle
            key={`dp-${i}`}
            cx={dp.x}
            cy={dp.y}
            r={5}
            fill={color}
            stroke="white"
            strokeWidth={2}
          />
        ))}

        {/* Labels */}
        {data.map((d, i) => {
          const lp = getPoint(i, labelRadius)
          return (
            <g key={`label-${i}`}>
              <text
                x={lp.x}
                y={lp.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-bold"
                fill="#374151"
                style={{ fontSize: '13px' }}
              >
                {d.label}
              </text>
            </g>
          )
        })}

        {/* Score labels */}
        {dataPoints.map((dp, i) => (
          <text
            key={`score-${i}`}
            x={dp.x}
            y={dp.y - 14}
            textAnchor="middle"
            className="font-bold"
            fill={color}
            style={{ fontSize: '11px' }}
          >
            {data[i].value}
          </text>
        ))}
      </svg>
    </div>
  )
}
