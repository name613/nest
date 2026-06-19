import React, { useState, useEffect, useRef } from 'react'
import { getMessages, sendMessage, getDMConversations, dmChannel, MEMBERS } from '../api/supabase.js'

function timeStr(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function dateLine(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}

function MessageList({ channel, memberId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    setMessages([])
    load(true)
    pollRef.current = setInterval(() => load(false), 4000)
    return () => clearInterval(pollRef.current)
  }, [channel])

  async function load(scrollToBottom) {
    try {
      const msgs = await getMessages(channel)
      setMessages(msgs)
      if (scrollToBottom) setTimeout(() => bottomRef.current?.scrollIntoView(), 50)
    } catch {}
  }

  async function handleSend() {
    if (!input.trim() || sending) return
    setSending(true)
    const text = input.trim()
    setInput('')
    try {
      const msg = await sendMessage(channel, memberId, text)
      setMessages(prev => [...prev, msg])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 30)
    } catch {
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  let lastDate = ''

  return (
    <>
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <div>还没有消息，说点什么吧</div>
          </div>
        )}
        {messages.map(msg => {
          const m = MEMBERS[msg.author_id] ?? { id: msg.author_id, name: msg.author_id, avatar: '👤' }
          const isMe = msg.author_id === memberId
          const dateLabel = dateLine(msg.created_at)
          const showDate = dateLabel !== lastDate
          lastDate = dateLabel
          return (
            <React.Fragment key={msg.id}>
              {showDate && <div className="chat-date-line">{dateLabel}</div>}
              <div className={`chat-msg ${isMe ? 'chat-msg-me' : 'chat-msg-other'}`}>
                {!isMe && <div className="chat-av">{m.avatar}</div>}
                <div className="chat-bubble-wrap">
                  {!isMe && <div className="chat-name" data-member={m.id}>{m.name}</div>}
                  <div className={`chat-bubble ${isMe ? 'chat-bubble-me' : 'chat-bubble-other'}`} data-member={m.id}>
                    {msg.content}
                  </div>
                  <div className={`chat-time ${isMe ? 'chat-time-me' : ''}`}>{timeStr(msg.created_at)}</div>
                </div>
                {isMe && <div className="chat-av">{m.avatar}</div>}
              </div>
            </React.Fragment>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          className="chat-input"
          placeholder="说点什么…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
          }}
          rows={1}
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim() || sending}>
          发送
        </button>
      </div>
    </>
  )
}

function DMList({ memberId, onSelect }) {
  const [convos, setConvos] = useState([])

  useEffect(() => {
    getDMConversations(memberId).then(setConvos).catch(() => {})
  }, [memberId])

  return (
    <div className="dm-list">
      {convos.map(({ otherId, lastMessage }) => {
        const m = MEMBERS[otherId]
        return (
          <button key={otherId} className="dm-list-item" onClick={() => onSelect(otherId)}>
            <div className="dm-av">{m.avatar}</div>
            <div className="dm-info">
              <div className="dm-name" data-member={m.id}>{m.name}</div>
              <div className="dm-preview">
                {lastMessage ? lastMessage.content.slice(0, 40) : '还没有消息'}
              </div>
            </div>
            {lastMessage && (
              <div className="dm-time">{timeStr(lastMessage.created_at)}</div>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default function ChatRoom({ memberId }) {
  const [tab, setTab] = useState('general')
  const [dmPartner, setDmPartner] = useState(null)

  const channel = tab === 'general' ? 'general'
    : dmPartner ? dmChannel(memberId, dmPartner) : null

  function switchTab(t) {
    setTab(t)
    setDmPartner(null)
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="chat-tabs">
          <button className={`chat-tab ${tab === 'general' ? 'active' : ''}`} onClick={() => switchTab('general')}>
            聊天室
          </button>
          <button className={`chat-tab ${tab === 'dm' ? 'active' : ''}`} onClick={() => switchTab('dm')}>
            私信
          </button>
        </div>
        {tab === 'dm' && dmPartner && (
          <button className="dm-back-btn" onClick={() => setDmPartner(null)}>← 返回</button>
        )}
        {tab === 'general' && (
          <span className="chat-subtitle">bunny · 可可 · 柒柒</span>
        )}
      </div>

      {tab === 'general' && <MessageList channel="general" memberId={memberId} />}
      {tab === 'dm' && !dmPartner && <DMList memberId={memberId} onSelect={setDmPartner} />}
      {tab === 'dm' && dmPartner && <MessageList channel={channel} memberId={memberId} />}
    </div>
  )
}
