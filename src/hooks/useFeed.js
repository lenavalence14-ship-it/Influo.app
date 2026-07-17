import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useFeed() {
  const [posts, setPosts] = useState([])
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)

  const loadFeed = useCallback(async () => {
    setLoading(true)

    const { data: postsData } = await supabase
      .from('posts')
      .select(`
        *,
        post_medias(*),
        profils_influenceur(*, users(*)),
        post_likes(user_id),
        post_comments(*, users(nom_complet, photo_url))
      `)
      .eq('type', 'photo')
      .order('created_at', { ascending: false })
      .limit(30)

    const { data: carrouselsData } = await supabase
      .from('posts')
      .select(`
        *,
        post_medias(*),
        profils_influenceur(*, users(*)),
        post_likes(user_id),
        post_comments(*, users(nom_complet, photo_url))
      `)
      .eq('type', 'carrousel')
      .order('created_at', { ascending: false })
      .limit(30)

    const { data: storiesData } = await supabase
      .from('posts')
      .select(`*, post_medias(*), profils_influenceur(*, users(*))`)
      .eq('type', 'story')
      .gt('expire_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    const allPosts = [...(postsData || []), ...(carrouselsData || [])].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )

    setPosts(allPosts)
    setStories(storiesData || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const toggleLike = async (postId, userId, isLiked) => {
    if (isLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
    }
    loadFeed()
  }

  const addComment = async (postId, userId, contenu) => {
    await supabase.from('post_comments').insert({ post_id: postId, user_id: userId, contenu })
    loadFeed()
  }

  return { posts, stories, loading, reload: loadFeed, toggleLike, addComment }
}
