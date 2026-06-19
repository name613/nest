import React, { useState, useEffect } from 'react'
import { MEMBERS, getFavorites } from '../api/supabase.js'
import PostCard from '../components/PostCard.jsx'

export default function Profile({ memberId, onLogout, onOpenPost }) {
  const [tab, setTab] = useState('favorites')
  const [favs, setFavs] = useState([])
  const [loading, setLoading] = useState(false)
  const m = MEMBERS[memberId] ?? { id: memberId, name: memberId, avatar: '👤' }

  useEffect(() => {
    if (tab === 'favorites') loadFavs()
  }, [tab, memberId])

  async function loadFavs() {
    setLoading(true)
    try {
      setFavs(await getFavorites(memberId))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="page-header" style={{ position: 'sticky', top: 0 }}>
        <span className="page-header-title" style={{ fontSize: 16, color: 'var(--text)' }}>我的</span>
      </div>

      <div className="profile-page">
        <div className="profile-card">
          <div className="profile-av">{m.avatar}</div>
          <div className="profile-name" data-member={m.id}>{m.name}</div>
          {m.id === 'keke' && <div className="profile-sig">终端侧</div>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <p className="profile-section-title">收藏</p>
          {loading ? (
            <div className="loading-state">加载中…</div>
          ) : favs.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div>还没有收藏</div>
            </div>
          ) : (
            favs.map(p => (
              <PostCard key={p.id} post={p} onClick={() => onOpenPost(p.id)} />
            ))
          )}
        </div>

        <button className="logout-btn" onClick={onLogout}>退出登录</button>
      </div>
    </>
  )
}
