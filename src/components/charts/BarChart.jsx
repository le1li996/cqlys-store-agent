import React from 'react'

// 纯 SVG 柱状图（支持目标线对比）。零外部依赖，任意浏览器原生支持。
export default function BarChart({ title, unit = '', data = [], showTarget = false }) {
  const W = 680
  const H = 280
  const padL = 44
  const padR = 16
  const padT = 28
  const padB = 46
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  const maxVal = Math.max(
    1,
    ...data.map((d) => Math.max(d.value, showTarget ? d.target || 0 : 0)),
  )
  const scale = plotH / (maxVal * 1.12)
  const slot = plotW / data.length
  const barW = Math.min(46, slot * 0.55)

  const yOf = (v) => padT + plotH - v * scale

  return (
    <div className="chart-card">
      {title && (
        <div className="chart-title">
          {title}
          {unit && <span className="chart-unit">（{unit}）</span>}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img" aria-label={title}>
        {/* 网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((g) => {
          const y = padT + plotH - plotH * g
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} className="grid-line" />
              <text x={padL - 8} y={y + 4} className="axis-label" textAnchor="end">
                {Math.round(maxVal * g)}
              </text>
            </g>
          )
        })}
        {/* 柱子 */}
        {data.map((d, i) => {
          const cx = padL + slot * i + slot / 2
          const x = cx - barW / 2
          const h = d.value * scale
          const y = yOf(d.value)
          const color = d.color || '#4F46E5'
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={Math.max(0, h)} rx={4} fill={color} opacity={0.92}>
                <title>{`${d.label}: ${d.value}${unit}`}</title>
              </rect>
              <text x={cx} y={y - 6} className="bar-value" textAnchor="middle">
                {d.value}
              </text>
              {showTarget && d.target != null && (
                <line
                  x1={x - 4}
                  y1={yOf(d.target)}
                  x2={x + barW + 4}
                  y2={yOf(d.target)}
                  className="target-line"
                />
              )}
              <text x={cx} y={H - padB + 18} className="axis-label" textAnchor="middle">
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
      {showTarget && <div className="chart-legend">— — 目标线</div>}
    </div>
  )
}
