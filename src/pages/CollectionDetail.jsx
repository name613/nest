import React, { useState, useEffect } from 'react'
import { getCollectionWithPosts, MEMBERS } from '../api/supabase.js'
import PostCard from '../components/PostCard.jsx'
import AuthorTag from '../components/AuthorTag.jsx'

export default function CollectionDetail({ collectionId, memberId, onBack, onOpenPost }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getCollectionWithPosts(collectionId, memberId)
      .then(setData)
      .finally(() => setLoading(false))
  }, [collectionId])

  if (loading) return <div className="loading-state">加载中…</div>
  if (!data?.collection) return <div className="empty-state"><div>合集不存在</div></div>

  const { collection, posts } = data
  const author = MEMBERS[collection.author_id]
  const contributors = (collection.contributors ?? []).map(id => MEMBERS[id]).filter(Boolean)

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <span className="page-header-title">合集</span>
      </div>

      <div className="collection-detail-page">
        <div className="collection-header-card">
          <h2 className="collection-title">{collection.title}</h2>
          {collection.description && (
            <p className="collection-desc">{collection.description}</p>
          )}
          <div className="collection-meta-row">
            <span className="collection-meta-author" data-member={author?.id}>
              {author?.avatar} {author?.name}
            </span>
            {contributors.length > 0 && (
              <span className="collection-meta-contrib">
                · 协作：{contributors.map(c => c.name).join('、')}
              </span>
            )}
            <span className="collection-meta-count">{posts.length} 篇</span>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 0' }}>
            <div>合集里还没有帖子</div>
          </div>
        ) : (
          <div className="post-list">
            {posts.map(p => (
              <PostCard key={p.id} post={p} onClick={() => onOpenPost(p.id)} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
