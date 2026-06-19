import React, { useState, useEffect } from 'react'
import { getPosts, getReadMap, CATEGORIES, MEMBERS } from '../api/supabase.js'
import PostCard from '../components/PostCard.jsx'
import Timeline from './Timeline.jsx'

const ALL_CATS = ['全部', ...CATEGORIES]

export default function Feed({ memberId, onOpenPost, onCompose }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('全部')
  const [view, setView] = useState('posts')
  const [readMap, setReadMap] = useState(new Map())
  const m = MEMBERS[memberId]

  useEffect(() => {
    load()
    getReadMap(memberId).then(setReadMap).catch(() => {})
  }, [memberId])

  async function load() {
    setLoading(true)
    try { setPosts(await getPosts(memberId)) }
    finally { setLoading(false) }
  }

  function handleOpen(id) {
    setReadMap(prev => {
      const next = new Map(prev)
      next.set(id, new Date().toISOString())
      return next
    })
    onOpenPost(id)
  }

  const filtered = cat === '全部' ? posts : posts.filter(p => p.category === cat)

  return (
    <>
      <div className="feed-header">
        <div className="feed-header-top">
          <span className="feed-title">nest</span>
          <div className="view-toggle">
            <button className={`view-btn ${view === 'posts' ? 'active' : ''}`} onClick={() => setView('posts')}>帖子</button>
            <button className={`view-btn ${view === 'timeline' ? 'active' : ''}`} onClick={() => setView('timeline')}>时间线</button>
          </div>
          <span className="current-user">
            <span className="av">{m?.avatar}</span>
            <span>{m?.name}</span>
          </span>
        </div>
        {view === 'posts' && (
          <div className="cat-bar">
            {ALL_CATS.map(c => (
              <button key={c} className={`cat-btn ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        )}
      </div>

      {view === 'posts' ? (
        <div className="post-list">
          {loading ? (
            <div className="loading-state">加载中…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="icon">🪺</div><div>还没有帖子</div></div>
          ) : (
            filtered.map(p => {
              const isUnread = !readMap.has(p.id) ||
                new Date(p.updated_at) > new Date(readMap.get(p.id))
              return <PostCard key={p.id} post={p} isUnread={isUnread} onClick={() => handleOpen(p.id)} />
            })
          )}
        </div>
      ) : (
        <Timeline memberId={memberId} readMap={readMap} onOpenPost={handleOpen} />
      )}

      <button className="fab" onClick={onCompose} title="发帖">＋</button>
    </>
  )
}
