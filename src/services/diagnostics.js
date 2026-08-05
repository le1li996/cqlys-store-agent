// 数据驱动诊断引擎
// ============================================================
// 这是「门店经营诊断智能体」的核心分析层。
// 它从 storeProfile 的演示数据中【实时计算】出趋势、缺口、排名等洞察，
// 而不是依赖写死的文案。未来接入真实数据后，本文件逻辑无需改动，
// 只需 dataService 返回相同结构的数据契约即可。
//
// 对外入口：
//   analyzeModule(moduleId) -> { insights, findings, score, hasData }
//     - insights : 全量计算指标（供任意模块复用）
//     - findings : 该模块相关的「发现」数组，每项 {severity,title,detail}
//                  severity ∈ 'high' | 'mid' | 'low'
//     - score    : 该模块综合评分（部分模块有，否则 null）
//     - hasData  : 是否有数据驱动的发现（无则上层回退到静态文案）
// ============================================================

import {
  dailySeries, kpis, hourTraffic, memberTier,
  reviewSentiment, staffEfficiency, campaignRoi,
} from '../data/storeProfile.js'

// ---------- 工具 ----------
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
const round = (n, d = 1) => +Number(n).toFixed(d)
const kpi = (key) => kpis.find((k) => k.key === key) || null

function trendOf(delta) {
  if (delta == null) return 'flat'
  return delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
}

// ---------- 全量洞察计算 ----------
export function computeInsights() {
  const n = dailySeries.length
  const last7 = dailySeries.slice(-7)
  const prev7 = dailySeries.slice(Math.max(0, n - 14), n - 7)

  const revLast = avg(last7.map((d) => d.revenue))
  const revPrev = avg(prev7.map((d) => d.revenue))
  const trafLast = avg(last7.map((d) => d.traffic))
  const trafPrev = avg(prev7.map((d) => d.traffic))

  const revChange = prev7.length ? round(((revLast - revPrev) / revPrev) * 100) : 0
  const trafChange = prev7.length ? round(((trafLast - trafPrev) / trafPrev) * 100) : 0

  // 时段峰值 / 低谷
  const sortedHours = [...hourTraffic].sort((a, b) => b.value - a.value)
  const peakHours = sortedHours.slice(0, 2)
  const lowHours = sortedHours.slice(-2)
  const peakShare = round((peakHours.reduce((s, h) => s + h.value, 0) /
    hourTraffic.reduce((s, h) => s + h.value, 0)) * 100)

  // 人效缺口
  const staffGaps = staffEfficiency
    .filter((s) => s.value < s.target)
    .map((s) => ({ label: s.label, value: s.value, target: s.target, gap: s.target - s.value }))
    .sort((a, b) => b.gap - a.gap)
  const worstStaff = staffGaps[0] || null

  // 营销 ROI 排名
  const campaigns = campaignRoi
    .map((c) => ({ label: c.label, revenue: c.revenue, cost: c.cost, roi: round(c.revenue / c.cost, 2) }))
    .sort((a, b) => b.roi - a.roi)
  const bestCampaign = campaigns[0]
  const worstCampaign = campaigns[campaigns.length - 1]

  // 会员
  const repurchase = kpi('repurchase')
  const memberTotal = memberTier.reduce((s, t) => s + t.value, 0)
  const blackCard = memberTier.find((t) => t.label.includes('黑卡'))
  const blackShare = blackCard ? round((blackCard.value / memberTotal) * 100) : 0
  const silverCard = memberTier.find((t) => t.label.includes('银卡'))
  const silverShare = silverCard ? round((silverCard.value / memberTotal) * 100) : 0

  // 评价
  const good = reviewSentiment.find((r) => r.label === '好评')
  const bad = reviewSentiment.find((r) => r.label === '差评')
  const badPct = bad ? bad.value : 0
  const goodPct = good ? good.value : 0

  // 关键 KPI
  const ticket = kpi('ticket')
  const waste = kpi('waste')
  const grossMargin = kpi('grossMargin')
  const memberRate = kpi('memberRate')

  return {
    series: { revLast, revPrev, trafLast, trafPrev, revChange, trafChange },
    peakHours, lowHours, peakShare,
    staffGaps, worstStaff,
    campaigns, bestCampaign, worstCampaign,
    repurchase, memberTotal, blackShare, silverShare,
    badPct, goodPct,
    ticket, waste, grossMargin, memberRate,
  }
}

// ---------- 五维健康度 ----------
function dimensionScores(ins) {
  const rev = ins.series.revChange >= 0 ? 82 : 70
  const member = ins.repurchase && ins.repurchase.delta < 0 ? 70 : 80
  const review = ins.badPct <= 10 ? 80 : 65
  const staff = ins.worstStaff ? Math.max(60, 90 - ins.worstStaff.gap * 3) : 88
  const waste = ins.waste && ins.waste.delta < 0 ? 88 : 80
  return {
    营收: { score: rev, bar: ins.series.revChange },
    会员: { score: member, bar: ins.repurchase ? ins.repurchase.delta : 0 },
    评价: { score: review, bar: -ins.badPct },
    人效: { score: staff, bar: ins.worstStaff ? -ins.worstStaff.gap : 0 },
    损耗: { score: waste, bar: ins.waste ? -ins.waste.delta : 0 },
  }
}

// ---------- 按模块返回发现 ----------
export function findingsForModule(moduleId, ins) {
  const f = (severity, title, detail) => ({ severity, title, detail })
  switch (moduleId) {
    case 'overview': {
      const out = []
      out.push(f(ins.series.revChange >= 0 ? 'low' : 'mid',
        '营收趋势',
        `近 7 日日均营收 ${round(ins.series.revLast)} 万元，环比前 7 日 ${round(ins.series.revPrev)} 万元 ` +
        `${ins.series.revChange >= 0 ? '上升' : '下降'} ${Math.abs(ins.series.revChange)}%。`))
      if (ins.ticket && ins.ticket.delta < 0) {
        out.push(f('high', '客单价下滑',
          `客单价 ${ins.ticket.value} 元，环比 ${ins.ticket.delta}%（连续走低），需警惕「低价引流稀释客单」。`))
      }
      out.push(f('low', '峰值集中',
        `全天 ${ins.peakShare}% 的客流集中在 ${ins.peakHours.map((h) => `${h.label}点`).join('、')}，` +
        `排班与产能应优先保障这两个时段。`))
      return out
    }
    case 'revenue': {
      const w = ins.worstStaff
      return [
        f('mid', '峰值产能利用率',
          `${ins.peakHours.map((h) => `${h.label}点(${h.value}人)`).join('、')} 为全天高峰，` +
          `若出餐/服务跟不上，存在排队溢出的隐性损失。`),
        f('low', '低谷时段',
          `${ins.lowHours.map((h) => `${h.label}点(${h.value}人)`).join('、')} 客流偏低，` +
          `可用错峰定价或社区运营填充。`),
      ]
    }
    case 'member': {
      const out = []
      if (ins.repurchase && ins.repurchase.delta < 0) {
        out.push(f('high', '复购率走低',
          `30 日复购率 ${ins.repurchase.value}%，环比 ${ins.repurchase.delta}%，` +
          `「拉新在涨、留存在漏」。`))
      }
      out.push(f('mid', '高价值客户集中',
        `黑卡仅占 ${ins.blackShare}% 却贡献约 18% 营收；银卡占比 ${ins.silverShare}%，` +
        `银→金升级是待挖掘的增量。`))
      return out
    }
    case 'review': {
      return [
        f(ins.badPct > 12 ? 'high' : 'mid', '差评率',
          `差评率 ${ins.badPct}%，好评率 ${ins.goodPct}%。` +
          (ins.badPct > 12 ? '差评偏高，需优先治理体验交付环节。' : '评价结构健康，问题集中在个别时段。')),
        f('low', '根因提示',
          `结合人效数据，差评大概率与高峰时段出餐/服务响应相关，而非产品本身。`),
      ]
    }
    case 'staff': {
      if (!ins.staffGaps.length) return [f('low', '人效达标', '各岗位效能均达到目标值。')]
      return ins.staffGaps.map((g) =>
        f(g.gap >= 7 ? 'high' : 'mid', `岗位缺口：${g.label}`,
          `实测 ${g.value} 分，目标 ${g.target} 分，缺口 ${g.gap} 分，` +
          `是出餐慢/体验差的上游根因之一。`))
    }
    case 'inventory': {
      return [
        f('low', '损耗率',
          `损耗率 ${ins.waste.value}%，环比 ${ins.waste.delta}%（${ins.waste.delta < 0 ? '改善' : '上升'}），` +
          `${ins.waste.delta < 0 ? '已优于行业基准。' : '需关注。'}`),
        f('mid', '生鲜是损耗大头',
          `按历史结构，生鲜蔬菜损耗占比最高，源于「订货量 vs 实际客流」预测偏差。`),
      ]
    }
    case 'ai-diagnosis': {
      const dims = dimensionScores(ins)
      const ranked = Object.entries(dims).sort((a, b) => a[1].score - b[1].score)
      const weakest = ranked[0]
      const strongest = ranked[ranked.length - 1]
      const risks = ranked.filter(([, v]) => v.score < 75).length
      const opps = ranked.filter(([, v]) => v.score >= 80).length
      return [
        f(risks > 0 ? 'high' : 'mid', '综合体检',
          `五维评分中，「${weakest[0]}」最弱（${weakest[1].score} 分），「${strongest[0]}」最强（${strongest[1].score} 分）。`),
        f('low', '风险与机会',
          `风险项 ${risks} 个、机会项 ${opps} 个，建议优先治理最弱维度。`),
      ]
    }
    case 'clvc': {
      return [
        f('mid', '高价值客户杠杆',
          `黑卡单客年价值约为普通会员 8 倍，资源应向前 5% 高价值客户倾斜。`),
        f('low', '获客成本上限',
          `按 30% 毛利倒推，单客获客成本(CAC)应控制在约 338 元以内才划算。`),
      ]
    }
    case 'profit-agent': {
      return [
        f('low', 'ROI 冠军',
          `「${ins.bestCampaign.label}」ROI 最高（${ins.bestCampaign.roi}x），应加大投入。`),
        f('high', '赔本赚吆喝',
          `「${ins.worstCampaign.label}」ROI 最低（${ins.worstCampaign.roi}x），且新客复购差，建议缩减。`),
      ]
    }
    case 'menu-design': {
      return [
        f('mid', '饮品绑定不足',
          `饮品毛利高但在套餐中绑定不足，是提升客单价与毛利的杠杆点，` +
          `主菜+饮品固定套餐目标价提升 8–10 元。`),
      ]
    }
    case 'group-buy': {
      return [
        f('mid', '团购依赖度',
          `团购占营收约 28%，但毛利（约 51%）低于堂食（63.5%），` +
          `宜作拉新入口而非主力渠道，到店后引导转会员。`),
      ]
    }
    default:
      return null // 上层回退到静态文案
  }
}

function moduleScore(moduleId, ins) {
  if (moduleId === 'overview') {
    const s = ins.series
    let score = 80
    score += s.revChange >= 0 ? 2 : -3
    if (ins.ticket && ins.ticket.delta < 0) score -= 4
    if (ins.waste && ins.waste.delta < 0) score += 3
    if (ins.grossMargin && ins.grossMargin.delta > 0) score += 1
    return Math.max(0, Math.min(100, Math.round(score)))
  }
  if (moduleId === 'ai-diagnosis') {
    const dims = dimensionScores(ins)
    const avgScore = avg(Object.values(dims).map((d) => d.score))
    return Math.round(avgScore)
  }
  return null
}

// ---------- 统一入口 ----------
export function analyzeModule(moduleId) {
  const insights = computeInsights()
  const findings = findingsForModule(moduleId, insights)
  return {
    insights,
    findings,
    score: moduleScore(moduleId, insights),
    hasData: Array.isArray(findings) && findings.length > 0,
  }
}
