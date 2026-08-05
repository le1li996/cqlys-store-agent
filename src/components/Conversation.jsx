import React, { useState, useRef, useEffect } from 'react'
import ModuleReport from './ModuleReport.jsx'
import { uploadFile, fileDownloadUrl } from '../services/dataService.js'

function fmtSize(n) {
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(1) + ' MB'
}
function ext(name) {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toUpperCase().slice(0, 4) : 'FILE'
}

// 主视图：模块报告（若有）+ 对话流，同处一个滚动区，底部为输入栏。
export default function Conversation({ module, messages, loading, onSend, onSaveReport, onAddDecision }) {
  const [text, setText] = useState('')
  const [online, setOnline] = useState(false)
  const [memory, setMemory] = useState(true)
  const [pending, setPending] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const scrollRef = useRef(null)

  const hasReport =
    module &&
    ((module.metrics && module.metrics.length) ||
      (module.charts && module.charts.length) ||
      (module.diagnosis && module.diagnosis.length) ||
      (module.suggestions && module.suggestions.length))

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, loading])

  const send = () => {
    const t = text.trim()
    if ((!t && pending.length === 0) || loading) return
    onSend(t, pending)
    setText('')
    setPending([])
  }
  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const handlePick = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      const meta = await uploadFile(file)
      setPending((p) => [...p, meta])
    } catch (err) {
      alert('上传失败：' + (err.message || '未知错误'))
    } finally {
      setUploading(false)
    }
  }

  const removePending = (id) => setPending((p) => p.filter((f) => f.id !== id))

  return (
    <section className="conversation">
      <div className="conv-scroll" ref={scrollRef}>
        {hasReport && <ModuleReport module={module} onSaveReport={onSaveReport} onAddDecision={onAddDecision} />}

        {!hasReport && messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">{module ? module.icon : '💡'}</div>
            <div className="chat-empty-title">{module ? `已进入「${module.name}」` : '门店经营智脑'}</div>
            <div className="chat-empty-desc">
              {module ? module.description : '从左侧选择任一分析模块，或直接向我提问。'}
            </div>
            {module && module.prompt && (
              <button className="quick-prompt" onClick={() => onSend(module.prompt)}>
                💡 {module.prompt}
              </button>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="msg-avatar">{m.role === 'user' ? '我' : '脑'}</div>
            <div className="msg-bubble">
              {m.content.split('\n').map((line, li) => (
                <p key={li}>{line || ' '}</p>
              ))}
              {m.files && m.files.length > 0 && (
                <div className="msg-files">
                  {m.files.map((f) => (
                    <a
                      key={f.id}
                      className="file-card"
                      href={fileDownloadUrl(f.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="file-ext">{ext(f.name)}</span>
                      <span className="file-meta">
                        <span className="file-name">{f.name}</span>
                        <span className="file-size">{fmtSize(f.size)}</span>
                      </span>
                      <span className="file-dl">↓</span>
                    </a>
                  ))}
                </div>
              )}
              {m.report && (
                <div className="msg-report">
                  <div className="msg-report-head">📑 已生成诊断报告</div>
                  <div className="msg-report-sum">{m.report}</div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="msg assistant">
            <div className="msg-avatar">脑</div>
            <div className="msg-bubble">
              <div className="typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-bar">
        <div className="chat-tools">
          <span className="tool" title="上传数据表" onClick={() => fileRef.current && fileRef.current.click()}>
            📎 上传{uploading ? '…' : ''}
          </span>
          <input
            ref={fileRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handlePick}
          />
          <button className={`tool toggle ${online ? 'on' : ''}`} onClick={() => setOnline((v) => !v)}>
            🌐 联网{online ? '·开' : ''}
          </button>
          <button className={`tool toggle ${memory ? 'on' : ''}`} onClick={() => setMemory((v) => !v)}>
            🔖 记忆{memory ? '·开' : ''}
          </button>
        </div>

        {pending.length > 0 && (
          <div className="pending-files">
            {pending.map((f) => (
              <span className="pending-chip" key={f.id}>
                📄 {f.name} <i onClick={() => removePending(f.id)}>✕</i>
              </span>
            ))}
          </div>
        )}

        <div className="chat-input-row">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder="输入你的问题，Enter 发送，Shift+Enter 换行…"
            rows={2}
          />
          <button className="send-btn" onClick={send} disabled={loading || !text.trim()}>
            发送 ↑
          </button>
        </div>
      </div>
    </section>
  )
}
