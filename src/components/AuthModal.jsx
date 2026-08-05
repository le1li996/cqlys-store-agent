import React, { useState } from 'react'
import { register, login, sendCode, USE_REAL_BACKEND } from '../services/dataService.js'

// 登录 / 注册弹窗（真实手机号 + 验证码注册 / 手机号 + 密码登录）
export default function AuthModal({ open, onClose, onAuth }) {
  const [mode, setMode] = useState('register') // register | login
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [devCode, setDevCode] = useState('') // dev 模式下回显验证码，方便本地测试

  if (!open) return null

  const startCountdown = () => {
    setCountdown(60)
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const handleSendCode = async () => {
    setErr('')
    if (!/^1\d{10}$/.test(phone)) {
      setErr('请输入有效的 11 位手机号')
      return
    }
    setLoading(true)
    try {
      const r = await sendCode(phone)
      if (!r.ok) {
        setErr(r.error || '获取验证码失败')
        return
      }
      startCountdown()
      if (r.devCode) setDevCode(r.devCode) // 仅 dev 模式返回，便于本地体验
    } catch (e) {
      setErr(e.message || '获取验证码失败')
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    setErr('')
    setOk('')
    if (!/^1\d{10}$/.test(phone)) {
      setErr('请输入有效的 11 位手机号')
      return
    }
    if (password.length < 6) {
      setErr('密码至少 6 位')
      return
    }
    setLoading(true)
    try {
      let res
      if (mode === 'register') {
        if (!/^\d{6}$/.test(code)) {
          setErr('请输入 6 位验证码')
          setLoading(false)
          return
        }
        res = await register({ phone, code, password })
      } else {
        res = await login({ phone, password })
      }
      if (!res.ok) {
        setErr(res.error || '操作失败')
        return
      }
      setOk(mode === 'register' ? '注册成功！' : '登录成功！')
      onAuth(res.account)
      setTimeout(onClose, 600)
    } catch (e) {
      setErr(e.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <div className="modal-logo">店</div>
        <div className="modal-title">{mode === 'register' ? '注册门店经营智脑' : '登录'}</div>
        <div className="modal-sub">
          {mode === 'register' ? '手机号 + 验证码注册，注册后可用手机号密码登录' : '使用已注册的手机号与密码登录'}
        </div>

        <div className="field">
          <label>手机号</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="11 位手机号" maxLength={11} />
        </div>

        {mode === 'register' && (
          <div className="field">
            <label>验证码</label>
            <div className="code-row">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6 位验证码"
                maxLength={6}
              />
              <button
                className="btn-ghost sm code-btn"
                onClick={handleSendCode}
                disabled={loading || countdown > 0}
              >
                {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
              </button>
            </div>
            {devCode && (
              <div className="dev-code-tip">本次验证码：<b>{devCode}</b></div>
            )}
          </div>
        )}

        <div className="field">
          <label>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 位"
          />
        </div>

        {err && <div className="form-err">{err}</div>}
        {ok && <div className="form-ok">{ok}</div>}

        <button className="btn-primary block" onClick={submit} disabled={loading}>
          {loading ? '处理中…' : mode === 'register' ? '注册并进入' : '登录'}
        </button>

        <div className="modal-switch">
          {mode === 'register' ? (
            <span>
              已有账号？<a onClick={() => { setMode('login'); setErr(''); setDevCode('') }}>去登录</a>
            </span>
          ) : (
            <span>
              还没有账号？<a onClick={() => { setMode('register'); setErr('') }}>手机号注册</a>
            </span>
          )}
        </div>
        </div>
    </div>
  )
}
