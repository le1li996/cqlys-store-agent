// 数据服务层（真实后端 / 本地兜底 双模式）
// ============================================================
// - 账号（注册/登录/验证码）与文件（上传/下载）走真实后端 API。
// - 决策清单 / 历史报告 / 用量 仍用 localStorage 模拟（用户未要求改为真实）。
//
// 模式切换：通过 import.meta.env.VITE_API_MODE
//   = 'real'  → 调用后端 /api（开发时由 vite proxy 转发到 localhost:8787）
//   其余      → 全部 localStorage 兜底（公网静态版无后端时也不崩）
//
// 后端接入说明（伪代码）：
//   const res = await fetch('/api/...', { headers: authHeader() })
//   return res.json()
// ============================================================

const USE_REAL = import.meta.env.VITE_API_MODE === 'real' || import.meta.env.PROD
const API_BASE = '/api'
const TOKEN_KEY = 'saa.token'

const KEYS = {
  account: 'saa.account',
  decisions: 'saa.decisions',
  reports: 'saa.reports',
  usage: 'saa.usage',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ——— token / 鉴权头 ———
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}
function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}
function authHeader() {
  const t = getToken()
  return t ? { Authorization: 'Bearer ' + t } : {}
}
async function api(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    ...opts,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `请求失败 (${res.status})`)
  return data
}

// ——— 账号（真实后端）———
// send-code / register / login 改为 async；getAccount/isLoggedIn/logout 仍同步以便 App 初始化。

export async function sendCode(email) {
  if (!USE_REAL) return { ok: true } // 兜底模式无需验证码
  return api('/auth/send-code', { method: 'POST', body: JSON.stringify({ email }) })
}

export async function register({ phone, email, companyName, code, password }) {
  if (!USE_REAL) {
    // 兜底：直接建演示账号
    const account = {
      phone,
      email: email || '',
      companyName: companyName || '',
      name: phone.slice(0, 3) + '****' + phone.slice(7),
      plan: '试用版',
      createdAt: new Date().toISOString(),
    }
    write(KEYS.account, account)
    return { ok: true, account }
  }
  const r = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ phone, email, companyName, code, password }),
  })
  setToken(r.token)
  write(KEYS.account, r.account)
  return { ok: true, account: r.account }
}

export async function login({ phone, password }) {
  if (!USE_REAL) {
    const account = {
      phone,
      name: phone.slice(0, 3) + '****' + phone.slice(7),
      plan: '试用版',
      createdAt: new Date().toISOString(),
    }
    write(KEYS.account, account)
    return { ok: true, account }
  }
  const r = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  })
  setToken(r.token)
  write(KEYS.account, r.account)
  return { ok: true, account: r.account }
}

export function getAccount() {
  return read(KEYS.account, null)
}
export function isLoggedIn() {
  return !!getAccount() && (!USE_REAL || !!getToken())
}
export function logout() {
  localStorage.removeItem(KEYS.account)
  setToken('')
}

// ——— 文件（真实上传 / 下载）———
export async function uploadFile(file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(API_BASE + '/files/upload', {
    method: 'POST',
    headers: authHeader(),
    body: fd,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || '上传失败')
  return data.file // { id, name, size, mime, url }
}

export function fileDownloadUrl(id) {
  const t = getToken()
  return API_BASE + '/files/' + id + (t ? '?token=' + encodeURIComponent(t) : '')
}

// ——— 我的决策清单（localStorage 模拟）———
export function getDecisions() {
  return read(KEYS.decisions, [])
}
export function addDecision(text, source) {
  const list = getDecisions()
  const item = {
    id: 'd' + Date.now(),
    text,
    source: source || '',
    status: 'todo',
    createdAt: new Date().toISOString(),
  }
  list.unshift(item)
  write(KEYS.decisions, list)
  return item
}
export function updateDecisionStatus(id, status) {
  const list = getDecisions().map((d) => (d.id === id ? { ...d, status } : d))
  write(KEYS.decisions, list)
  return list
}
export function removeDecision(id) {
  write(KEYS.decisions, getDecisions().filter((d) => d.id !== id))
}

// ——— 历史报告（localStorage 模拟）———
export function getReports() {
  return read(KEYS.reports, [])
}
export function saveReport({ moduleId, moduleName, summary }) {
  const list = getReports()
  const report = {
    id: 'r' + Date.now(),
    moduleId,
    moduleName,
    summary: summary || '',
    createdAt: new Date().toISOString(),
  }
  list.unshift(report)
  write(KEYS.reports, list)
  return report
}

// ——— 用量统计（localStorage 模拟）———
export function getUsage() {
  return read(KEYS.usage, { type: '对话', count: 0, advanced: 0 })
}
export function bumpUsage(advanced = false) {
  const u = getUsage()
  u.count += 1
  if (advanced) u.advanced += 1
  write(KEYS.usage, u)
  return u
}

// 是否接入真实后端（切换开关，兼容旧引用）
export const dataConfig = { useMockBackend: !USE_REAL }
export const USE_REAL_BACKEND = USE_REAL
