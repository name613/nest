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
