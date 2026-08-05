import React, { useState, useEffect } from 'react'

const STATUS = [
  { key: 'todo', label: '待执行' },
  { key: 'doing', label: '执行中' },
  { key: 'done', label: '已完成' },
  { key: 'dropped', label: '已放弃' },
]

const STATUS_CLASS = {
  todo: 'st-todo',
  doing: 'st-doing',
  done: 'st-done',
  dropped: 'st-dropped',
}

export default function DecisionPanel({ open, onClose, decisions, reports, usage, onUpdateDecision, onRemoveDecision, openTab }) {
  const [tab, setTab] = useState('decisions')
  useEffect(() => {
    if (openTab) setTab(openTab)
  }, [openTab])

  return (
    <>
      {open && <div className="drawer-mask" onClick={onClose} />}
      <aside className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-head">
          <div className="drawer-tabs">
            <button className={tab === 'decisions' ? 'on' : ''} onClick={() => setTab('decisions')}>
              决策清单
            </button>
            <button className={tab === 'reports' ? 'on' : ''} onClick={() => setTab('reports')}>
              历史报告
            </button>
            <button className={tab === 'usage' ? 'on' : ''} onClick={() => setTab('usage')}>
              用量
            </button>
          </div>
          <button className="drawer-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-body">
          {tab === 'decisions' && (
            <>
              {decisions.length === 0 && <div className="drawer-empty">暂无决策项。在模块报告中点击「加入决策清单」即可添加。</div>}
              {decisions.map((d) => (
                <div className="decision-item" key={d.id}>
                  <div className="decision-text">{d.text}</div>
                  {d.source && <div className="decision-source">来自：{d.source}</div>}
                  <div className="decision-foot">
                    <div className="status-switch">
                      {STATUS.map((s) => (
                        <button
                          key={s.key}
                          className={`st-btn ${STATUS_CLASS[s.key]} ${d.status === s.key ? 'on' : ''}`}
                          onClick={() => onUpdateDecision(d.id, s.key)}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <button className="decision-del" onClick={() => onRemoveDecision(d.id)} title="删除">
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === 'reports' && (
            <>
              {reports.length === 0 && <div className="drawer-empty">暂无报告。点击模块报告的「生成诊断报告」即可保存。</div>}
              {reports.map((r) => (
                <div className="report-item" key={r.id}>
                  <div className="report-item-name">📑 {r.moduleName}</div>
                  <div className="report-item-time">{new Date(r.createdAt).toLocaleString('zh-CN')}</div>
                  {r.summary && <div className="report-item-sum">{r.summary}</div>}
                </div>
              ))}
            </>
          )}

          {tab === 'usage' && (
            <div className="usage-box">
              <div className="usage-row">
                <span>对话次数</span>
                <b>{usage.count}</b>
              </div>
              <div className="usage-row">
                <span>高级引擎消耗</span>
                <b>{usage.advanced}</b>
              </div>
              <div className="usage-note">
                当前默认使用 <b>DeepSeek-V4（演示）</b>。Claude 等高级引擎暂未开放，后续开通付费功能后启用。
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
