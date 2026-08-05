import React from 'react'

// 纯 SVG 环形图。零外部依赖。
export default function DonutChart({ title, unit = '', data = [] }) {
  const size = 280
  const cx = 150
  const cy = 150
  const r = 96
  const stroke = 34
  const C = 2 * Math.PI * r
  const total = data.reduce((s, d) => s + d.value, 0) || 1

  let acc = 0
  const segments = data.map((d) => {
    const frac = d.value / total
    const len = frac * C
    const seg = {
      ...d,
      dash: `${len} ${C - len}`,
      offset: -acc * C,
      frac,
    }
    acc += frac
    return seg
  })

  return (
    <div className="chart-card">
      {title && (
        <div className="chart-title">
          {title}
          {unit && <span className="chart-unit">（{unit}）</span>}
        </div>
      )}
      <div className="donut-wrap">
        <svg viewBox={`0 0 ${size} ${size}`} className="donut-svg" role="img" aria-label={title}>
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {segments.map((s, i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color || '#4F46E5'}
                strokeWidth={stroke}
                strokeDasharray={s.dash}
                strokeDashoffset={s.offset}
              >
                <title>{`${s.label}: ${s.value}${unit}（${(s.frac * 100).toFixed(1)}%）`}</title>
              </circle>
            ))}
          </g>
          <text x={cx} y={cy - 4} className="donut-center-num" textAnchor="middle">
            {data.length}
          </text>
          <text x={cx} y={cy + 18} className="donut-center-label" textAnchor="middle">
            分类
          </text>
        </svg>
        <ul className="donut-legend">
          {segments.map((s, i) => (
            <li key={i}>
              <i style={{ background: s.color || '#4F46E5' }} />
              <span className="dl-name">{s.label}</span>
              <span className="dl-val">
                {s.value}
                {unit} · {(s.frac * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
