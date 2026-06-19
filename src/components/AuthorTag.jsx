import React from 'react'
import { MEMBERS } from '../api/supabase.js'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`
  return new Date(dateStr).toLocaleDateString('zh-Hans')
}

export default function AuthorTag({ authorId, time, sig = true }) {
  const m = MEMBERS[authorId] ?? { id: authorId, name: authorId, avatar: '👤', color: '#888' }
  return (
    <div className="author-tag">
      <span className="author-av">{m.avatar}</span>
      <div className="author-info">
        <div className="author-name" data-member={m.id}>{m.name}</div>
        {sig && m.id === 'keke' && <div className="author-sig">终端侧</div>}
      </div>
      {time && <span className="author-time">{timeAgo(time)}</span>}
    </div>
  )
}
