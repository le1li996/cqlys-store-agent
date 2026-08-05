import React, { useMemo, useState } from 'react'
import BarChart from './charts/BarChart.jsx'
import LineChart from './charts/LineChart.jsx'
import DonutChart from './charts/DonutChart.jsx'
import { analyzeModule } from '../services/diagnostics.js'
import { copyMarkdown, downloadSVG, printReport } from '../services/shareReport.js'

function ChartSwitch({ chart }) {
  if (chart.type === 'bar') return <BarChart {...chart} />
  if (chart.type === 'line') return <LineChart {...chart} />
  if (chart.type === 'donut') return <DonutChart {...chart} />
  return null
}

const SEV = {
  high: { cls: 'sev-high', label: '高风险' },
  mid: { cls: 'sev-mid', label: '需关注' },
  low: { cls: 'sev-low', label: '良好' },
}

// 模块分析报告：指标卡 + 图表 + 诊断 + 建议 + 操作
export default function ModuleReport({ module, onSaveReport, onAddDecision }) {
  const hasMetrics = module.metrics && module.metrics.length
  const hasCharts = module.charts && module.charts.length
  const hasDiag = module.diagnosis && module.diagnosis.length
  const hasSug = module.suggestions && module.suggestions.length

  // 数据驱动诊断（实时计算，非写死文案）
  const analysis = useMemo(() => analyzeModule(module.id), [module.id])
  const findings = analysis.hasData ? analysis.findings : null

  const [shareOpen, setShareOpen] = useState(false)
  const [toast, setToast] = useState('')
  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 1800)
  }

  const handleCopy = async () => {
    try {
      await copyMarkdown(module, analysis)
      flash('已复制 Markdown 报告')
    } catch (e) {
      flash('复制失败，请手动选择')
    }
    setShareOpen(false)
  }
  const handleSVG = () => {
    downloadSVG(module, analysis)
    flash('已下载分享图 (SVG)')
    setShareOpen(false)
  }
  const handlePrint = () => {
    printReport()
    setShareOpen(false)
  }

  return (
    <div className="report">
      <div className="report-head">
        <div>
          <h2 className="report-title">
            {module.icon} {module.name}
          </h2>
          <p className="report-desc">{module.description}</p>
        </div>
        <div className="report-actions">
          <button className="btn-primary sm" onClick={() => onSaveReport(module)}>
            📑 生成诊断报告
          </button>
          {hasSug && (
            <button className="btn-ghost sm" onClick={() => onAddDecision(module.suggestions[0], module.name)}>
              ＋ 加入决策清单
            </button>
          )}
          <div className="share-wrap">
            <button className="btn-ghost sm" onClick={() => setShareOpen((o) => !o)}>
              🔗 分享
            </button>
            {shareOpen && (
              <div className="share-menu" onMouseLeave={() => setShareOpen(false)}>
                <button onClick={handleCopy}>📋 复制 Markdown</button>
                <button onClick={handleSVG}>🖼 下载分享图 (SVG)</button>
                <button onClick={handlePrint}>🖨 打印 / 导出 PDF</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasMetrics && (
        <div className="metric-grid">
          {module.metrics.map((m, i) => (
            <div className="metric-card" key={i}>
              <div className="metric-label">{m.label}</div>
              <div className="metric-value">
                {m.value}
                {m.unit && <span className="metric-unit">{m.unit}</span>}
              </div>
              {m.delta != null && (
                <div className={`metric-delta ${m.trend}`}>
                  {m.trend === 'up' ? '▲' : '▼'} {Math.abs(m.delta)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasCharts && (
        <div className={`chart-grid ${module.charts.length > 1 ? 'multi' : ''}`}>
          {module.charts.map((c, i) => (
            <ChartSwitch chart={c} key={i} />
          ))}
        </div>
      )}

      {findings ? (
        <div className="report-block">
          <div className="report-block-title">
            📡 数据驱动洞察 <span className="live-badge">实时计算</span>
          </div>
          <div className="finding-list">
            {findings.map((fd, i) => (
              <div className={`finding ${SEV[fd.severity].cls}`} key={i}>
                <span className="sev-pill">{SEV[fd.severity].label}</span>
                <div className="finding-body">
                  <div className="finding-title">{fd.title}</div>
                  <div className="finding-detail">{fd.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : hasDiag ? (
        <div className="report-block">
          <div className="report-block-title">🩺 诊断结论</div>
          {module.diagnosis.map((p, i) => (
            <p className="report-para" key={i}>
              {p}
            </p>
          ))}
        </div>
      ) : null}

      {hasSug && (
        <div className="report-block">
          <div className="report-block-title">💡 行动建议</div>
          <ul className="sugg-list">
            {module.suggestions.map((s, i) => (
              <li key={i}>
                <span className="sugg-num">{i + 1}</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
