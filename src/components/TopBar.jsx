import React from 'react'
import { aiConfig } from '../services/aiService.js'

// 顶部栏：当前模块、模型切换、新建对话、右侧面板开关
export default function TopBar({ module, onNewChat, panelOpen, onTogglePanel, onOpenHistory }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">{module ? module.name : '门店经营智脑'}</div>
        {module && module.subtitle && <div className="topbar-sub">{module.subtitle}</div>}
      </div>

      <div className="topbar-right">
        <button className="btn-ghost" onClick={onNewChat}>
          ＋ 新对话
        </button>
        <button className="btn-ghost" onClick={onOpenHistory}>
          📁 历史报告
        </button>
        <button className={`btn-ghost ${panelOpen ? 'active' : ''}`} onClick={onTogglePanel}>
          📌 决策清单
        </button>
        <div className="model-select">
          <span className="model-label">模型</span>
          <select
            defaultValue={aiConfig.defaultModel}
            title={aiConfig.useMock ? '当前为演示模型' : ''}
          >
            {aiConfig.availableModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  )
}
