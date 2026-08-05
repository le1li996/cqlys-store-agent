// 报告导出 / 分享工具（零依赖，规避 CSP）
// ============================================================
// 把诊断结论变成「可带走、可传播」的交付物：
//   - 复制 Markdown：贴到企微 / 文档 / 邮件
//   - 下载 SVG 分享卡：品牌化竖版卡片，任意浏览器原生支持，可直接发图
//   - 打印 / PDF：浏览器打印为 PDF
// 全部不依赖任何图表库或外部脚本，规避外部分享时的 CSP 拦截。
// ============================================================

import { storeProfile } from '../data/storeProfile.js'

const SEV = {
  high: { label: '高风险', color: '#EF4444' },
  mid: { label: '需关注', color: '#F59E0B' },
  low: { label: '良好', color: '#10B981' },
}

function today() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// ---------- Markdown ----------
export function reportToMarkdown(module, analysis) {
  const store = storeProfile
  const lines = []
  lines.push('# 门店经营智脑 · 数据驱动诊断报告')
  lines.push('')
  lines.push(`**模块：** ${module.icon || ''} ${module.name}`)
  lines.push(`**门店：** ${store.name}（${store.region}）`)
  lines.push(`**数据日期：** ${store.updatedAt}`)
  lines.push('')

  if (module.metrics && module.metrics.length) {
    lines.push('## 指标概览')
    lines.push('')
    lines.push('| 指标 | 数值 | 环比 |')
    lines.push('| --- | --- | --- |')
    module.metrics.forEach((m) => {
      const d = m.delta != null ? `${m.trend === 'up' ? '▲' : '▼'} ${Math.abs(m.delta)}${m.unit || ''}` : '—'
      lines.push(`| ${m.label} | ${m.value}${m.unit || ''} | ${d} |`)
    })
    lines.push('')
  }

  if (analysis.hasData && analysis.findings) {
    lines.push('## 数据驱动洞察')
    lines.push('')
    const groups = { high: [], mid: [], low: [] }
    analysis.findings.forEach((f) => groups[f.severity].push(f))
    ;['high', 'mid', 'low'].forEach((sev) => {
      if (!groups[sev].length) return
      lines.push(`### ${SEV[sev].label}`)
      groups[sev].forEach((f) => lines.push(`- **${f.title}**：${f.detail}`))
      lines.push('')
    })
  } else if (module.diagnosis && module.diagnosis.length) {
    lines.push('## 诊断结论')
    lines.push('')
    module.diagnosis.forEach((p) => lines.push(`- ${p}`))
    lines.push('')
  }

  if (module.suggestions && module.suggestions.length) {
    lines.push('## 行动建议')
    lines.push('')
    module.suggestions.forEach((s, i) => lines.push(`${i + 1}. ${s}`))
    lines.push('')
  }

  lines.push('---')
  lines.push(`*本报告由「门店经营智脑」自动生成 · 生成于 ${today()} · 演示数据*`)
  return lines.join('\n')
}

// ---------- SVG 分享卡 ----------
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function wrapText(text, max) {
  const out = []
  let line = ''
  for (const ch of String(text)) {
    line += ch
    if (line.length >= max) {
      out.push(line)
      line = ''
    }
  }
  if (line) out.push(line)
  return out
}

export function reportToSVG(module, analysis) {
  const store = storeProfile
  const W = 800
  const items = analysis.hasData && analysis.findings ? analysis.findings.slice(0, 4) : []
  const H = 360 + items.length * 104 + 70

  const sevCounts = { high: 0, mid: 0, low: 0 }
  items.forEach((f) => {
    sevCounts[f.severity] += 1
  })

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif">`
  svg += `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4F46E5"/><stop offset="1" stop-color="#E11D48"/></linearGradient></defs>`
  svg += `<rect width="${W}" height="${H}" fill="#ffffff"/>`
  svg += `<rect x="0" y="0" width="${W}" height="120" fill="url(#g)"/>`

  // 品牌头
  svg += `<rect x="32" y="34" width="52" height="52" rx="14" fill="#ffffff" opacity="0.18"/>`
  svg += `<text x="58" y="71" font-size="26" font-weight="800" fill="#ffffff" text-anchor="middle">店</text>`
  svg += `<text x="100" y="58" font-size="22" font-weight="800" fill="#ffffff">门店经营智脑</text>`
  svg += `<text x="100" y="84" font-size="13" fill="#ffffff" opacity="0.85">数据驱动诊断报告</text>`

  // 模块名 + 门店
  svg += `<text x="32" y="172" font-size="26" font-weight="800" fill="#1f2430">${esc(module.icon || '')} ${esc(module.name)}</text>`
  svg += `<text x="32" y="202" font-size="14" fill="#6b7280">${esc(store.name)} · ${esc(store.region)} · 数据截至 ${esc(store.updatedAt)}</text>`

  // 评分 或 计数
  let y = 250
  if (analysis.score != null) {
    const col = analysis.score >= 80 ? '#10B981' : analysis.score >= 70 ? '#F59E0B' : '#EF4444'
    svg += `<circle cx="72" cy="${y + 24}" r="40" fill="none" stroke="#e7e9f2" stroke-width="8"/>`
    svg += `<circle cx="72" cy="${y + 24}" r="40" fill="none" stroke="${col}" stroke-width="8" stroke-dasharray="${((analysis.score / 100) * 251).toFixed(1)} 251" transform="rotate(-90 72 ${y + 24})"/>`
    svg += `<text x="72" y="${y + 33}" font-size="22" font-weight="800" fill="${col}" text-anchor="middle">${analysis.score}</text>`
    svg += `<text x="128" y="${y + 14}" font-size="14" fill="#6b7280">综合健康度</text>`
    svg += `<text x="128" y="${y + 38}" font-size="13" fill="#9aa0ad">满分 100 · 实时计算</text>`
    y += 86
  } else {
    svg += `<text x="32" y="${y + 10}" font-size="14" fill="#6b7280">本模块实时计算发现 ${items.length} 项</text>`
    y += 40
  }

  // 严重度分布条
  const barY = y
  const total = items.length || 1
  let bx = 32
  const bw = W - 64
  ;['high', 'mid', 'low'].forEach((sev) => {
    const w = (sevCounts[sev] / total) * bw
    if (w > 0.5) {
      svg += `<rect x="${bx.toFixed(1)}" y="${barY}" width="${w.toFixed(1)}" height="10" fill="${SEV[sev].color}"/>`
      bx += w
    }
  })
  y += 30

  // 分隔线
  svg += `<line x1="32" y1="${y}" x2="${W - 32}" y2="${y}" stroke="#e7e9f2"/>`
  y += 26

  if (items.length) {
    items.forEach((f) => {
      const c = SEV[f.severity].color
      svg += `<circle cx="42" cy="${y + 10}" r="7" fill="${c}"/>`
      svg += `<text x="60" y="${y + 15}" font-size="16" font-weight="700" fill="#1f2430">${esc(f.title)}</text>`
      svg += `<rect x="${W - 32 - 58}" y="${y}" width="58" height="22" rx="11" fill="${c}" opacity="0.12"/>`
      svg += `<text x="${W - 32 - 29}" y="${y + 15}" font-size="12" font-weight="700" fill="${c}" text-anchor="middle">${esc(SEV[f.severity].label)}</text>`
      const lines = wrapText(f.detail, 27)
      lines.slice(0, 2).forEach((ln, i) => {
        svg += `<text x="60" y="${y + 40 + i * 22}" font-size="13" fill="#6b7280">${esc(ln)}</text>`
      })
      y += 104
    })
  } else {
    svg += `<text x="32" y="${y + 20}" font-size="14" fill="#6b7280">本模块为通用对话模块，无结构化诊断数据。</text>`
    y += 40
  }

  // 落款
  svg += `<line x1="32" y1="${H - 50}" x2="${W - 32}" y2="${H - 50}" stroke="#e7e9f2"/>`
  svg += `<text x="32" y="${H - 22}" font-size="12" fill="#9aa0ad">门店经营智脑 · 生成于 ${today()}</text>`
  svg += `<text x="${W - 32}" y="${H - 22}" font-size="12" fill="#9aa0ad" text-anchor="end">演示数据</text>`
  svg += `</svg>`
  return svg
}

// ---------- 下载 / 复制 / 打印 ----------
export function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadSVG(module, analysis) {
  const svg = reportToSVG(module, analysis)
  const safe = (module.name || 'report').replace(/[^\w一-龥]/g, '_')
  downloadBlob(`门店经营智脑_${safe}.svg`, svg, 'image/svg+xml;charset=utf-8')
}

export function copyMarkdown(module, analysis) {
  const md = reportToMarkdown(module, analysis)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(md)
  }
  const ta = document.createElement('textarea')
  ta.value = md
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
  } catch (e) {
    /* 忽略 */
  }
  document.body.removeChild(ta)
  return Promise.resolve()
}

export function printReport() {
  document.body.classList.add('printing')
  const restore = () => {
    document.body.classList.remove('printing')
    window.removeEventListener('afterprint', restore)
  }
  window.addEventListener('afterprint', restore)
  window.print()
}
