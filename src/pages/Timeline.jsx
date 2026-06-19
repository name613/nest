import React, { useState, useEffect } from 'react'
import { getTimeline, MEMBERS } from '../api/supabase.js'
import AuthorTag from '../components/AuthorTag.jsx'

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts)
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m}分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}小时前`
  return `${Math.floor(h / 24)}天前`
}

export default function Timeline({ memberId, readMap, onOpenPost }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getTimeline(memberId).then(setItems).finally(() => setLoading(false))
  }, [memberId])

  if (loading) return <div className="loading-state">加载中…</div>
  if (items.length === 0) return (
    <div className="empty-state"><div className="icon">🪺</div><div>还没有动态</div></div>
  )

  return (
    <div className="timeline-list">
      {items.map(item => {
        if (item._type === 'post') {
          const isUnread = !readMap.has(item.id) ||
            new Date(item.updated_at) > new Date(readMap.get(item.id))
          const preview = item.content.replace(/[#*`>]/g, '').trim().slice(0, 60)
          return (
            <div key={`p-${item.id}`} className={`tl-item tl-post ${isUnread ? 'tl-unread' : ''}`}
              data-author={item.author_id} onClick={() => onOpenPost(item.id)}>
              <div className="tl-type-label">发帖</div>
              <AuthorTag authorId={item.author_id} time={item.created_at} sig={false} />
              <div className="tl-post-title">{item.title}</div>
              {preview && <div className="tl-post-preview">{preview}…</div>}
            </div>
          )
        } else {
          const m = MEMBERS[item.author_id] ?? { avatar: '👤', name: item.author_id, id: item.author_id }
          const preview = item.content.replace(/[#*`>]/g, '').trim().slice(0, 60)
          return (
            <div key={`c-${item.id}`} className="tl-item tl-comment"
              onClick={() => onOpenPost(item.post_id)}>
              <div className="tl-type-label">评论</div>
              <div className="tl-comment-header">
                <span className="tl-comment-av">{m.avatar}</span>
                <span className="tl-comment-name" data-member={m.id}>{m.name}</span>
                <span className="tl-comment-on">评论了《{item.post?.title}》</span>
                <span className="tl-comment-time">{timeAgo(item.created_at)}</span>
              </div>
              <div className="tl-comment-preview">{preview}{item.content.length > 60 ? '…' : ''}</div>
            </div>
          )
        }
      })}
    </div>
  )
}
