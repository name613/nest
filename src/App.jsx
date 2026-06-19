import React, { useState, useEffect } from 'react'
import { initSupabase, getUnreadCount } from './api/supabase.js'
import Login from './pages/Login.jsx'
import Feed from './pages/Feed.jsx'
import PostDetail from './pages/PostDetail.jsx'
import Compose from './pages/Compose.jsx'
import Notifications from './pages/Notifications.jsx'
import Profile from './pages/Profile.jsx'
import ChatRoom from './pages/ChatRoom.jsx'
import NavBar from './components/NavBar.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [page, setPage] = useState('feed')
  const [postId, setPostId] = useState(null)
  const [editPost, setEditPost] = useState(null)
  const [unread, setUnread] = useState(0)

  // Restore session from localStorage
  useEffect(() => {
    const raw = localStorage.getItem('nest_session')
    if (raw) {
      try {
        const s = JSON.parse(raw)
        initSupabase(s.url, s.key)
        setSession(s)
      } catch {}
    }
  }, [])

  // Poll unread count every 2 minutes
  useEffect(() => {
    if (!session) return
    const refresh = () => getUnreadCount(session.memberId).then(setUnread).catch(() => {})
    refresh()
    const id = setInterval(refresh, 120000)
    return () => clearInterval(id)
  }, [session])

  function handleLogin(s) {
    setSession(s)
    setPage('feed')
  }

  function handleLogout() {
    localStorage.removeItem('nest_session')
    setSession(null)
    setPage('feed')
    setPostId(null)
  }

  function openPost(id) {
    setPostId(id)
    setPage('post')
  }

  function handleEdit(post) {
    setEditPost(post)
    setPage('compose')
  }

  function handleComposeDone() {
    const wasEditing = !!editPost
    setEditPost(null)
    setPage(wasEditing ? 'post' : 'feed')
  }

  function handleComposeCancel() {
    const wasEditing = !!editPost
    setEditPost(null)
    setPage(wasEditing ? 'post' : 'feed')
  }

  function handleNav(tab) {
    setPage(tab)
    if (tab !== 'post') setPostId(null)
  }

  if (!session) return <Login onLogin={handleLogin} />

  const { memberId } = session
  const showNav = page !== 'post' && page !== 'compose'

  return (
    <div className="app">
      <div className="main-content">
        {page === 'feed' && (
          <Feed
            memberId={memberId}
            onOpenPost={openPost}
            onCompose={() => { setEditPost(null); setPage('compose') }}
          />
        )}
        {page === 'post' && postId && (
          <PostDetail
            postId={postId}
            memberId={memberId}
            onBack={() => { setPage('feed'); setPostId(null) }}
            onEdit={handleEdit}
          />
        )}
        {page === 'compose' && (
          <Compose
            memberId={memberId}
            editPost={editPost}
            onDone={handleComposeDone}
            onCancel={handleComposeCancel}
          />
        )}
        {page === 'chat' && <ChatRoom memberId={memberId} />}
        {page === 'notifications' && (
          <Notifications
            memberId={memberId}
            onOpenPost={id => { setUnread(0); openPost(id) }}
          />
        )}
        {page === 'profile' && (
          <Profile
            memberId={memberId}
            onLogout={handleLogout}
            onOpenPost={openPost}
          />
        )}
      </div>

      {showNav && (
        <NavBar page={page} onNav={handleNav} unread={unread} />
      )}
    </div>
  )
}
