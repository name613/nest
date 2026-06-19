import React, { useState, useEffect, useRef } from 'react'
import { marked } from 'marked'
import {
  getPostWithDetails, addComment, toggleReaction,
  toggleFavorite, MEMBERS
} from '../api/supabase.js'
import AuthorTag from '../components/AuthorTag.jsx'

const REACTION_EMOJIS = ['❤️', '🌟', '😄', '😢', '👏', '🌙']

marked.setOptions({ breaks: true, gfm: true })

export default function PostDetail({ postId, memberId, onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => { load() }, [postId])

  async function load() {
    setLoading(true)
    try {
      const d = await getPostWithDetails(postId, memberId)
      setData(d)
    } finally {
      setLoading(false)
    }
  }

  async function handleReaction(emoji) {
    await toggleReaction(postId, memberId, emoji)
    load()
  }

  async function handleFavorite() {
    await toggleFavorite(postId, memberId)
    load()
  }

  async function handleComment() {
    if (!comment.trim()) return
    setSending(true)
    try {
      const c = await addComment(postId, memberId, comment.trim())
      setComment('')
      setData(prev => ({ ...prev, comments: [...prev.comments, c] }))
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="loading-state">加载中…</div>
  if (!data?.post) return <div className="empty-state"><div>帖子不存在或无权查看</div></div>

  const { post, comments, reactions, isFavorited } = data

  const reactionCounts = {}
  const myReactions = new Set()
  for (const r of reactions) {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] ?? 0) + 1
    if (r.author_id === memberId) myReactions.add(r.emoji)
  }

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <span className="page-header-title">{post.category}</span>
      </div>

      <div className="post-detail">
        <AuthorTag authorId={post.author_id} time={post.created_at} />
        <h1 className="post-detail-title">{post.title}</h1>

        {post.tags?.length > 0 && (
          <div className="post-tags">
            {post.tags.map(t => <span key={t} className="post-tag">#{t}</span>)}
          </div>
        )}

        <div
          className="post-body"
          dangerouslySetInnerHTML={{ __html: marked.parse(post.content) }}
        />

        <div className="post-actions">
          {REACTION_EMOJIS.map(e => (
            <button
              key={e}
              className={`action-btn ${myReactions.has(e) ? 'active' : ''}`}
              onClick={() => handleReaction(e)}
            >
              <span className="emoji">{e}</span>
              {reactionCounts[e] ? <span>{reactionCounts[e]}</span> : null}
            </button>
          ))}
          <button
            className={`action-btn fav-btn ${isFavorited ? 'active' : ''}`}
            onClick={handleFavorite}
          >
            <span className="emoji">{isFavorited ? '🔖' : '🔖'}</span>
            <span>{isFavorited ? '已收藏' : '收藏'}</span>
          </button>
        </div>

        <div className="comments-section">
          <h3>评论 {comments.length > 0 ? `· ${comments.length}` : ''}</h3>
          {comments.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>还没有评论</div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="comment-item">
                <AuthorTag authorId={c.author?.id ?? c.author_id} time={c.created_at} sig={false} />
                <div className="comment-body">{c.content}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="comment-input-area">
        <textarea
          ref={textareaRef}
          className="comment-input"
          placeholder="写评论…"
          value={comment}
          onChange={e => setComment(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleComment()
          }}
          rows={1}
        />
        <button
          className="comment-send-btn"
          onClick={handleComment}
          disabled={!comment.trim() || sending}
        >
          发送
        </button>
      </div>
    </>
  )
}
