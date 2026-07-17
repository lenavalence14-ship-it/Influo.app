import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useInfluenceurProfile(userId) {
  const [profil, setProfil] = useState(null)
  const [posts, setPosts] = useState([])
  const [offres, setOffres] = useState([])
  const [reseaux, setReseaux] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const { data: profilData } = await supabase
      .from('profils_influenceur')
      .select('*, users(*)')
      .eq('user_id', userId)
      .maybeSingle()

    if (profilData) {
      const [{ data: postsData }, { data: offresData }, { data: reseauxData }] = await Promise.all([
        supabase
          .from('posts')
          .select('*, post_medias(*)')
          .eq('influenceur_id', profilData.id)
          .neq('type', 'story')
          .order('created_at', { ascending: false }),
        supabase
          .from('offres')
          .select('*')
          .eq('influenceur_id', profilData.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('reseaux_sociaux')
          .select('*')
          .eq('influenceur_id', profilData.id),
      ])
      setPosts(postsData || [])
      setOffres(offresData || [])
      setReseaux(reseauxData || [])
    }

    setProfil(profilData)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  return { profil, posts, offres, reseaux, loading, reload: load }
}
