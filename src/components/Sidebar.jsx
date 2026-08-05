import React, { useState } from 'react'

// 左侧分类导航：四大板块 + 模块清单，支持折叠
export default function Sidebar({ categories, activeId, onSelect, store, account }) {
  const [open, setOpen] = useState(() => {
    const init = {}
    categories.forEach((c) => (init[c.id] = true))
    return init
  })

  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }))

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">店</div>
        <div className="brand-text">
          <div className="brand-name">门店经营智脑</div>
          <div className="brand-sub">Store Analytics Agent</div>
        </div>
      </div>

      <div className="store-chip">
        <span className="store-dot" />
        <div className="store-info">
          <div className="store-name">{store.name}</div>
          <div className="store-meta">
            {store.region} · {account.plan}
          </div>
        </div>
      </div>

      <nav className="nav">
        {categories.map((cat) => (
          <div className="nav-group" key={cat.id}>
            <button className="nav-group-head" onClick={() => toggle(cat.id)}>
              <span className="nav-group-icon">{cat.icon}</span>
              <span className="nav-group-name">{cat.name}</span>
              <span className={`nav-caret ${open[cat.id] ? 'open' : ''}`}>▾</span>
            </button>
            {open[cat.id] && (
              <div className="nav-items">
                {cat.modules.map((m) => (
                  <button
                    key={m.id}
                    className={`nav-item ${activeId === m.id ? 'active' : ''}`}
                    onClick={() => onSelect(m.id)}
                  >
                    <span className="nav-item-icon">{m.icon}</span>
                    <span className="nav-item-name">{m.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-foot-tip">门店经营智脑 · v0.1.0</div>
      </div>
    </aside>
  )
}
