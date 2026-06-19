import React, { useState, useEffect, useRef } from 'react'
import { marked } from 'marked'
import {
  getPostWithDetails, addComment, toggleReaction,
  toggleFavorite, getCollections, getPostCollectionIds,
  addPostToCollection, removePostFromCollection, createCollection,
  canAddToCollection, markPostRead, MEMBERS
} from '../api/supabase.js'
import AuthorTag from '../components/AuthorTag.jsx'

const REACTION_EMOJIS = ['❤️', '🌟', '😄', '😢', '👏', '🌙']

marked.setOptions({ breaks: true, gfm: true })

export default function PostDetail({ postId, memberId, onBack, onEdit }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [showCollModal, setShowCollModal] = useState(false)
  const [collections, setCollections] = useState([])
  const [postCollIds, setPostCollIds] = useState(new Set())
  const [newCollTitle, setNewCollTitle] = useState('')
  const [creatingColl, setCreatingColl] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => { load() }, [postId])

  async function load() {
    setLoading(true)
    try {
      const d = await getPostWithDetails(postId, memberId)
      setData(d)
      markPostRead(postId, memberId).catch(() => {})
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

  async function openCollModal() {
    const [colls, ids] = await Promise.all([getCollections(), getPostCollectionIds(postId)])
    setCollections(colls)
    setPostCollIds(ids)
    setShowCollModal(true)
  }

  async function toggleCollection(collId) {
    if (postCollIds.has(collId)) {
      await removePostFromCollection(collId, postId)
      setPostCollIds(prev => { const s = new Set(prev); s.delete(collId); return s })
    } else {
      await addPostToCollection(collId, postId, memberId)
      setPostCollIds(prev => new Set([...prev, collId]))
    }
  }

  async function handleCreateAndAdd() {
    if (!newCollTitle.trim()) return
    setCreatingColl(true)
    try {
      const coll = await createCollection(memberId, newCollTitle.trim())
      await addPostToCollection(coll.id, postId, memberId)
      setCollections(prev => [coll, ...prev])
      setPostCollIds(prev => new Set([...prev, coll.id]))
      setNewCollTitle('')
    } finally {
      setCreatingColl(false)
    }
  }

  async function handleComment() {
    if (!comment.trim()) return
    setSending(true)
    try {
      const c = await addComment(postId, memberId, comment.trim(), replyTo?.id ?? null)
      setComment('')
      setReplyTo(null)
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
        {post.author_id === memberId && onEdit && (
          <button className="edit-post-btn" onClick={() => onEdit(post)}>编辑</button>
        )}
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
            <span className="emoji">🔖</span>
            <span>{isFavorited ? '已收藏' : '收藏'}</span>
          </button>
          <button className="action-btn" onClick={openCollModal}>
            <span className="emoji">📚</span>
            <span>合集</span>
          </button>
        </div>

        {showCollModal && (
          <div className="coll-modal-overlay" onClick={() => setShowCollModal(false)}>
            <div className="coll-modal" onClick={e => e.stopPropagation()}>
              <div className="coll-modal-title">加入合集</div>
              {collections.filter(c => canAddToCollection(c, memberId)).map(c => (
                <label key={c.id} className="coll-modal-item">
                  <input type="checkbox" checked={postCollIds.has(c.id)}
                    onChange={() => toggleCollection(c.id)} />
                  <span>{c.title}</span>
                  <span className="coll-modal-author" data-member={c.author_id}>
                    {MEMBERS[c.author_id]?.avatar}
                  </span>
                </label>
              ))}
              <div className="coll-modal-create">
                <input className="coll-create-input" placeholder="创建新合集…"
                  value={newCollTitle} onChange={e => setNewCollTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateAndAdd()} />
                <button className="coll-create-btn" onClick={handleCreateAndAdd}
                  disabled={!newCollTitle.trim() || creatingColl}>
                  {creatingColl ? '…' : '创建并加入'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="comments-section">
          <h3>评论 {comments.length > 0 ? `· ${comments.length}` : ''}</h3>
          {comments.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>还没有评论</div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="comment-item">
                <AuthorTag authorId={c.author?.id ?? c.author_id} time={c.created_at} sig={false} />
                {c.parent && (
                  <div className="comment-quote">
                    <span className="comment-quote-name" data-member={c.parent.author_id}>
                      {MEMBERS[c.parent.author_id]?.name ?? c.parent.author_id}
                    </span>
                    <span className="comment-quote-text">
                      {c.parent.content.replace(/[#*`>]/g, '').slice(0, 60)}
                      {c.parent.content.length > 60 ? '…' : ''}
                    </span>
                  </div>
                )}
                <div className="comment-body post-body"
                  dangerouslySetInnerHTML={{ __html: marked.parse(c.content) }} />
                <button className="comment-reply-btn" onClick={() => {
                  setReplyTo({ id: c.id, authorId: c.author?.id ?? c.author_id, content: c.content })
                  textareaRef.current?.focus()
                }}>引用回复</button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="comment-input-area">
        {replyTo && (
          <div className="reply-preview">
            <span className="reply-preview-name" data-member={replyTo.authorId}>
              {MEMBERS[replyTo.authorId]?.name ?? replyTo.authorId}
            </span>
            <span className="reply-preview-text">
              {replyTo.content.replace(/[#*`>]/g, '').slice(0, 40)}…
            </span>
            <button className="reply-cancel-btn" onClick={() => setReplyTo(null)}>✕</button>
          </div>
        )}
        <div className="comment-input-row">
        <textarea
          ref={textareaRef}
          className="comment-input"
          placeholder={replyTo ? `回复 ${MEMBERS[replyTo.authorId]?.name}…` : '写评论… (支持 Markdown)'}
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
      </div>
    </>
  )
}
