// AI 服务层（占位 / 模拟实现）
// ============================================================
// 这是「可扩展性」的关键抽象层。当前为前端模拟回复，用于跑通交互。
// 未来接入真实大模型时，只需替换 callModel() 的实现（或改 useMock=false），
// 上层 UI 与对话逻辑无需任何改动。
//
// 接入示例（伪代码）：
//   async function callModel({ moduleId, systemPrompt, message, history }) {
//     const res = await fetch('https://your-api/agent', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
//       body: JSON.stringify({ module: moduleId, message, history }),
//     })
//     return (await res.json()).reply
//   }
// ============================================================

import { getModule } from '../data/modules.js'
import { analyzeModule } from './diagnostics.js'

const USE_MOCK = true // 改为 false 并接入真实 API 即可切换

// —— 模拟大模型调用：根据模块与用户问题，生成一段结构化演示回复 ——
// 说明：回复中的数字均来自 diagnostics 引擎对门店数据的实时计算，
//      而非写死文案，体现「诊断」而非「念稿」。
function mockReply({ moduleId, message }) {
  const mod = getModule(moduleId)
  const suggests = mod ? mod.suggestions : []

  const lower = (message || '').toLowerCase()
  const isGreeting = /你好|您好|hi|hello|在吗/.test(message || '')

  // 数据驱动洞察
  const { findings, score } = analyzeModule(moduleId)
  const diagText = (mod && mod.diagnosis) || []

  if (isGreeting) {
    const scoreLine = score != null ? `当前综合评分 **${score} 分**。` : ''
    return `你好，我是门店经营智脑。当前聚焦模块：**${mod ? mod.name : '自由对话'}**。${scoreLine}

你可以直接问我：
- 这家店今天经营健康度怎么样？
- 客单价为什么在降？
- 会员复购率怎么提升？

我会基于门店实时数据给出诊断与行动清单。`
  }

  let body = ''
  if (findings && findings.length) {
    body += `基于「${mod.name}」的实时数据，我的诊断如下：\n\n`
    findings.forEach((fd, i) => {
      const tag = fd.severity === 'high' ? '🔴' : fd.severity === 'mid' ? '🟡' : '🟢'
      body += `${i + 1}. ${tag} **${fd.title}**\n${fd.detail}\n`
    })
  } else if (diagText.length) {
    body += `基于「${mod.name}」，我的判断如下：\n\n`
    diagText.forEach((p, i) => {
      body += `${i + 1}. ${p}\n`
    })
  } else {
    body += `我已收到你的问题：「${message}」。\n\n（演示环境）我已调用经营分析模型，正在结合门店画像进行推演。请在实际接入真实模型后查看完整结论。`
  }

  if (/优先|第一|最重要|先做/.test(lower)) {
    // 优先返回严重度最高的发现，否则给第一条建议
    const top = findings && findings.length
      ? [...findings].sort((a, b) => sevWeight(b.severity) - sevWeight(a.severity))[0]
      : null
    if (top) {
      body += `\n\n👉 最该优先处理的一件事（${sevLabel(top.severity)}）：\n**${top.title}** —— ${top.detail}`
    } else if (suggests.length) {
      body += `\n\n👉 最该优先做的一件事：\n**${suggests[0]}**`
    }
  } else if (suggests.length) {
    body += `\n\n💡 建议行动：\n`
    suggests.slice(0, 3).forEach((s, i) => {
      body += `${i + 1}. ${s}\n`
    })
  }

  body += `\n\n— 以上结论由数据诊断引擎实时计算（演示模型）。接入真实大模型后将结合实时门店数据给出。`

  return body
}

function sevWeight(s) {
  return s === 'high' ? 3 : s === 'mid' ? 2 : 1
}
function sevLabel(s) {
  return s === 'high' ? '高风险' : s === 'mid' ? '需关注' : '良好'
}

// 对外统一接口
export async function sendMessage({ moduleId, message, history = [], onToken }) {
  // history: [{role:'user'|'assistant', content}]
  // onToken: 可选，用于未来流式输出（streaming）

  if (!USE_MOCK) {
    // TODO: 真实实现见文件顶部注释
    throw new Error('真实模型接口未配置：请在 aiService.js 中实现 callModel()')
  }

  // 模拟网络/推理延迟
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 700))

  const reply = mockReply({ moduleId, message })
  return { content: reply, model: 'mock-deepseek-v4', usage: estimateTokens(message, reply) }
}

function estimateTokens(a = '', b = '') {
  return Math.ceil((a.length + b.length) / 1.6)
}

// 导出开关，便于上层 UI 展示「当前模型」
export const aiConfig = {
  useMock: USE_MOCK,
  defaultModel: 'DeepSeek-V4（演示）',
  availableModels: ['DeepSeek-V4（演示）', 'Claude（待开通）', 'GPT（待开通）'],
}
