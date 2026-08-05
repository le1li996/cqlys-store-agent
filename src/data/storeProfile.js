// 门店演示档案与基础经营数据
// 说明：以下均为「演示数据」，用于高保真原型展示。
// 未来接入真实数据时，只需在 services/dataService.js 中替换取数来源，
// 本文件结构即为标准数据契约（data contract）。

export const storeProfile = {
  name: '海岸城旗舰店',
  brand: '示例餐饮',
  category: '休闲餐饮 / 正餐',
  area: 320, // ㎡
  seats: 120,
  openDate: '2023-04-18',
  region: '华南 · 深圳',
  manager: '李店长',
  updatedAt: '2026-07-23',
}

// 当前核心 KPI（指标卡）
export const kpis = [
  { key: 'revenue', label: '今日营收', value: 4.82, unit: '万元', delta: 6.4, trend: 'up', note: '环比昨日' },
  { key: 'traffic', label: '今日客流', value: 612, unit: '人', delta: 3.1, trend: 'up', note: '环比昨日' },
  { key: 'ticket', label: '客单价', value: 78.8, unit: '元', delta: -1.2, trend: 'down', note: '环比昨日' },
  { key: 'memberRate', label: '会员占比', value: 41.6, unit: '%', delta: 2.3, trend: 'up', note: '环比上周' },
  { key: 'repurchase', label: '30日复购率', value: 34.2, unit: '%', delta: -0.8, trend: 'down', note: '环比上月' },
  { key: 'nps', label: 'NPS净推荐', value: 52, unit: '', delta: 4, trend: 'up', note: '环比上月' },
  { key: 'grossMargin', label: '毛利率', value: 63.5, unit: '%', delta: 0.5, trend: 'up', note: '环比上月' },
  { key: 'waste', label: '损耗率', value: 4.8, unit: '%', delta: -0.6, trend: 'down', note: '环比上月（越低越好）' },
]

// 近 14 天营收与客流时间序列
export const dailySeries = [
  { date: '07-10', revenue: 4.21, traffic: 548 },
  { date: '07-11', revenue: 4.55, traffic: 590 },
  { date: '07-12', revenue: 5.12, traffic: 665 },
  { date: '07-13', revenue: 5.36, traffic: 689 },
  { date: '07-14', revenue: 4.98, traffic: 642 },
  { date: '07-15', revenue: 4.73, traffic: 611 },
  { date: '07-16', revenue: 4.68, traffic: 603 },
  { date: '07-17', revenue: 5.04, traffic: 651 },
  { date: '07-18', revenue: 5.31, traffic: 678 },
  { date: '07-19', revenue: 4.86, traffic: 624 },
  { date: '07-20', revenue: 4.62, traffic: 598 },
  { date: '07-21', revenue: 4.77, traffic: 615 },
  { date: '07-22', revenue: 4.53, traffic: 594 },
  { date: '07-23', revenue: 4.82, traffic: 612 },
]

// 品类销售结构
export const categoryMix = [
  { label: '招牌主菜', value: 38, color: '#4F46E5' },
  { label: '火锅/汤煲', value: 22, color: '#E11D48' },
  { label: '小吃/凉菜', value: 15, color: '#0EA5E9' },
  { label: '饮品', value: 14, color: '#F59E0B' },
  { label: '甜品', value: 7, color: '#10B981' },
  { label: '其他', value: 4, color: '#8B5CF6' },
]

// 会员等级分布
export const memberTier = [
  { label: '普通会员', value: 1850, color: '#94A3B8' },
  { label: '银卡', value: 720, color: '#0EA5E9' },
  { label: '金卡', value: 310, color: '#F59E0B' },
  { label: '黑卡', value: 64, color: '#1E293B' },
]

// 时段客流分布
export const hourTraffic = [
  { label: '11', value: 42 },
  { label: '12', value: 138 },
  { label: '13', value: 96 },
  { label: '14', value: 28 },
  { label: '17', value: 35 },
  { label: '18', value: 121 },
  { label: '19', value: 142 },
  { label: '20', value: 110 },
  { label: '21', value: 64 },
]

// 评价标签情感分布
export const reviewSentiment = [
  { label: '好评', value: 71, color: '#10B981' },
  { label: '中评', value: 19, color: '#F59E0B' },
  { label: '差评', value: 10, color: '#EF4444' },
]

// 员工效能
export const staffEfficiency = [
  { label: '前厅-服务', value: 92, target: 90 },
  { label: '前厅-收银', value: 86, target: 88 },
  { label: '后厨-炒制', value: 95, target: 92 },
  { label: '后厨-备料', value: 78, target: 85 },
  { label: '后厨-出餐', value: 88, target: 90 },
]

// 营销活动 ROI
export const campaignRoi = [
  { label: '满减券', revenue: 12.4, cost: 3.1 },
  { label: '会员日', revenue: 9.8, cost: 1.6 },
  { label: '团购套餐', revenue: 15.2, cost: 4.8 },
  { label: '短视频引流', revenue: 6.3, cost: 2.2 },
  { label: '老客召回', revenue: 8.1, cost: 1.1 },
]
