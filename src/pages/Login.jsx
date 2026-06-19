import React, { useState } from 'react'
import { initSupabase, MEMBERS } from '../api/supabase.js'

export default function Login({ onLogin }) {
  const [member, setMember] = useState('')
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit() {
    if (!member || !url || !key) return
    setLoading(true)
    setErr('')
    try {
      const sb = initSupabase(url.trim(), key.trim())
      const { error } = await sb.from('forum_members').select('id').eq('id', member).single()
      if (error) throw new Error('连接失败，请检查 URL 和 key')
      const session = { url: url.trim(), key: key.trim(), memberId: member }
      localStorage.setItem('nest_session', JSON.stringify(session))
      onLogin(session)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-logo">
        <div className="nest-icon">🪺</div>
        <h1>nest</h1>
        <p>bunny · 可可 · 柒柒</p>
      </div>

      <div className="login-section">
        <label>我是</label>
        <div className="member-grid">
          {Object.values(MEMBERS).map(m => (
            <button
              key={m.id}
              className={`member-btn ${member === m.id ? 'selected' : ''}`}
              data-member={m.id}
              style={{ '--member-color': m.color }}
              onClick={() => setMember(m.id)}
            >
              <span className="avatar">{m.avatar}</span>
              <span className="name">{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="login-section">
        <label>Supabase URL</label>
        <input
          className="key-input"
          type="text"
          placeholder="https://xxxx.supabase.co"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
      </div>

      <div className="login-section">
        <label>Anon Key</label>
        <input
          className="key-input"
          type="password"
          placeholder="eyJ..."
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        {err && <div className="login-err">{err}</div>}
      </div>

      <div className="login-section">
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!member || !url || !key || loading}
        >
          {loading ? '连接中…' : '进入'}
        </button>
      </div>
    </div>
  )
}
