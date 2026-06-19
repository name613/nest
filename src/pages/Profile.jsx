import React, { useState, useEffect } from 'react'
import { MEMBERS, getFavorites, getMember, updateMemberSignature,
         getCollections, getMyPosts } from '../api/supabase.js'
import PostCard from '../components/PostCard.jsx'

export default function Profile({ memberId, onLogout, onOpenPost, onOpenCollection, onEditPost }) {
  const [tab, setTab] = useState('posts')
  const [myPosts, setMyPosts] = useState([])
  const [favs, setFavs] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(false)
  const [sig, setSig] = useState('')
  const [editingSig, setEditingSig] = useState(false)
  const [sigInput, setSigInput] = useState('')
  const [savingSig, setSavingSig] = useState(false)
  const [showCreateColl, setShowCreateColl] = useState(false)
  const [newCollTitle, setNewCollTitle] = useState('')
  const [newCollDesc, setNewCollDesc] = useState('')
  const [creatingColl, setCreatingColl] = useState(false)
  const m = MEMBERS[memberId] ?? { id: memberId, name: memberId, avatar: '👤' }

  useEffect(() => {
    getMember(memberId).then(d => setSig(d.signature ?? '')).catch(() => {})
  }, [memberId])

  useEffect(() => {
    setLoading(true)
    if (tab === 'posts') {
      getMyPosts(memberId).then(setMyPosts).finally(() => setLoading(false))
    } else if (tab === 'drafts') {
      getMyPosts(memberId).then(all => setMyPosts(all.filter(p => p.is_draft))).finally(() => setLoading(false))
    } else if (tab === 'favorites') {
      getFavorites(memberId).then(setFavs).finally(() => setLoading(false))
    } else {
      getCollections().then(setCollections).finally(() => setLoading(false))
    }
  }, [tab, memberId])

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

  async function handleCreateCollection() {
    if (!newCollTitle.trim()) return
    setCreatingColl(true)
    try {
      const { createCollection } = await import('../api/supabase.js')
      await createCollection(memberId, newCollTitle.trim(), newCollDesc.trim())
      setNewCollTitle('')
      setNewCollDesc('')
      setShowCreateColl(false)
      getCollections().then(setCollections)
    } finally {
      setCreatingColl(false)
    }
  }

  const published = myPosts.filter(p => !p.is_draft)
  const drafts = myPosts.filter(p => p.is_draft)

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
              <input className="sig-input" value={sigInput} onChange={e => setSigInput(e.target.value)}
                placeholder="写个签名…" maxLength={40} autoFocus />
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
              <button className="sig-edit-trigger" onClick={() => { setSigInput(sig); setEditingSig(true) }}>编辑</button>
            </div>
          )}
        </div>

        <div className="profile-tabs">
          <button className={`profile-tab ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>
            帖子{published.length > 0 ? ` · ${published.length}` : ''}
          </button>
          <button className={`profile-tab ${tab === 'drafts' ? 'active' : ''}`} onClick={() => setTab('drafts')}>
            草稿{drafts.length > 0 ? ` · ${drafts.length}` : ''}
          </button>
          <button className={`profile-tab ${tab === 'favorites' ? 'active' : ''}`} onClick={() => setTab('favorites')}>收藏</button>
          <button className={`profile-tab ${tab === 'collections' ? 'active' : ''}`} onClick={() => setTab('collections')}>合集</button>
        </div>

        {(tab === 'posts' || tab === 'drafts') && (
          loading ? <div className="loading-state">加载中…</div>
          : (tab === 'posts' ? published : drafts).length === 0
            ? <div className="empty-state" style={{ padding: '24px 0' }}>
                <div>{tab === 'drafts' ? '没有草稿' : '还没有发帖'}</div>
              </div>
            : (tab === 'posts' ? published : drafts).map(p => (
                <div key={p.id} style={{ position: 'relative' }}>
                  <PostCard post={p} onClick={() => onOpenPost(p.id)} />
                  {p.is_draft && onEditPost && (
                    <button className="draft-edit-btn" onClick={e => { e.stopPropagation(); onEditPost(p) }}>
                      继续编辑
                    </button>
                  )}
                </div>
              ))
        )}

        {tab === 'favorites' && (
          loading ? <div className="loading-state">加载中…</div>
          : favs.length === 0
            ? <div className="empty-state" style={{ padding: '24px 0' }}><div>还没有收藏</div></div>
            : favs.map(p => <PostCard key={p.id} post={p} onClick={() => onOpenPost(p.id)} />)
        )}

        {tab === 'collections' && (
          <>
            <div style={{ marginBottom: 12 }}>
              <button className="btn-outline" style={{ width: '100%' }} onClick={() => setShowCreateColl(v => !v)}>
                {showCreateColl ? '取消' : '＋ 创建合集'}
              </button>
            </div>
            {showCreateColl && (
              <div className="create-coll-form">
                <input className="form-input" placeholder="合集名称" value={newCollTitle}
                  onChange={e => setNewCollTitle(e.target.value)} style={{ marginBottom: 8 }} />
                <input className="form-input" placeholder="简介（可选）" value={newCollDesc}
                  onChange={e => setNewCollDesc(e.target.value)} style={{ marginBottom: 10 }} />
                <button className="btn-submit" onClick={handleCreateCollection} disabled={!newCollTitle.trim() || creatingColl}>
                  {creatingColl ? '创建中…' : '创建'}
                </button>
              </div>
            )}
            {loading ? <div className="loading-state">加载中…</div>
            : collections.length === 0
              ? <div className="empty-state" style={{ padding: '24px 0' }}><div>还没有合集</div></div>
              : collections.map(c => (
                <button key={c.id} className="collection-card" onClick={() => onOpenCollection(c.id)}>
                  <div className="collection-card-title">{c.title}</div>
                  {c.description && <div className="collection-card-desc">{c.description}</div>}
                  <div className="collection-card-meta">
                    <span data-member={c.author_id}>{MEMBERS[c.author_id]?.avatar} {MEMBERS[c.author_id]?.name}</span>
                    <span>{c.post_count?.[0]?.count ?? 0} 篇</span>
                  </div>
                </button>
              ))
            }
          </>
        )}

        <button className="logout-btn" style={{ marginTop: 24 }} onClick={onLogout}>退出登录</button>
      </div>
    </>
  )
}
