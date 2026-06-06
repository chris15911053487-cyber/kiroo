/**
 * 雷达图 - 用于大五人格等多维度展示
 * SVG-based, no external dependencies
 */
interface RadarChartProps {
  data: Array<{ label: string; value: number; maxValue: number }>
  size?: number
  color?: string
}

export default function RadarChart({ data, size = 280, color = '#6366F1' }: RadarChartProps) {
  if (data.length < 3) return null

  const cx = size / 2
  const cy = size / 2
  const levels = 5
  const maxRadius = size * 0.35
  const labelRadius = maxRadius + 22

  const numAxes = data.length
  const angleStep = (2 * Math.PI) / numAxes

  // Calculate points for each level ring
  function getPoint(index: number, radius: number): { x: number; y: number } {
    const angle = angleStep * index - Math.PI / 2 // Start from top
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    }
  }

  // Data points (scaled)
  const dataPoints = data.map((d, i) => {
    const ratio = d.value / d.maxValue
    return getPoint(i, maxRadius * ratio)
  })

  // Axis endpoints
  const axisEndpoints = data.map((_, i) => getPoint(i, maxRadius))

  // Level rings
  const rings = []
  for (let l = 1; l <= levels; l++) {
    const r = (maxRadius / levels) * l
    const ringPoints = data.map((_, i) => getPoint(i, r))
    rings.push(
      <polygon
        key={`ring-${l}`}
        points={ringPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={l === levels ? 1.5 : 0.5}
      />
    )
  }

  return (
    <div className="flex justify-center">
      <svg width={size + 40} height={size + 40} viewBox={`-20 -20 ${size + 40} ${size + 40}`}>
        {/* Rings */}
        {rings}

        {/* Axes */}
        {axisEndpoints.map((ep, i) => (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={ep.x}
            y2={ep.y}
            stroke="#E5E7EB"
            strokeWidth={0.5}
          />
        ))}

        {/* Data polygon */}
        <polygon
          points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill={color}
          fillOpacity={0.15}
          stroke={color}
          strokeWidth={2}
        />

        {/* Data points */}
        {dataPoints.map((dp, i) => (
          <circle
            key={`dp-${i}`}
            cx={dp.x}
            cy={dp.y}
            r={4}
            fill={color}
            stroke="white"
            strokeWidth={2}
          />
        ))}

        {/* Labels */}
        {data.map((d, i) => {
          const lp = getPoint(i, labelRadius)
          return (
            <text
              key={`label-${i}`}
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-medium"
              fill="#374151"
              style={{ fontSize: '11px' }}
            >
              {d.label}
            </text>
          )
        })}

        {/* Score labels on data points */}
        {dataPoints.map((dp, i) => (
          <text
            key={`score-${i}`}
            x={dp.x}
            y={dp.y - 12}
            textAnchor="middle"
            className="text-xs font-bold"
            fill={color}
            style={{ fontSize: '10px' }}
          >
            {data[i].value}
          </text>
        ))}
      </svg>
    </div>
  )
}
