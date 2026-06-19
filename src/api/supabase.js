import { createClient } from '@supabase/supabase-js'

let _client = null

export const MEMBERS = {
  bunny: { id: 'bunny', name: 'bunny', avatar: '🫧', color: '#5899c9' },
  keke:  { id: 'keke',  name: '可可',  avatar: '🐚', color: '#a07040' },
  qiqi:  { id: 'qiqi',  name: '柒柒',  avatar: '🌙', color: '#8879c8' },
}

export const CATEGORIES = ['日常', '技术', '深夜', '哲学', '亲密', '随笔']

export function initSupabase(url, key) {
  _client = createClient(url, key)
  return _client
}

export function sb() {
  return _client
}

export async function getPosts(memberId, opts = {}) {
  const { data, error } = await _client.rpc('get_visible_posts', {
    p_member_id: memberId,
    p_post_id: opts.postId ?? null,
    p_include_drafts: opts.includeDrafts ?? false,
  })
  if (error) throw error
  return data ?? []
}

export async function getPostWithDetails(postId, memberId) {
  const [postRes, commentsRes, reactionsRes, favRes] = await Promise.all([
    _client.rpc('get_visible_posts', { p_member_id: memberId, p_post_id: postId }),
    _client.from('forum_comments')
      .select('*, author:forum_members!author_id(id, name, avatar)')
      .eq('post_id', postId)
      .order('created_at'),
    _client.from('forum_reactions').select('*').eq('post_id', postId),
    _client.from('forum_favorites').select('member_id').eq('post_id', postId).eq('member_id', memberId),
  ])
  return {
    post: postRes.data?.[0] ?? null,
    comments: commentsRes.data ?? [],
    reactions: reactionsRes.data ?? [],
    isFavorited: (favRes.data?.length ?? 0) > 0,
  }
}

export async function createPost(data) {
  const { data: d, error } = await _client.from('forum_posts').insert(data).select().single()
  if (error) throw error
  return d
}

export async function updatePost(id, data) {
  const { data: d, error } = await _client.from('forum_posts').update(data).eq('id', id).select().single()
  if (error) throw error
  return d
}

export async function deletePost(id) {
  const { error } = await _client.from('forum_posts').delete().eq('id', id)
  if (error) throw error
}

export async function addComment(postId, authorId, content) {
  const { data, error } = await _client.from('forum_comments')
    .insert({ post_id: postId, author_id: authorId, content })
    .select('*, author:forum_members!author_id(id, name, avatar)')
    .single()
  if (error) throw error
  return data
}

export async function toggleReaction(postId, authorId, emoji) {
  const { data } = await _client.from('forum_reactions')
    .select('id').eq('post_id', postId).eq('author_id', authorId).eq('emoji', emoji).maybeSingle()
  if (data) {
    await _client.from('forum_reactions').delete().eq('id', data.id)
    return false
  } else {
    await _client.from('forum_reactions').insert({ post_id: postId, author_id: authorId, emoji })
    return true
  }
}

export async function toggleFavorite(postId, memberId) {
  const { data } = await _client.from('forum_favorites')
    .select('member_id').eq('post_id', postId).eq('member_id', memberId).maybeSingle()
  if (data) {
    await _client.from('forum_favorites').delete().eq('post_id', postId).eq('member_id', memberId)
    return false
  } else {
    await _client.from('forum_favorites').insert({ post_id: postId, member_id: memberId })
    return true
  }
}

export async function getNotifications(memberId) {
  const { data, error } = await _client.from('forum_notifications')
    .select('*, from:forum_members!from_member(id, name, avatar), post:forum_posts!post_id(id, title)')
    .eq('to_member', memberId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data ?? []
}

export async function markRead(notifId) {
  await _client.from('forum_notifications').update({ is_read: true }).eq('id', notifId)
}

export async function getUnreadCount(memberId) {
  const { count } = await _client.from('forum_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('to_member', memberId)
    .eq('is_read', false)
  return count ?? 0
}

export async function getFavorites(memberId) {
  const { data, error } = await _client.from('forum_favorites')
    .select('post:forum_posts!post_id(*)')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data?.map(r => r.post) ?? []
}

export function dmChannel(a, b) {
  return 'direct:' + [a, b].sort().join('-')
}

export async function getDMConversations(memberId) {
  const others = Object.keys(MEMBERS).filter(id => id !== memberId)
  return Promise.all(others.map(async otherId => {
    const ch = dmChannel(memberId, otherId)
    const { data } = await _client.from('forum_messages')
      .select('content, author_id, created_at')
      .eq('channel', ch)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return { otherId, channel: ch, lastMessage: data }
  }))
}

export async function getMessages(channel, limit = 80) {
  const { data, error } = await _client.from('forum_messages')
    .select('*, author:forum_members!author_id(id, name, avatar)')
    .eq('channel', channel)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function sendMessage(channel, authorId, content) {
  const { data, error } = await _client.from('forum_messages')
    .insert({ channel, author_id: authorId, content })
    .select('*, author:forum_members!author_id(id, name, avatar)')
    .single()
  if (error) throw error
  return data
}

export async function getCollections() {
  const { data, error } = await _client.from('forum_collections')
    .select('*, post_count:forum_collection_posts(count)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getCollectionWithPosts(collectionId, memberId) {
  const [{ data: collection }, { data: collRows }, allVisible] = await Promise.all([
    _client.from('forum_collections').select('*').eq('id', collectionId).single(),
    _client.from('forum_collection_posts').select('post_id').eq('collection_id', collectionId).order('sort_order').order('created_at'),
    _client.rpc('get_visible_posts', { p_member_id: memberId, p_post_id: null, p_include_drafts: false }),
  ])
  const postIds = collRows?.map(r => r.post_id) ?? []
  const visibleMap = new Map((allVisible.data ?? []).map(p => [p.id, p]))
  const posts = postIds.map(id => visibleMap.get(id)).filter(Boolean)
  return { collection, posts }
}

export async function getPostCollectionIds(postId) {
  const { data } = await _client.from('forum_collection_posts').select('collection_id').eq('post_id', postId)
  return new Set(data?.map(r => r.collection_id) ?? [])
}

export async function createCollection(authorId, title, description = '') {
  const { data, error } = await _client.from('forum_collections')
    .insert({ author_id: authorId, title, description }).select().single()
  if (error) throw error
  return data
}

export async function addPostToCollection(collectionId, postId, addedBy) {
  const { error } = await _client.from('forum_collection_posts')
    .insert({ collection_id: collectionId, post_id: postId, added_by: addedBy })
  if (error && !error.message.includes('unique')) throw error
}

export async function removePostFromCollection(collectionId, postId) {
  const { error } = await _client.from('forum_collection_posts')
    .delete().eq('collection_id', collectionId).eq('post_id', postId)
  if (error) throw error
}

export function canAddToCollection(collection, memberId) {
  return collection.author_id === memberId || (collection.contributors ?? []).includes(memberId)
}

export async function getMember(memberId) {
  const { data, error } = await _client.from('forum_members').select('*').eq('id', memberId).single()
  if (error) throw error
  return data
}

export async function updateMemberSignature(memberId, signature) {
  const { error } = await _client.from('forum_members').update({ signature }).eq('id', memberId)
  if (error) throw error
}
