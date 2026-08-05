import React, { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import Conversation from './components/Conversation.jsx'
import DecisionPanel from './components/DecisionPanel.jsx'
import AuthPage from './components/AuthPage.jsx'
import { categories, getModule } from './data/modules.js'
import { storeProfile } from './data/storeProfile.js'
import { sendMessage } from './services/aiService.js'
import {
  getAccount, isLoggedIn,
  getDecisions, addDecision, updateDecisionStatus, removeDecision,
  getReports, saveReport, getUsage, bumpUsage, logout,
} from './services/dataService.js'

export default function App() {
  const [activeId, setActiveId] = useState('overview')
  const [messagesByModule, setMessagesByModule] = useState({})
  const [loading, setLoading] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const [drawerTab, setDrawerTab] = useState('decisions')

  const [account, setAccount] = useState(() => (isLoggedIn() ? getAccount() : null))
  const [decisions, setDecisions] = useState(() => getDecisions())
  const [reports, setReports] = useState(() => getReports())
  const [usage, setUsage] = useState(() => getUsage())

  const module = getModule(activeId)
  const messages = messagesByModule[activeId] || []

  const selectModule = (id) => {
    setActiveId(id)
  }

  const newChat = () => {
    setMessagesByModule((m) => ({ ...m, [activeId]: [] }))
  }

  const handleSend = async (text, files = []) => {
    const userMsg = { role: 'user', content: text, files: files && files.length ? files : undefined }
    setMessagesByModule((m) => ({ ...m, [activeId]: [...(m[activeId] || []), userMsg] }))
    setLoading(true)
    try {
      const res = await sendMessage({ moduleId: activeId, message: text })
      const aiMsg = { role: 'assistant', content: res.content }
      setMessagesByModule((m) => ({ ...m, [activeId]: [...(m[activeId] || []), aiMsg] }))
      setUsage(bumpUsage(false))
    } catch (e) {
      const errMsg = { role: 'assistant', content: '⚠️ 调用失败：' + e.message }
      setMessagesByModule((m) => ({ ...m, [activeId]: [...(m[activeId] || []), errMsg] }))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveReport = (mod) => {
    const summary = (mod.diagnosis && mod.diagnosis[0] ? mod.diagnosis[0] : '已生成诊断报告') +
      (mod.suggestions && mod.suggestions[0] ? ' 建议：' + mod.suggestions[0] : '')
    const r = saveReport({ moduleId: mod.id, moduleName: mod.name, summary })
    setReports(getReports())
    const note = {
      role: 'assistant',
      content: `已为你生成《${mod.name}》诊断报告，并保存到「历史报告」。`,
      report: summary,
    }
    setMessagesByModule((m) => ({ ...m, [activeId]: [...(m[activeId] || []), note] }))
  }

  const handleAddDecision = (text, source) => {
    addDecision(text, source)
    setDecisions(getDecisions())
  }

  const handleAuth = (acc) => {
    setAccount(acc)
  }

  const handleLogout = () => {
    logout()
    setAccount(null)
  }

  // 未登录 → 仅显示注册/登录页
  if (!account) {
    return <AuthPage onAuth={handleAuth} />
  }

  const openHistory = () => {
    setDrawerTab('reports')
    setPanelOpen(true)
  }

  return (
    <div className="app">
      <Sidebar
        categories={categories}
        activeId={activeId}
        onSelect={selectModule}
        store={storeProfile}
        account={account}
      />

      <main className="main">
        <TopBar
          module={module}
          onNewChat={newChat}
          panelOpen={panelOpen}
          onTogglePanel={() => setPanelOpen((v) => !v)}
          onOpenHistory={openHistory}
        />
        <Conversation
          module={module}
          messages={messages}
          loading={loading}
          onSend={handleSend}
          onSaveReport={handleSaveReport}
          onAddDecision={handleAddDecision}
        />
      </main>

      <DecisionPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        decisions={decisions}
        reports={reports}
        usage={usage}
        openTab={drawerTab}
        onUpdateDecision={(id, status) => {
          updateDecisionStatus(id, status)
          setDecisions(getDecisions())
        }}
        onRemoveDecision={(id) => {
          removeDecision(id)
          setDecisions(getDecisions())
        }}
      />

      <div className="account-fab" title="账号">
        <span className="af-avatar">{account.name.slice(0, 1)}</span>
        <span className="af-name">{account.name}</span>
        <button className="af-out" onClick={handleLogout}>
          退出
        </button>
      </div>
    </div>
  )
}
