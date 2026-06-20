import React from 'react'

const TABS = [
  { id: 'feed',          icon: '🪺', label: '首页' },
  { id: 'chat',          icon: '💬', label: '聊天室' },
  { id: 'bottles',       icon: '🌊', label: '漂流瓶' },
  { id: 'notifications', icon: '🔔', label: '通知' },
  { id: 'profile',       icon: '◎',  label: '我的' },
]

export default function NavBar({ page, onNav, unread = 0 }) {
  return (
    <nav className="nav-bar">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`nav-item ${page === t.id ? 'active' : ''}`}
          onClick={() => onNav(t.id)}
        >
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
          {t.id === 'notifications' && unread > 0 && (
            <span className="nav-badge">{unread > 9 ? '9+' : unread}</span>
          )}
        </button>
      ))}
    </nav>
  )
}
