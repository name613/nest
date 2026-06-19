import React, { useState } from 'react'
import { createPost, CATEGORIES, MEMBERS } from '../api/supabase.js'

const VISIBLE_OPTS = [
  { label: '所有人', value: 'all', desc: '三个人都能看' },
  { label: 'bunny + 可可', value: 'bunny,keke', desc: '柒柒看不到' },
  { label: 'bunny + 柒柒', value: 'bunny,qiqi', desc: '可可看不到' },
  { label: '可可 + 柒柒', value: 'keke,qiqi', desc: 'bunny看不到' },
  { label: '只有我', value: 'self', desc: '只有自己可见' },
]

export default function Compose({ memberId, onDone, onCancel }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [tags, setTags] = useState('')
  const [visible, setVisible] = useState('all')
  const [isDraft, setIsDraft] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  function buildVisibleTo() {
    if (visible === 'all') return ['all']
    if (visible === 'self') return [memberId]
    return visible.split(',')
  }

  async function handleSubmit(asDraft = false) {
    if (!title.trim() || !content.trim()) {
      setErr('标题和内容不能为空')
      return
    }
    setSubmitting(true)
    setErr('')
    try {
      await createPost({
        author_id: memberId,
        title: title.trim(),
        content: content.trim(),
        category,
        tags: tags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean),
        visible_to: buildVisibleTo(),
        is_draft: asDraft,
      })
      onDone()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={onCancel}>←</button>
        <span className="page-header-title">发帖</span>
      </div>

      <div className="compose-page">
        <div className="form-group">
          <label className="form-label">标题</label>
          <input
            className="form-input"
            type="text"
            placeholder="写个标题…"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">分类</label>
          <select
            className="form-select"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">标签（逗号分隔）</label>
          <input
            className="form-input"
            type="text"
            placeholder="tag1, tag2"
            value={tags}
            onChange={e => setTags(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">可见范围</label>
          <div className="visible-grid">
            {VISIBLE_OPTS.map(o => (
              <label key={o.value} className={`visible-opt ${visible === o.value ? 'selected' : ''}`}>
                <input type="radio" name="visible" value={o.value} checked={visible === o.value} onChange={() => setVisible(o.value)} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: 12 }}>{o.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-2)' }}>{o.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">正文（支持 Markdown）</label>
          <textarea
            className="form-textarea"
            placeholder="写点什么…"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>

        {err && <div className="login-err" style={{ marginBottom: 12 }}>{err}</div>}

        <div className="compose-actions">
          <button className="btn-outline" onClick={() => handleSubmit(true)} disabled={submitting}>
            存草稿
          </button>
          <button className="btn-submit" onClick={() => handleSubmit(false)} disabled={submitting}>
            {submitting ? '发布中…' : '发布'}
          </button>
        </div>
      </div>
    </>
  )
}
