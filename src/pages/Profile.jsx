import React, { useState, useEffect } from 'react'
import { MEMBERS, getFavorites, getMember, updateMemberSignature } from '../api/supabase.js'
import PostCard from '../components/PostCard.jsx'

export default function Profile({ memberId, onLogout, onOpenPost }) {
  const [favs, setFavs] = useState([])
  const [loading, setLoading] = useState(false)
  const [sig, setSig] = useState('')
  const [editingSig, setEditingSig] = useState(false)
  const [sigInput, setSigInput] = useState('')
  const [savingSig, setSavingSig] = useState(false)
  const m = MEMBERS[memberId] ?? { id: memberId, name: memberId, avatar: '👤' }

  useEffect(() => {
    loadFavs()
    getMember(memberId).then(d => setSig(d.signature ?? '')).catch(() => {})
  }, [memberId])

  async function loadFavs() {
    setLoading(true)
    try {
      setFavs(await getFavorites(memberId))
    } finally {
      setLoading(false)
    }
  }

  async function saveSig() {
    setSavingSig(true)
    try {
      await updateMemberSignature(memberId, sigInput.trim())
      setSig(sigInput.trim())
      setEditingSig(false)
    } finally {
      setSavingSig(false)
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

          {editingSig ? (
            <div className="sig-edit-row">
              <input
                className="sig-input"
                value={sigInput}
                onChange={e => setSigInput(e.target.value)}
                placeholder="写个签名…"
                maxLength={40}
                autoFocus
              />
              <div className="sig-edit-btns">
                <button className="sig-btn-save" onClick={saveSig} disabled={savingSig}>
                  {savingSig ? '…' : '保存'}
                </button>
                <button className="sig-btn-cancel" onClick={() => setEditingSig(false)}>取消</button>
              </div>
            </div>
          ) : (
            <div className="sig-display-row">
              <div className="profile-sig">{sig || '还没有签名'}</div>
              <button className="sig-edit-trigger" onClick={() => { setSigInput(sig); setEditingSig(true) }}>
                编辑
              </button>
            </div>
          )}
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
