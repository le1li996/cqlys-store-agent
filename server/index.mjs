// 门店经营智脑 · 后端服务（单文件，零原生依赖）
// ============================================================
// 提供：邮箱验证码注册/登录 + 企业名称收集、文件上传下载。
// 存储：Supabase PostgreSQL（生产持久化）/ JSON 文件（本地回退）
//       — 由 server/db.mjs 自动切换，路由逻辑无需关心
// 文件：Supabase Storage（生产）/ 本地磁盘（回退）
// 邮件：QQ邮箱 SMTP。注册成功后通知管理员。
// 保活：内置自 ping，每 10 分钟访问 /api/health，防止 Render 免费版休眠。
//
// 启动：node server/index.mjs   （默认端口 8787）
// 生产：本服务同时托管 dist 静态文件，部署到能跑 Node 的环境即全栈可用。
// ============================================================

import express from 'express'
import cors from 'cors'
import multer from 'multer'
import crypto from 'node:crypto'
import path from 'node:path'
import 'dotenv/config'
import { db, storage } from './db.mjs'

const PORT = process.env.PORT || 8787
const __dirname = path.dirname(new URL(import.meta.url).pathname)
// 修正 Windows 路径前导斜杠问题（C:\ → C:\）
const cleanDir = __dirname.startsWith('/') && process.platform === 'win32' && __dirname[1] === ':'
  ? __dirname.slice(1)
  : __dirname
const DIST = path.resolve(cleanDir, '..', 'dist')

// ---------- 密码哈希（Node crypto.scrypt，零依赖） ----------
function hashPassword(pw, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex')
  return { salt, hash }
}
function verifyPassword(pw, salt, hash) {
  const h = crypto.scryptSync(pw, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hash, 'hex'))
}

const newToken = () => crypto.randomBytes(24).toString('hex')
const newId = (p) => p + crypto.randomBytes(8).toString('hex')
const genCode = () => String(Math.floor(100000 + Math.random() * 900000))

// ---------- 鉴权中间件 ----------
async function auth(req, res, next) {
  const h = req.headers.authorization || ''
  const t = h.startsWith('Bearer ') ? h.slice(7) : req.query.token || ''
  if (!t) return res.status(401).json({ ok: false, error: '未登录' })
  const record = await db.findToken(t)
  if (!record) return res.status(401).json({ ok: false, error: '登录失效，请重新登录' })
  if (!record.user) return res.status(401).json({ ok: false, error: '用户不存在' })
  req.user = record.user
  next()
}

function publicAccount(u) {
  return {
    id: u.id, phone: u.phone, name: u.name, plan: u.plan,
    email: u.email || '', companyName: u.companyName || '',
    createdAt: u.createdAt,
  }
}

// ---------- 邮件发送（QQ邮箱 SMTP） ----------
import nodemailer from 'nodemailer'

const mailer = {
  transporter: null,
  from: '',
  ready: false,

  init() {
    const user = process.env.SMTP_USER || ''
    const pass = process.env.SMTP_PASS || ''
    if (!user || !pass) {
      console.warn('[Mailer] SMTP_USER / SMTP_PASS 未配置，邮件功能不可用')
      return
    }
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.qq.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: { user, pass },
    })
    this.from = process.env.SMTP_FROM
      ? `"${process.env.SMTP_FROM}" <${user}>`
      : `门店经营智脑 <${user}>`
    this.ready = true
    console.log(`[Mailer] QQ邮箱 SMTP 已就绪 (user: ${user})`)
  },

  async send({ to, subject, html }) {
    if (!this.ready) {
      console.warn('[Mailer] 未就绪，跳过发送：', subject)
      return { ok: false, error: '邮件服务未配置' }
    }
    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, html })
      console.log(`[Mailer] 已发送: "${subject}" → ${to} (id: ${info.messageId})`)
      return { ok: true, id: info.messageId }
    } catch (e) {
      console.error('[Mailer] 发送失败:', e.message)
      return { ok: false, error: e.message }
    }
  },

  /** 向用户邮箱发送验证码 */
  async sendCode(email, code) {
    const html = `
      <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif">
        <h2 style="color:#2563eb">门店经营智脑</h2>
        <p>您的验证码为：</p>
        <p style="font-size:28px;font-weight:bold;color:#2563eb;letter-spacing:4px">${code}</p>
        <p style="color:#666">5 分钟内有效，请勿泄露给他人。</p>
        <hr style="border:none;border-top:1px solid #eee">
        <p style="color:#999;font-size:12px">如非本人操作，请忽略此邮件。</p>
      </div>`
    return this.send({ to: email, subject: '【门店经营智脑】验证码 ' + code, html })
  },

  /** 通知管理员有新用户注册 */
  async notifyAdmin(newUser) {
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) { console.log('[Mailer] 未配置管理员邮箱，跳过通知'); return }
    const html = `
      <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif">
        <h2 style="color:#2563eb">🔔 新用户注册通知</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">手机号</td><td style="padding:8px;border-bottom:1px solid #eee">${newUser.phone}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">邮箱</td><td style="padding:8px;border-bottom:1px solid #eee">${newUser.email || '未填写'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">企业名称</td><td style="padding:8px;border-bottom:1px solid #eee">${newUser.companyName || '未填写'}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666">注册时间</td><td style="padding:8px;border-bottom:1px solid #eee">${newUser.createdAt}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #eee">
        <p style="color:#999;font-size:12px">门店经营智脑 · 自动通知</p>
      </div>`
    await this.send({ to: adminEmail, subject: `【新注册】${newUser.companyName || newUser.phone} - 门店经营智脑`, html })
  },
}

mailer.init()

// ---------- Express ----------
const app = express()
app.use(cors())
app.use(express.json())

// —— 健康检查 ——
app.get('/api/health', (req, res) => res.json({
  ok: true, mail: mailer.ready, db: db.mode, storage: storage.mode,
}))

// —— 发送验证码（页面显示，10秒后自动展示）——
app.post('/api/auth/send-code', async (req, res) => {
  const { email } = req.body || {}
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: '请输入有效的邮箱地址' })
  }
  const existing = await db.findCodeByEmail(email.toLowerCase())
  if (existing && existing.expiresAt > Date.now()) {
    const wait = Math.ceil((existing.expiresAt - Date.now()) / 1000)
    return res.status(429).json({ ok: false, error: `请 ${wait}s 后再获取验证码` })
  }
  const code = genCode()
  await db.upsertCode(email.toLowerCase(), code, Date.now() + 5 * 60 * 1000)
  console.log(`[Code] 验证码（${email}）：${code}`)
  res.json({ ok: true, devCode: code })
})

// —— 注册（手机号 + 邮箱 + 企业名称 + 验证码 + 密码）——
app.post('/api/auth/register', async (req, res) => {
  const { phone, email, companyName, code, password } = req.body || {}
  if (!/^1\d{10}$/.test(phone || '')) return res.status(400).json({ ok: false, error: '手机号格式不正确' })
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, error: '请输入有效的邮箱地址' })
  if (!code || !/^\d{6}$/.test(code)) return res.status(400).json({ ok: false, error: '请输入 6 位验证码' })
  if (!password || password.length < 6) return res.status(400).json({ ok: false, error: '密码至少 6 位' })

  const emailKey = email.toLowerCase()
  const rec = await db.findCodeByEmail(emailKey)
  if (!rec || rec.expiresAt < Date.now()) return res.status(400).json({ ok: false, error: '验证码已过期，请重新获取' })
  if (rec.code !== code) return res.status(400).json({ ok: false, error: '验证码不正确' })

  const existing = await db.findUserByPhone(phone)
  if (existing) return res.status(409).json({ ok: false, error: '该手机号已注册，请直接登录' })

  const { salt, hash } = hashPassword(password)
  const user = {
    id: newId('u'), phone, email: emailKey, companyName: companyName || '',
    salt, hash,
    name: phone.slice(0, 3) + '****' + phone.slice(7),
    plan: '试用版', createdAt: new Date().toISOString(),
  }
  await db.createUser(user)
  await db.deleteCodeByEmail(emailKey)
  const token = newToken()
  await db.createToken(token, user.id)

  // 异步通知管理员（不影响注册响应）
  mailer.notifyAdmin(user).catch((e) => console.error('[Mailer] 管理员通知失败:', e.message))

  res.json({ ok: true, token, account: publicAccount(user) })
})

// —— 登录（手机号 + 密码）——
app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body || {}
  if (!/^1\d{10}$/.test(phone || '')) return res.status(400).json({ ok: false, error: '手机号格式不正确' })
  const user = await db.findUserByPhone(phone)
  if (!user) return res.status(404).json({ ok: false, error: '账号不存在，请先注册' })
  if (!verifyPassword(password, user.salt, user.hash)) return res.status(401).json({ ok: false, error: '密码不正确' })
  const token = newToken()
  await db.createToken(token, user.id)
  res.json({ ok: true, token, account: publicAccount(user) })
})

// —— 当前账号 ——
app.get('/api/auth/me', auth, (req, res) => res.json({ ok: true, account: publicAccount(req.user) }))

// —— 文件上传 ——
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

app.post('/api/files/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: '未收到文件' })
  const fileId = newId('f')
  try {
    const result = await storage.upload(fileId, req.file.buffer, req.file.originalname)
    const meta = {
      id: fileId,
      name: req.file.originalname,
      size: req.file.size,
      mime: req.file.mimetype,
      ownerId: req.user.id,
      createdAt: new Date().toISOString(),
      storagePath: result.storagePath,
    }
    await db.createFile(meta)
    res.json({ ok: true, file: { id: meta.id, name: meta.name, size: meta.size, mime: meta.mime, url: `/api/files/${meta.id}` } })
  } catch (e) {
    console.error('[Upload] 文件上传失败:', e.message)
    res.status(500).json({ ok: false, error: '文件上传失败' })
  }
})

// —— 文件下载 ——
app.get('/api/files/:id', auth, async (req, res) => {
  const meta = await db.findFileById(req.params.id)
  if (!meta) return res.status(404).json({ ok: false, error: '文件不存在' })
  try {
    const buffer = await storage.download(meta)
    if (!buffer) return res.status(404).json({ ok: false, error: '文件已丢失' })
    res.setHeader('Content-Type', meta.mime || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(meta.name)}"`)
    res.end(buffer)
  } catch (e) {
    console.error('[Download] 文件下载失败:', e.message)
    res.status(500).json({ ok: false, error: '文件下载失败' })
  }
})

// —— 托管前端静态资源（生产全栈同进程）——
import fs from 'node:fs'
// 启动诊断
console.log('[Boot] __dirname:', __dirname)
console.log('[Boot] DIST:', DIST)
console.log('[Boot] DIST exists:', fs.existsSync(DIST))
if (fs.existsSync(DIST)) {
  console.log('[Boot] DIST contents:', fs.readdirSync(DIST))
}

if (fs.existsSync(DIST)) {
  console.log('[Static] 正在托管:', DIST)
  app.use(express.static(DIST))
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    if (req.method !== 'GET') return next()
    res.sendFile(path.join(DIST, 'index.html'))
  })
} else {
  console.warn('[Static] 未找到构建产物目录:', DIST)
  app.get('/', (req, res) => {
    res.status(503).send(`<h1>门店经营智脑</h1><p>前端构建产物未找到。请检查 Render Build Command 是否包含 <code>npm run build</code>，以及构建是否成功。</p><p>Expected: ${DIST}</p>`)
  })
}

// ---------- 启动 ----------
app.listen(PORT, () => {
  console.log(`[门店经营智脑] 后端已启动: http://localhost:${PORT}`)
  console.log(`  数据存储: ${db.mode} | 文件存储: ${storage.mode} | 邮件: ${mailer.ready ? '就绪' : '未配置'}`)

  // ---------- 自保活：每 10 分钟 ping 自己，防止 Render 免费版休眠 ----------
  const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
  setInterval(async () => {
    try {
      await fetch(`${SELF_URL}/api/health`)
      console.log(`[KeepAlive] ping ${SELF_URL}/api/health — ${new Date().toISOString().slice(11, 19)}`)
    } catch {
      // 静默失败，下次再试
    }
  }, 10 * 60 * 1000) // 10 分钟
})
