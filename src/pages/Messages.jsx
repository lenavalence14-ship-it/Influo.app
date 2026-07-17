import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useConversations } from '../hooks/useConversations'
import TopHeader from '../components/TopHeader'
import VerifiedBadge from '../components/VerifiedBadge'
import WaveBars from '../components/WaveBars'

export default function Messages() {
  const { profile } = useAuth()
  const { conversations, loading } = useConversations(profile?.id, profile?.role)
  const navigate = useNavigate()
  const isInfluenceur = profile?.role === 'influenceur'

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <TopHeader title="Messages" />

      {loading ? (
        <div className="flex justify-center py-16" style={{ color: 'var(--fg)' }}>
          <WaveBars active />
        </div>
      ) : conversations.length === 0 ? (
        <div className="px-6 py-16 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>
          Aucune conversation pour l'instant.
        </div>
      ) : (
        <div>
          {conversations.map((conv) => {
            const lastMsg = [...(conv.messages || [])].sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at)
            )[0]
            const displayUser = isInfluenceur ? null : conv.profils_influenceur?.users
            const displayName = isInfluenceur ? 'Client' : displayUser?.nom_complet

            return (
              <button
                key={conv.id}
                onClick={() => navigate(`/messages/${conv.id}`)}
                className="flex w-full items-center gap-3.5 border-b px-4 py-3.5 text-left"
                style={{ borderColor: 'var(--border)' }}
              >
                <div
                  className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full font-display text-base font-semibold"
                  style={{ background: 'var(--invert-bg)', color: 'var(--invert-fg)', width: 52, height: 52 }}
                >
                  {displayName?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-sm font-semibold">{displayName}</span>
                    {!isInfluenceur && conv.profils_influenceur?.verifie && <VerifiedBadge size={13} />}
                  </div>
                  {conv.offres?.titre && (
                    <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                      Offre : {conv.offres.titre}
                    </div>
                  )}
                  {lastMsg && (
                    <div className="truncate text-xs" style={{ color: 'var(--fg-muted)' }}>
                      {lastMsg.is_system ? '🔔 ' : ''}{lastMsg.contenu}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
