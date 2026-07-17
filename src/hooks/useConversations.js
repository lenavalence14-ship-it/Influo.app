import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useConversations(userId, role) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    let query = supabase
      .from('conversations')
      .select(`
        *,
        offres(*),
        profils_influenceur(*, users(*)),
        messages(contenu, created_at, is_system)
      `)
      .order('updated_at', { ascending: false })

    if (role === 'client') {
      query = query.eq('client_id', userId)
    } else {
      const { data: profilData } = await supabase
        .from('profils_influenceur')
        .select('id')
        .eq('user_id', userId)
        .single()
      if (profilData) query = query.eq('influenceur_id', profilData.id)
    }

    const { data } = await query
    setConversations(data || [])
    setLoading(false)
  }, [userId, role])

  useEffect(() => {
    load()
  }, [load])

  return { conversations, loading, reload: load }
}
