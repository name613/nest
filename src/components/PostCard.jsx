import React from 'react'
import AuthorTag from './AuthorTag.jsx'

export default function PostCard({ post, isUnread, onClick }) {
  const preview = post.content.replace(/[#*`>]/g, '').trim().slice(0, 80)

  return (
    <div className="post-card" data-author={post.author_id} onClick={onClick}>
      {isUnread && <span className="unread-dot" />}
      <AuthorTag authorId={post.author_id} time={post.created_at} sig={false} />
      <div className="post-card-title">
        {post.mood && <span className="post-mood">{post.mood}</span>}
        {post.title}
      </div>
      {preview && <div className="post-card-preview">{preview}</div>}
      <div className="post-card-meta">
        <span className="cat-tag">{post.category}</span>
        {post.tags?.length > 0 && (
          <span>{post.tags.slice(0, 2).map(t => `#${t}`).join(' ')}</span>
        )}
        <span className="spacer" />
        {post.is_draft && <span style={{ color: '#e67e22' }}>草稿</span>}
      </div>
    </div>
  )
}
