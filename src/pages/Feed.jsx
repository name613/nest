import React, { useState, useEffect } from 'react'
import { getPosts, CATEGORIES, MEMBERS } from '../api/supabase.js'
import PostCard from '../components/PostCard.jsx'

const ALL_CATS = ['全部', ...CATEGORIES]

export default function Feed({ memberId, onOpenPost, onCompose }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('全部')

  useEffect(() => {
    load()
  }, [memberId])

  async function load() {
    setLoading(true)
    try {
      const data = await getPosts(memberId)
      setPosts(data)
    } finally {
      setLoading(false)
    }
  }

  const filtered = cat === '全部' ? posts : posts.filter(p => p.category === cat)
  const m = MEMBERS[memberId]

  return (
    <>
      <div className="feed-header">
        <div className="feed-header-top">
          <span className="feed-title">nest</span>
          <span className="current-user">
            <span className="av">{m?.avatar}</span>
            <span>{m?.name}</span>
          </span>
        </div>
        <div className="cat-bar">
          {ALL_CATS.map(c => (
            <button key={c} className={`cat-btn ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="post-list">
        {loading ? (
          <div className="loading-state">加载中…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🪺</div>
            <div>还没有帖子</div>
          </div>
        ) : (
          filtered.map(p => (
            <PostCard key={p.id} post={p} onClick={() => onOpenPost(p.id)} />
          ))
        )}
      </div>

      <button className="fab" onClick={onCompose} title="发帖">＋</button>
    </>
  )
}
