import React, { useState } from 'react'
import { register, login, sendCode } from '../services/dataService.js'

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('register')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [devCode, setDevCode] = useState('')
  const [showCode, setShowCode] = useState(false)

  const startCountdown = () => {
    setCountdown(60)
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(t); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const handleSendCode = async () => {
    setErr('')
    setShowCode(false)
    if (!/^1\d{10}$/.test(phone)) { setErr('请输入有效的 11 位手机号'); return }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('请输入有效的邮箱地址'); return }
    setLoading(true)
    try {
      const r = await sendCode(email)
      if (!r.ok) { setErr(r.error || '获取验证码失败'); return }
      startCountdown()
      if (r.devCode) {
        setDevCode(r.devCode)
        setTimeout(() => setShowCode(true), 10000)
      }
    } catch (e) {
      setErr(e.message || '获取验证码失败')
    } finally { setLoading(false) }
  }

  const submit = async () => {
    setErr(''); setOk('')
    if (!/^1\d{10}$/.test(phone)) { setErr('请输入有效的 11 位手机号'); return }
    if (password.length < 6) { setErr('密码至少 6 位'); return }
    setLoading(true)
    try {
      let res
      if (mode === 'register') {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('请输入有效的邮箱地址'); setLoading(false); return }
        if (!/^\d{6}$/.test(code)) { setErr('请输入 6 位验证码'); setLoading(false); return }
        res = await register({ phone, email, companyName: companyName.trim(), code, password })
      } else {
        res = await login({ phone, password })
      }
      if (!res.ok) { setErr(res.error || '操作失败'); return }
      setOk(mode === 'register' ? '注册成功！' : '登录成功！')
      setTimeout(() => onAuth(res.account), 400)
    } catch (e) {
      setErr(e.message || '操作失败')
    } finally { setLoading(false) }
  }

  const onKey = (e) => { if (e.key === 'Enter') submit() }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">店</div>
        <h1 className="auth-title">门店经营智脑</h1>
        <p className="auth-desc">AI 驱动的门店数据分析与经营诊断平台</p>

        <div className="auth-tabs">
          <span className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setErr(''); setOk('') }}>注册</span>
          <span className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setErr(''); setOk('') }}>登录</span>
        </div>

        <div className="auth-form">
          <div className="field">
            <label>手机号</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="11 位手机号" maxLength={11} onKeyDown={onKey} />
          </div>

          {mode === 'register' && (
            <>
              <div className="field">
                <label>邮箱</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="用于接收验证码" />
              </div>
              <div className="field">
                <label>企业名称</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="您的企业或门店名称（选填）" />
              </div>
              <div className="field">
                <label>验证码</label>
                <div className="code-row">
                  <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6 位验证码" maxLength={6} />
                  <button className="btn-ghost sm code-btn" onClick={handleSendCode} disabled={loading || countdown > 0}>
                    {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  {showCode ? '验证码已显示，5 分钟内有效' : '验证码将在 10 秒后自动显示'}
                </p>
                {devCode && showCode && (
                  <div className="auth-dev-tip" style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}>
                    ✅ 验证码：<b style={{ fontSize: 22, letterSpacing: 4 }}>{devCode}</b>
                  </div>
                )}
                {devCode && !showCode && (
                  <div className="auth-dev-tip" style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e' }}>
                    ⏳ 验证码已生成，10 秒后显示…
                  </div>
                )}
              </div>
            </>
          )}

          <div className="field">
            <label>密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 6 位" onKeyDown={onKey} />
          </div>

          {err && <div className="form-err">{err}</div>}
          {ok && <div className="form-ok">{ok}</div>}

          <button className="btn-primary block" onClick={submit} disabled={loading}>
            {loading ? '处理中…' : mode === 'register' ? '注册并进入' : '登录'}
          </button>

          <div className="auth-switch">
            {mode === 'register'
              ? <span>已有账号？<a onClick={() => { setMode('login'); setErr(''); setOk('') }}>去登录</a></span>
              : <span>还没有账号？<a onClick={() => { setMode('register'); setErr(''); setOk('') }}>去注册</a></span>}
          </div>
        </div>
      </div>
    </div>
  )
}
