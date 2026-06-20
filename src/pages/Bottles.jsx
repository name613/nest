import React, { useState, useEffect } from 'react'
import {
  writeBottle, getBottlePool, pickBottle, replyToBottle,
  getMyWrittenBottles, getMyPickedBottles,
  requestBottlePublic, approveBottlePublic, MEMBERS
} from '../api/supabase.js'

function timeStr(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function BottleStatus({ bottle }) {
  if (bottle.status === 'drifting' && new Date(bottle.drift_at) > new Date()) {
    return <span className="bottle-tag tag-pending">等待漂出</span>
  }
  if (bottle.status === 'drifting') return <span className="bottle-tag tag-drifting">漂流中</span>
  if (bottle.status === 'picked') return <span className="bottle-tag tag-picked">已被捡到</span>
  return null
}

function WriteTab({ memberId, onDone }) {
  const [content, setContent] = useState('')
  const [isAnon, setIsAnon] = useState(false)
  const [driftLater, setDriftLater] = useState(false)
  const [driftDate, setDriftDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit() {
    if (!content.trim()) { setErr('内容不能为空'); return }
    if (driftLater && !driftDate) { setErr('请选择漂出时间'); return }
    setSubmitting(true)
    setErr('')
    try {
      const driftAt = driftLater ? new Date(driftDate).toISOString() : null
      await writeBottle(memberId, content.trim(), isAnon, driftAt)
      setContent('')
      setIsAnon(false)
      setDriftLater(false)
      setDriftDate('')
      onDone()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const minDate = new Date()
  minDate.setMinutes(minDate.getMinutes() + 5)
  const minStr = minDate.toISOString().slice(0, 16)

  return (
    <div className="bottle-write">
      <textarea
        className="form-textarea"
        placeholder="写点什么放进瓶子里…"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={6}
      />
      <div className="bottle-options">
        <label className="bottle-opt-label">
          <input type="checkbox" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} />
          匿名漂流
        </label>
        <label className="bottle-opt-label">
          <input type="checkbox" checked={driftLater} onChange={e => setDriftLater(e.target.checked)} />
          定时漂出
        </label>
      </div>
      {driftLater && (
        <input
          type="datetime-local"
          className="form-input"
          min={minStr}
          value={driftDate}
          onChange={e => setDriftDate(e.target.value)}
          style={{ marginTop: 8 }}
        />
      )}
      {err && <div className="login-err" style={{ marginTop: 8 }}>{err}</div>}
      <button className="btn-submit" style={{ marginTop: 12 }} onClick={handleSubmit} disabled={submitting}>
        {submitting ? '放出去…' : '🌊 放出去'}
      </button>
    </div>
  )
}

function PoolTab({ memberId, onRefresh }) {
  const [bottles, setBottles] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    setLoading(true)
    getBottlePool(memberId).then(setBottles).finally(() => setLoading(false))
  }, [memberId])

  async function handlePick(bottleId) {
    await pickBottle(bottleId, memberId)
    setBottles(prev => prev.filter(b => b.id !== bottleId))
    setOpenId(null)
    onRefresh()
  }

  async function handlePickAndReply(bottleId) {
    setSending(true)
    try {
      await pickBottle(bottleId, memberId)
      if (reply.trim()) await replyToBottle(bottleId, memberId, reply.trim())
      setBottles(prev => prev.filter(b => b.id !== bottleId))
      setOpenId(null)
      setReply('')
      onRefresh()
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="loading-state">查看漂流中…</div>
  if (bottles.length === 0) return (
    <div className="empty-state"><div className="icon">🌊</div><div>暂时没有漂来的瓶子</div></div>
  )

  return (
    <div className="bottle-list">
      {bottles.map(b => (
        <div key={b.id} className="bottle-card" onClick={() => setOpenId(openId === b.id ? null : b.id)}>
          <div className="bottle-card-header">
            <span className="bottle-from">
              {b.is_anonymous ? '匿名' : (MEMBERS[b.author_id]?.name ?? b.author_id)}
            </span>
            <span className="bottle-time">{timeStr(b.drift_at)}</span>
          </div>
          <div className="bottle-content">{b.content}</div>
          {openId === b.id && (
            <div className="bottle-actions" onClick={e => e.stopPropagation()}>
              <textarea
                className="comment-input"
                placeholder="回复这个瓶子（可选）…"
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={2}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn-outline" onClick={() => handlePick(b.id)} disabled={sending}>
                  只捡起
                </button>
                <button className="btn-submit" onClick={() => handlePickAndReply(b.id)} disabled={sending}>
                  {sending ? '…' : '捡起并回复'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MyWrittenTab({ memberId }) {
  const [bottles, setBottles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getMyWrittenBottles(memberId).then(setBottles).finally(() => setLoading(false))
  }, [memberId])

  if (loading) return <div className="loading-state">加载中…</div>
  if (bottles.length === 0) return (
    <div className="empty-state"><div className="icon">🫙</div><div>还没有放出过瓶子</div></div>
  )

  return (
    <div className="bottle-list">
      {bottles.map(b => (
        <div key={b.id} className="bottle-card">
          <div className="bottle-card-header">
            <BottleStatus bottle={b} />
            <span className="bottle-time">{timeStr(b.created_at)}</span>
          </div>
          <div className="bottle-content">{b.content}</div>
          {b.status === 'drifting' && new Date(b.drift_at) > new Date() && (
            <div className="bottle-drift-time">将于 {timeStr(b.drift_at)} 开始漂流</div>
          )}
          {b.status === 'picked' && (
            <div className="bottle-picked-note">
              {b.public_requested && !b.public_approved && (
                <button className="btn-outline btn-sm" onClick={() => approveBottlePublic(b.id).then(() =>
                  setBottles(prev => prev.map(x => x.id === b.id ? { ...x, public_approved: true } : x))
                )}>
                  对方想公开这个瓶子，同意？
                </button>
              )}
              {b.public_approved && <span className="bottle-tag tag-public">已公开</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MyPickedTab({ memberId }) {
  const [bottles, setBottles] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyMap, setReplyMap] = useState({})
  const [sendingId, setSendingId] = useState(null)

  useEffect(() => {
    setLoading(true)
    getMyPickedBottles(memberId).then(setBottles).finally(() => setLoading(false))
  }, [memberId])

  async function handleReply(bottleId) {
    const content = replyMap[bottleId]?.trim()
    if (!content) return
    setSendingId(bottleId)
    try {
      const r = await replyToBottle(bottleId, memberId, content)
      setBottles(prev => prev.map(b => b.id === bottleId
        ? { ...b, replies: [...(b.replies ?? []), r] } : b))
      setReplyMap(prev => ({ ...prev, [bottleId]: '' }))
    } finally {
      setSendingId(null)
    }
  }

  async function handleRequestPublic(bottleId) {
    await requestBottlePublic(bottleId)
    setBottles(prev => prev.map(b => b.id === bottleId ? { ...b, public_requested: true } : b))
  }

  if (loading) return <div className="loading-state">加载中…</div>
  if (bottles.length === 0) return (
    <div className="empty-state"><div className="icon">🫙</div><div>还没有捡到过瓶子</div></div>
  )

  return (
    <div className="bottle-list">
      {bottles.map(b => (
        <div key={b.id} className="bottle-card">
          <div className="bottle-card-header">
            <span className="bottle-from">
              {b.is_anonymous ? '匿名' : (MEMBERS[b.author_id]?.name ?? b.author_id)}
            </span>
            <span className="bottle-time">{timeStr(b.picked_at)}</span>
          </div>
          <div className="bottle-content">{b.content}</div>
          {(b.replies ?? []).map(r => (
            <div key={r.id} className="bottle-reply">
              <span className="bottle-reply-author">{MEMBERS[r.author_id]?.name ?? r.author_id}</span>
              <span className="bottle-reply-content">{r.content}</span>
            </div>
          ))}
          {!b.public_requested && !b.public_approved && (
            <button className="btn-outline btn-sm" style={{ marginTop: 8 }}
              onClick={() => handleRequestPublic(b.id)}>
              申请公开
            </button>
          )}
          {b.public_requested && !b.public_approved && (
            <span className="bottle-tag" style={{ marginTop: 8 }}>等待对方同意公开</span>
          )}
          {b.public_approved && <span className="bottle-tag tag-public">已公开</span>}
          <div style={{ marginTop: 12 }}>
            <textarea
              className="comment-input"
              placeholder="再回复一条…"
              value={replyMap[b.id] ?? ''}
              onChange={e => setReplyMap(prev => ({ ...prev, [b.id]: e.target.value }))}
              rows={1}
            />
            <button className="comment-send-btn" style={{ marginTop: 4 }}
              onClick={() => handleReply(b.id)}
              disabled={!replyMap[b.id]?.trim() || sendingId === b.id}>
              发送
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

const TABS = [
  { id: 'write', label: '写瓶子' },
  { id: 'pool', label: '漂流池' },
  { id: 'written', label: '我放的' },
  { id: 'picked', label: '我捡的' },
]

export default function Bottles({ memberId }) {
  const [tab, setTab] = useState('pool')
  const [poolKey, setPoolKey] = useState(0)

  return (
    <>
      <div className="page-header">
        <span className="page-header-title">🌊 漂流瓶</span>
      </div>
      <div className="tab-bar" style={{ padding: '0 16px' }}>
        {TABS.map(t => (
          <button key={t.id}
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ padding: '16px' }}>
        {tab === 'write' && (
          <WriteTab memberId={memberId} onDone={() => { setTab('written') }} />
        )}
        {tab === 'pool' && (
          <PoolTab key={poolKey} memberId={memberId} onRefresh={() => setPoolKey(k => k + 1)} />
        )}
        {tab === 'written' && <MyWrittenTab memberId={memberId} />}
        {tab === 'picked' && <MyPickedTab memberId={memberId} />}
      </div>
    </>
  )
}
