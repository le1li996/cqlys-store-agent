import React from 'react'

// 纯 SVG 折线图，支持单/多序列，以及左右双轴（用于量纲不同的序列，如 营收 vs 客流）。
export default function LineChart({ title, unit = '', labels = [], series = [] }) {
  const W = 680
  const H = 300
  const padL = 48
  const padR = 52
  const padT = 28
  const padB = 46
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const leftSeries = series.filter((s) => (s.axis || 'left') === 'left')
  const rightSeries = series.filter((s) => s.axis === 'right')
  const hasRight = rightSeries.length > 0

  const leftVals = leftSeries.flatMap((s) => s.values)
  const rightVals = rightSeries.flatMap((s) => s.values)
  const leftMax = Math.max(1, ...leftVals) * 1.12
  const rightMax = Math.max(1, ...rightVals) * 1.12

  const n = labels.length
  const xOf = (i) => padL + (n <= 1 ? plotW / 2 : (plotW * i) / (n - 1))
  const yLeft = (v) => padT + plotH - (v / leftMax) * plotH
  const yRight = (v) => padT + plotH - (v / rightMax) * plotH

  const pathOf = (vals, axis) => {
    const yf = axis === 'right' ? yRight : yLeft
    return vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yf(v).toFixed(1)}`).join(' ')
  }

  return (
    <div className="chart-card">
      {title && (
        <div className="chart-title">
          {title}
          {unit && <span className="chart-unit">（{unit}）</span>}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img" aria-label={title}>
        {/* 网格 + 左轴 */}
        {[0, 0.25, 0.5, 0.75, 1].map((g) => {
          const y = padT + plotH - plotH * g
          return (
            <g key={'g' + g}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} className="grid-line" />
              <text x={padL - 8} y={y + 4} className="axis-label" textAnchor="end">
                {Math.round(leftMax * g)}
              </text>
              {hasRight && (
                <text x={W - padR + 8} y={y + 4} className="axis-label" textAnchor="start">
                  {Math.round(rightMax * g)}
                </text>
              )}
            </g>
          )
        })}
        {/* X 轴标签（隔点显示避免拥挤） */}
        {labels.map((lb, i) => (
          <text
            key={i}
            x={xOf(i)}
            y={H - padB + 18}
            className="axis-label"
            textAnchor="middle"
          >
            {n > 8 && i % 2 === 1 ? '' : lb}
          </text>
        ))}
        {/* 折线 + 面积 */}
        {series.map((s, si) => {
          const axis = s.axis || 'left'
          const yf = axis === 'right' ? yRight : yLeft
          const d = pathOf(s.values, axis)
          const areaD =
            d +
            ` L${xOf(n - 1).toFixed(1)},${(padT + plotH).toFixed(1)} L${xOf(0).toFixed(1)},${(
              padT + plotH
            ).toFixed(1)} Z`
          return (
            <g key={si}>
              <path d={areaD} fill={s.color} opacity={0.1} />
              <path d={d} fill="none" stroke={s.color} strokeWidth={2.4} strokeLinejoin="round" />
              {s.values.map((v, i) => (
                <circle key={i} cx={xOf(i)} cy={yf(v)} r={3} fill="#fff" stroke={s.color} strokeWidth={2}>
                  <title>{`${labels[i]} ${s.name}: ${v}`}</title>
                </circle>
              ))}
            </g>
          )
        })}
      </svg>
      <div className="chart-legend">
        {series.map((s, i) => (
          <span key={i} className="legend-item">
            <i style={{ background: s.color }} />
            {s.name}
            {s.axis === 'right' ? '（右轴）' : ''}
          </span>
        ))}
      </div>
    </div>
  )
}
