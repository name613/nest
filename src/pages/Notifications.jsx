import React, { useState, useEffect } from 'react'
import { getNotifications, markRead, MEMBERS } from '../api/supabase.js'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  return new Date(dateStr).toLocaleDateString('zh-Hans')
}

export default function Notifications({ memberId, onOpenPost }) {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [memberId])

  async function load() {
    setLoading(true)
    try {
      const data = await getNotifications(memberId)
      setNotifs(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleClick(n) {
    if (!n.is_read) {
      await markRead(n.id)
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
    }
    if (n.post_id) onOpenPost(n.post_id)
  }

  return (
    <>
      <div className="page-header" style={{ position: 'sticky', top: 0 }}>
        <span className="page-header-title" style={{ fontSize: 16, color: 'var(--text)' }}>通知</span>
      </div>

      <div className="notif-page">
        {loading ? (
          <div className="loading-state">加载中…</div>
        ) : notifs.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔔</div>
            <div>没有通知</div>
          </div>
        ) : (
          notifs.map(n => {
            const from = MEMBERS[n.from?.id ?? n.from_member] ?? { avatar: '👤', name: n.from_member }
            return (
              <div
                key={n.id}
                className={`notif-item ${n.is_read ? '' : 'unread'}`}
                onClick={() => handleClick(n)}
              >
                <span className="notif-av">{from.avatar}</span>
                <div className="notif-body">
                  <div className="notif-text">
                    <strong>{from.name}</strong> 在{n.comment_id ? '评论' : '帖子'}里提到了你
                  </div>
                  {n.post && (
                    <div className="notif-post-title">「{n.post.title}」</div>
                  )}
                  <div className="notif-time">{timeAgo(n.created_at)}</div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
