// 模块数据模型 —— 门店经营数据分析智能体的「大脑目录」
//
// 架构说明（可扩展性核心）：
//   - 平台左侧每个分类(Category)下挂多个「智能体模块(Module)」。
//   - 任意模块的展示完全由其数据描述驱动（指标卡 / 图表 / 诊断 / 建议 / 对话提示）。
//   - 未来要新增一个分析能力，只需在下方 categories 中追加一条 module 数据，
//     无需改动任何组件代码，即可出现在导航、可点击、可对话、可生成报告。
//   - Module 中的图表 data 当前为演示值；接入真实数据时在 services/dataService.js 中替换。

import {
  dailySeries, categoryMix, memberTier, hourTraffic,
  reviewSentiment, staffEfficiency, campaignRoi,
} from './storeProfile.js'

export const categories = [
  {
    id: 'store',
    name: '门店运营',
    icon: '🏪',
    desc: '日常经营数据诊断核心区，覆盖营收、客流、会员、评价、人效、损耗',
    modules: [
      {
        id: 'overview',
        name: '经营总览仪表盘',
        icon: '📊',
        subtitle: '一句话看懂今天生意',
        description: '聚合营收、客流、客单价、会员、复购、NPS、毛利、损耗八大核心指标，结合近 14 天趋势，给出当日经营健康度评分。',
        metrics: [
          { label: '经营健康度', value: 82, unit: '分', delta: 3, trend: 'up' },
          { label: '今日营收', value: 4.82, unit: '万元', delta: 6.4, trend: 'up' },
          { label: '坪效(日)', value: 150.6, unit: '元/㎡', delta: 6.4, trend: 'up' },
          { label: '人效(日)', value: 4016, unit: '元/人', delta: 2.1, trend: 'up' },
        ],
        charts: [
          {
            type: 'line',
            title: '近 14 天营收 vs 客流',
            unit: '万元 / 人',
            labels: dailySeries.map((d) => d.date),
            series: [
              { name: '营收(万元)', color: '#4F46E5', values: dailySeries.map((d) => d.revenue) },
              { name: '客流(人)', color: '#E11D48', values: dailySeries.map((d) => d.traffic), axis: 'right' },
            ],
          },
          { type: 'donut', title: '品类销售结构', unit: '%', data: categoryMix },
        ],
        diagnosis: [
          '门店整体经营健康度 82 分，处于「良好」区间，但增长动能偏弱：近 14 天营收在 4.2–5.4 万元间波动，缺乏稳定爬坡趋势。',
          '客单价连续 3 日下滑（78.8 元，环比 -1.2%），与「小吃/饮品」占比提升、主菜连带率下降有关，需警惕「凑单消费」稀释客单。',
          '损耗率 4.8% 已优于行业基准（6%），但备料环节人效仅 78%，是后续提效重点。',
        ],
        suggestions: [
          '将「招牌主菜」与「饮品」做套餐绑定，目标把客单价拉回 82 元以上。',
          '针对 19:00 客流峰值（142 人）增配 1 名传菜，缩短出餐时长。',
          '建立每日 21:00 后临期食材折价机制，进一步压低损耗。',
        ],
        prompt: '帮我解读今天这家店的经营健康度，并指出最该优先处理的一件事。',
      },
      {
        id: 'revenue',
        name: '营收与坪效诊断',
        icon: '💰',
        subtitle: '每平米到底赚了多少',
        description: '拆解营收构成、坪效与人效，定位「高产出时段/低效率面积」，给出空间与排班优化建议。',
        metrics: [
          { label: '月坪效', value: 4518, unit: '元/㎡', delta: 5.2, trend: 'up' },
          { label: '月人效', value: 12.04, unit: '万元/人', delta: 1.8, trend: 'up' },
          { label: '高峰产能利用率', value: 88, unit: '%', delta: -2, trend: 'down' },
        ],
        charts: [
          {
            type: 'bar',
            title: '各时段客流分布',
            unit: '人',
            data: hourTraffic,
          },
        ],
        diagnosis: [
          '门店月坪效 4518 元/㎡，高于同业态中位数（约 3800 元/㎡），但高峰时段（12:00 / 19:00）产能利用率仅 88%，存在排队溢出的隐性损失。',
          '19:00–20:00 客流占全天 41%，而该时段出餐准时率最低，直接导致部分顾客流失与差评。',
        ],
        suggestions: [
          '实施「错峰定价」：17:30 前入座享 9 折，削峰填谷。',
          '高峰期启用「预制品+快出餐」动线，把出餐时长从 14 分钟压到 10 分钟。',
        ],
        prompt: '我的坪效在同业态处于什么水平？怎样进一步提升高峰时段的产出？',
      },
      {
        id: 'member',
        name: '会员数据诊断',
        icon: '💎',
        subtitle: '会员到底值多少钱',
        description: '分析会员结构、消费贡献、复购与流失，定位高价值人群与召回机会。',
        metrics: [
          { label: '会员消费占比', value: 41.6, unit: '%', delta: 2.3, trend: 'up' },
          { label: '30日复购率', value: 34.2, unit: '%', delta: -0.8, trend: 'down' },
          { label: '黑卡年贡献', value: 2.8, unit: '万元/人', delta: 6, trend: 'up' },
        ],
        charts: [
          { type: 'donut', title: '会员等级分布', unit: '人', data: memberTier },
        ],
        diagnosis: [
          '会员消费占比 41.6%，但 30 日复购率下滑至 34.2%，说明「拉新」在涨、「留存」在漏。',
          '黑卡仅 64 人却贡献约 18% 营收，是绝对核心资产；银卡→金卡升级率仅 9%，存在明显断档。',
        ],
        suggestions: [
          '对 720 名银卡推送「升级金卡任务」（累计消费满 X 元送特权），目标提升升级率到 15%。',
          '对 30 天未消费会员启动「召回券」，预计可挽回约 6% 流失。',
        ],
        prompt: '我的会员复购率在降，应该先抓拉新还是抓留存？给一个具体动作。',
      },
      {
        id: 'review',
        name: '用户评价诊断',
        icon: '💬',
        subtitle: '顾客到底在骂什么',
        description: '聚合大众点评/美团/抖音评价，做情感分析与标签归因，定位差评根因。',
        metrics: [
          { label: 'NPS', value: 52, unit: '', delta: 4, trend: 'up' },
          { label: '差评率', value: 10, unit: '%', delta: -1.5, trend: 'down' },
          { label: '差评平均响应', value: 3.2, unit: '小时', delta: -1, trend: 'down' },
        ],
        charts: [
          { type: 'donut', title: '评价情感分布', unit: '%', data: reviewSentiment },
        ],
        diagnosis: [
          '差评主要集中在「上菜慢」（占差评 46%）与「服务叫不应」（占 31%），与高峰产能利用率不足高度相关。',
          '「菜品口味」相关差评仅 9%，说明产品力稳定，问题在「体验交付」而非「产品本身」。',
        ],
        suggestions: [
          '差评 1 小时内必须回复并补偿，把「差评响应」纳入店长 KPI。',
          '在点评页置顶「高峰排队提醒」，管理顾客预期，降低情绪化差评。',
        ],
        prompt: '把最近的差评按根因归类，告诉我本周最该解决哪个体验问题。',
      },
      {
        id: 'staff',
        name: '员工效能诊断',
        icon: '⚖️',
        subtitle: '人有没有用在刀刃上',
        description: '评估前厅 / 后厨各岗位效能与达标率，诊断排班与激励机制漏洞。',
        metrics: [
          { label: '人效达标率', value: 87.6, unit: '%', delta: 1.2, trend: 'up' },
          { label: '备料岗达标', value: 78, unit: '%', delta: -3, trend: 'down' },
          { label: '离职风险预警', value: 2, unit: '人', delta: 1, trend: 'up' },
        ],
        charts: [
          {
            type: 'bar',
            title: '各岗位效能 vs 目标',
            unit: '分',
            data: staffEfficiency.map((s) => ({ label: s.label, value: s.value, target: s.target })),
            showTarget: true,
          },
        ],
        diagnosis: [
          '后厨「备料」岗效能仅 78%，低于目标 85%，是出餐慢的上游根因；该岗员工近 30 天加班最多，离职风险预警 +1。',
          '前厅服务岗效能 92% 最高，可将其 SOP 沉淀为培训模板向其他店复制。',
        ],
        suggestions: [
          '为备料岗增配半成品预制，降低现场作业强度。',
          '对高离职风险员工启动 1v1 沟通与调薪评估，避免旺季前失血。',
        ],
        prompt: '我的员工效能数据里，哪个岗位最该优先优化？给出排班和激励建议。',
      },
      {
        id: 'inventory',
        name: '库存与损耗诊断',
        icon: '📦',
        subtitle: '钱是不是烂在仓库里',
        description: '监控库存周转、损耗结构与报废，定位资金占用与浪费点。',
        metrics: [
          { label: '损耗率', value: 4.8, unit: '%', delta: -0.6, trend: 'down' },
          { label: '库存周转', value: 6.4, unit: '次/月', delta: 0.3, trend: 'up' },
          { label: '资金占用', value: 11.2, unit: '万元', delta: -4, trend: 'down' },
        ],
        charts: [
          {
            type: 'bar',
            title: '损耗金额构成(近30天)',
            unit: '千元',
            data: [
              { label: '生鲜蔬菜', value: 6.2, color: '#EF4444' },
              { label: '肉类', value: 4.1, color: '#F59E0B' },
              { label: '调料', value: 1.3, color: '#0EA5E9' },
              { label: '饮品', value: 0.9, color: '#10B981' },
            ],
          },
        ],
        diagnosis: [
          '损耗率 4.8% 已优于行业，但生鲜蔬菜损耗（6.2 千元/月）占比最高，主要源于「订货量 vs 实际客流」预测偏差。',
          '库存周转 6.4 次/月，资金占用降至 11.2 万，现金流健康。',
        ],
        suggestions: [
          '用近 14 天客流预测替代「固定订货」，目标生鲜损耗再降 20%。',
          '对临期饮品做「买一赠一」自动提醒，避免报废。',
        ],
        prompt: '我的损耗主要在哪类食材？有没有办法在不影响出品的前提下再降一点？',
      },
    ],
  },
  {
    id: 'strategy',
    name: '战略决策',
    icon: '📈',
    desc: '面向老板/区域负责人的经营战略推演与复盘',
    modules: [
      {
        id: 'ai-diagnosis',
        name: 'AI 经营诊断',
        icon: '🩺',
        subtitle: '全自动体检报告',
        description: '综合营收、会员、评价、人效、损耗五大维度，输出一份结构化「门店体检报告」与优先级行动清单。',
        metrics: [
          { label: '综合评分', value: 79, unit: '分', delta: 4, trend: 'up' },
          { label: '风险项', value: 3, unit: '项', delta: -1, trend: 'down' },
          { label: '机会项', value: 5, unit: '项', delta: 2, trend: 'up' },
        ],
        charts: [
          {
            type: 'bar',
            title: '五维健康度评分',
            unit: '分',
            data: [
              { label: '营收', value: 82, color: '#4F46E5' },
              { label: '会员', value: 74, color: '#0EA5E9' },
              { label: '评价', value: 80, color: '#10B981' },
              { label: '人效', value: 76, color: '#F59E0B' },
              { label: '损耗', value: 88, color: '#E11D48' },
            ],
          },
        ],
        diagnosis: [
          '门店综合评分 79 分，处于区域中上水平。最强项是「损耗管控」，最弱项是「会员留存」。',
          '三大风险：①客单价持续下滑 ②备料岗效能不达标 ③复购率走低。五大机会：套餐绑定、银卡升级、错峰定价、召回券、备料预制。',
        ],
        suggestions: [
          '本周优先级 P0：解决客单价下滑（套餐绑定）。',
          'P1：备料岗增配预制 + 排班优化。',
          'P2：启动银卡升级与流失召回双线运营。',
        ],
        prompt: '给我一份完整的门店体检报告，并按优先级列出本周行动清单。',
      },
      {
        id: 'strategy-5',
        name: '五大战略解读',
        icon: '⭐',
        subtitle: '客户→核心→产品→模式→文化',
        description: '按「客户选择 → 核心竞争力 → 产品确定性 → 商业模式 → 企业文化」五步框架，帮助老板厘清经营战略。',
        metrics: [],
        charts: [],
        diagnosis: [
          '五大战略框架：①客户选择（谁是你最该服务的人）②核心竞争力（你比别人强在哪）③产品确定性（顾客为何信任你）④商业模式（钱怎么赚）⑤企业文化（团队为何跟你干）。',
          '结合本店数据：客户以 25–40 岁家庭/情侣为主；核心竞争力在「稳定出品+高性价比」；产品确定性高；商业模式以堂食+团购为主，会员复购是第二曲线；文化需补强「高峰服务韧性」。',
        ],
        suggestions: [
          '用五步法每季度复盘一次，当前最该补强的是「会员第二曲线」与「高峰服务文化」。',
        ],
        prompt: '用五大战略框架帮我梳理一下这家店当前的经营战略，并指出最薄弱的一环。',
      },
      {
        id: 'clvc',
        name: 'CLVC 客户生命周期价值测算',
        icon: '🧮',
        subtitle: '一个顾客值多少钱',
        description: '基于复购率、客单价、生命周期，测算单客 CLV，反推可接受的获客成本上限。',
        metrics: [
          { label: '单客 CLV', value: 1126, unit: '元', delta: 5, trend: 'up' },
          { label: '年复购次数', value: 6.8, unit: '次', delta: 0.4, trend: 'up' },
          { label: '获客成本上限', value: 338, unit: '元', delta: 5, trend: 'up' },
        ],
        charts: [
          {
            type: 'bar',
            title: '不同层级单客年价值',
            unit: '元',
            data: [
              { label: '普通', value: 540, color: '#94A3B8' },
              { label: '银卡', value: 980, color: '#0EA5E9' },
              { label: '金卡', value: 1860, color: '#F59E0B' },
              { label: '黑卡', value: 4280, color: '#1E293B' },
            ],
          },
        ],
        diagnosis: [
          '单客全生命周期价值约 1126 元，据此可接受的获客成本（CAC）上限约 338 元（按 30% 毛利倒推）。',
          '黑卡单客年价值 4280 元，是普通会员的 8 倍——资源应向前 5% 高价值客户倾斜。',
        ],
        suggestions: [
          '将营销预算的 40% 用于高价值客户维系，而非泛流量采买。',
          '用 CLV 校准团购/投放出价，避免「赔本赚吆喝」。',
        ],
        prompt: '帮我测算这家店的单客生命周期价值，并告诉我获客成本控制在多少以内才划算。',
      },
      {
        id: 'membership-design',
        name: '客户资产与会员体系设计',
        icon: '👥',
        subtitle: '把流量变成资产',
        description: '设计会员等级、权益与积分体系，把一次性顾客沉淀为可复利的客户资产。',
        metrics: [
          { label: '会员资产估值', value: 268, unit: '万元', delta: 7, trend: 'up' },
          { label: '积分沉淀', value: 42, unit: '万', delta: 3, trend: 'up' },
        ],
        charts: [],
        diagnosis: [
          '当前会员资产（储值+积分+未来消费预期）约 268 万元，是一笔被低估的「表外资产」。',
          '体系短板：权益梯度不明显，银卡感知弱；积分消耗场景少，沉淀 42 万积分未激活。',
        ],
        suggestions: [
          '设计「消费积分→兑换菜品/周边→再消费」闭环，激活沉睡积分。',
          '强化银卡「专属权益」（如生日菜、优先订座），制造升级动机。',
        ],
        prompt: '帮我重新设计一套会员等级和权益体系，目标是提升升级率和复购。',
      },
      {
        id: 'quarter-review',
        name: '季度战略复盘',
        icon: '📆',
        subtitle: '三个月做对了吗',
        description: '对比季度目标与实际达成，复盘关键举措效果，输出下季度战略校准。',
        metrics: [
          { label: '季度目标达成', value: 91, unit: '%', delta: 3, trend: 'up' },
          { label: '营收同比', value: 14.6, unit: '%', delta: 2, trend: 'up' },
        ],
        charts: [],
        diagnosis: [
          '本季度营收同比 +14.6%，目标达成 91%，未达标项集中在「会员复购」与「新店分流影响」。',
          '有效举措：团购套餐、会员日；无效举措：短视频投放 ROI 偏低，应缩减。',
        ],
        suggestions: [
          '下季度把预算从短视频引流转向老客召回与黑卡专属。',
          '设定可量化复盘指标，避免「感觉有效」式决策。',
        ],
        prompt: '帮我做一次季度战略复盘，对比目标和实际，给出下季度该坚持和该放弃的事。',
      },
    ],
  },
  {
    id: 'marketing',
    name: '品牌营销',
    icon: '📣',
    desc: '营销活动的利润归因、真问题识别与内容矩阵',
    modules: [
      {
        id: 'profit-agent',
        name: '营销利润增长智能体',
        icon: '📈',
        subtitle: '每一分钱花得值不值',
        description: '对各营销渠道做利润归因，区分「增收」与「赔本赚吆喝」，给出预算再分配方案。',
        metrics: [
          { label: '营销综合 ROI', value: 3.6, unit: 'x', delta: 0.4, trend: 'up' },
          { label: '负利润活动', value: 1, unit: '个', delta: -1, trend: 'down' },
        ],
        charts: [
          {
            type: 'bar',
            title: '各营销活动 ROI（营收/成本）',
            unit: 'x',
            data: campaignRoi.map((c) => ({ label: c.label, value: +(c.revenue / c.cost).toFixed(1) })),
          },
        ],
        diagnosis: [
          '「老客召回」ROI 最高（7.4x），「团购套餐」营收规模最大但 ROI 仅 3.2x（含平台抽成）。',
          '「短视频引流」ROI 最低（2.9x），且带来的新客复购差，属「赔本赚吆喝」。',
        ],
        suggestions: [
          '将短视频预算砍半，转投老客召回与会员日。',
          '对团购套餐谈降低平台佣金或改为「门店自营套餐」。',
        ],
        prompt: '帮我算一下各个营销活动的真实利润，告诉我钱该往哪投。',
      },
      {
        id: 'problem-finder',
        name: '营销真问题识别器',
        icon: '🔎',
        subtitle: '别被表象骗了',
        description: '透过「营收涨了」的表象，识别增长质量、结构性与可持续性真问题。',
        metrics: [],
        charts: [],
        diagnosis: [
          '表面：本月营收 +6.4%。真相：增长由「团购低价引流」驱动，客单价反降，毛利被稀释——这是「虚胖增长」。',
          '真问题不是「没客流」，而是「来的都是价格敏感型、留存差」。',
        ],
        suggestions: [
          '把 KPI 从「营收额」改为「毛利额 + 复购率」，遏制低价内卷。',
        ],
        prompt: '我的营收在涨，但总觉得不对劲，帮我识别背后的真问题。',
      },
      {
        id: 'menu-design',
        name: '菜单与套餐营销设计',
        icon: '📋',
        subtitle: '让菜单自己卖货',
        description: '基于品类结构与客单价，设计高毛利套餐与黄金菜单组合，提升连带率。',
        metrics: [
          { label: '套餐连带率', value: 38, unit: '%', delta: 4, trend: 'up' },
          { label: '高毛利占比', value: 44, unit: '%', delta: 2, trend: 'up' },
        ],
        charts: [
          { type: 'donut', title: '菜单品类结构', unit: '%', data: categoryMix },
        ],
        diagnosis: [
          '当前套餐连带率 38%，仍有提升空间；饮品（毛利高）在套餐中绑定不足，是提客单的杠杆点。',
        ],
        suggestions: [
          '推出「主菜+饮品」固定套餐，目标价提升 8–10 元。',
          '把高毛利甜品设为「加 X 元换购」，提升客单与毛利。',
        ],
        prompt: '帮我设计几款能提升客单价和毛利的套餐组合。',
      },
      {
        id: 'campaign-design',
        name: '营销活动设计',
        icon: '🎁',
        subtitle: '从目标反推玩法',
        description: '给定目标（拉新/复购/清库存），自动生成活动机制、节奏与测算。',
        metrics: [],
        charts: [],
        diagnosis: [
          '若目标是「提升复购」：推荐「消费满 3 次解锁专属菜」进度式激励，比单纯打折更易形成习惯。',
          '若目标是「清库存」：推荐「限时盲盒套餐」，把临期食材打包成惊喜感产品。',
        ],
        suggestions: [
          '用「进度条」机制替代满减，降低毛利侵蚀。',
        ],
        prompt: '我想在月底做一次拉复购的活动，帮我设计一个不伤毛利的玩法。',
      },
      {
        id: 'repurchase',
        name: '老客激活与复购路径设计',
        icon: '🔁',
        subtitle: '把走的人叫回来',
        description: '设计分层召回路径（短信/企微/券），按流失时长匹配不同触达策略。',
        metrics: [
          { label: '可召回规模', value: 1130, unit: '人', delta: 5, trend: 'up' },
          { label: '召回预计 ROI', value: 6.2, unit: 'x', delta: 1, trend: 'up' },
        ],
        charts: [],
        diagnosis: [
          '30 天未消费会员约 1130 人，其中 60% 曾为银卡以上，召回价值高。',
          '「7 天内轻流失」用券即可；「30 天以上」需人工企微+专属权益组合拳。',
        ],
        suggestions: [
          '建立「流失天数→触达方式→权益力度」自动矩阵。',
        ],
        prompt: '帮我设计一套老客召回的自动化路径，按流失时长分层。',
      },
      {
        id: 'group-buy',
        name: '团购平台策略判断',
        icon: '🛒',
        subtitle: '上还是不上',
        description: '评估美团/抖音团购的利弊与定价，避免被平台「绑架」价格体系。',
        metrics: [
          { label: '团购占比', value: 28, unit: '%', delta: 3, trend: 'up' },
          { label: '团购毛利', value: 51, unit: '%', delta: -2, trend: 'down' },
        ],
        charts: [],
        diagnosis: [
          '团购占营收 28%，但毛利仅 51%（低于堂食 63.5%），过度依赖会拉低整体盈利质量。',
          '建议将团购作为「拉新入口」而非「主力渠道」，到店后引导转会员。',
        ],
        suggestions: [
          '团购套餐设置「会员价更优」，把平台流量沉淀为自有会员。',
        ],
        prompt: '团购平台占了快三成营收，我是该加大投入还是收缩？',
      },
      {
        id: 'campaign-review',
        name: '营销活动复盘智能体',
        icon: '📌',
        subtitle: '活动结束才算开始',
        description: '活动结束后自动复盘：目标达成、利润、人群质量，沉淀可复用方法论。',
        metrics: [],
        charts: [],
        diagnosis: [
          '上次「会员日」：营收 +18%，但新客占比仅 12%，说明主要激活了存量，拉新不足。',
          '可复用：会员日权益设计；需改进：前置拉新引流动作。',
        ],
        suggestions: [
          '每次活动强制沉淀「目标-动作-结果-结论」四要素复盘卡。',
        ],
        prompt: '帮我复盘上次会员日活动，哪些动作该保留、哪些该改。',
      },
      {
        id: 'shortvideo',
        name: '餐饮老板短视频内容矩阵',
        icon: '🎬',
        subtitle: '老板亲自出镜的流量',
        description: '提供六类选题资产库与 30 天内容排期，帮老板稳定产出引流内容。',
        metrics: [
          { label: '内容库选题', value: 120, unit: '个', delta: 0, trend: 'up' },
          { label: '建议周更', value: 5, unit: '条', delta: 0, trend: 'up' },
        ],
        charts: [],
        diagnosis: [
          '六类选题：认知判断、客户卡点、确定性证据、产品菜单、用户评价、老板决策复盘。',
          '老板出镜的「确定性证据类」（如后厨卫生、食材溯源）转化最好，应占 40% 比重。',
        ],
        suggestions: [
          '按「40%证据 + 30%产品 + 30%人设」排期，避免纯叫卖。',
        ],
        prompt: '帮我生成一份未来 30 天的短视频内容排期表，老板亲自出镜。',
      },
    ],
  },
  {
    id: 'chat',
    name: '自由对话',
    icon: '💡',
    desc: '不限主题，随时向经营智脑发问',
    modules: [
      {
        id: 'free',
        name: '自由对话',
        icon: '✨',
        subtitle: '想问什么问什么',
        description: '不限模块，直接向门店经营智脑提问。可上传数据表、开启联网搜索、调用记忆。',
        metrics: [],
        charts: [],
        diagnosis: [],
        suggestions: [],
        prompt: '我想了解这家店的整体情况，请从营收、会员、评价三个角度给我一个总体判断。',
      },
    ],
  },
]

// 扁平化索引，便于按 id 查找
export const moduleIndex = {}
categories.forEach((cat) => {
  cat.modules.forEach((m) => {
    moduleIndex[m.id] = { ...m, categoryId: cat.id, categoryName: cat.name }
  })
})

export function getModule(id) {
  return moduleIndex[id] || null
}

export function getCategory(id) {
  return categories.find((c) => c.id === id) || null
}
