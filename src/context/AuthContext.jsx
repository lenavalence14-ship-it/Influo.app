import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*, profils_influenceur(*)')
      .eq('id', userId)
      .maybeSingle()
    if (!error) setProfile(data)
    return data
  }

  // Si un utilisateur a confirmé son e-mail après un signUp bloqué par RLS,
  // sa ligne public.users n'existe pas encore. On la crée dès que la session est active,
  // en piochant les infos restées dans les métadonnées d'inscription (auth.users).
  const ensureUserRow = async (authUser) => {
    const existing = await loadProfile(authUser.id)
    if (existing) return existing

    const pendingRole = localStorage.getItem('influo-pending-role') || 'client'
    const pendingNom = localStorage.getItem('influo-pending-nom') || authUser.email.split('@')[0]

    const { error: insertError } = await supabase.from('users').insert({
      id: authUser.id,
      email: authUser.email,
      nom_complet: pendingNom,
      role: pendingRole,
    })

    if (!insertError && pendingRole === 'influenceur') {
      await supabase.from('profils_influenceur').insert({ user_id: authUser.id })
    }

    localStorage.removeItem('influo-pending-role')
    localStorage.removeItem('influo-pending-nom')

    return loadProfile(authUser.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) ensureUserRow(session.user)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        ensureUserRow(session.user)
      } else {
        setProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signUp = async ({ email, password, nomComplet, role }) => {
    localStorage.setItem('influo-pending-role', role)
    localStorage.setItem('influo-pending-nom', nomComplet)

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error }

    // Si la confirmation email est activée côté Supabase, signUp() renvoie un user
    // mais aucune session active tant que l'e-mail n'est pas confirmé.
    // Dans ce cas on ne peut pas insérer dans public.users (RLS bloque, auth.uid() est null).
    if (!data.session) {
      return {
        data,
        needsEmailConfirmation: true,
        error: {
          message:
            "Confirme ton adresse e-mail via le lien reçu, puis connecte-toi. (Pour désactiver cette étape en développement : Supabase → Authentication → Providers → Email → désactiver 'Confirm email'.)",
        },
      }
    }

    if (data.user) {
      const { error: insertError } = await supabase.from('users').insert({
        id: data.user.id,
        email,
        nom_complet: nomComplet,
        role,
      })
      if (insertError) return { error: insertError }

      if (role === 'influenceur') {
        await supabase.from('profils_influenceur').insert({ user_id: data.user.id })
      }
    }
    return { data }
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, signUp, signIn, signOut, resetPassword, reloadProfile: () => loadProfile(session?.user?.id) }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}