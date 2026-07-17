import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Grid3x3, Tag, Settings, LogOut, MapPin, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useInfluenceurProfile } from '../hooks/useInfluenceurProfile'
import { supabase } from '../lib/supabase'
import TopHeader from '../components/TopHeader'
import VerifiedBadge from '../components/VerifiedBadge'
import OffreCard from '../components/OffreCard'
import Button from '../components/Button'
import WaveBars from '../components/WaveBars'

const platformIcons = { tiktok: '🎵', instagram: '📷', youtube: '▶️', facebook: 'f', x: '𝕏', snapchat: '👻', autre: '🔗' }

export default function ProfilInfluenceur() {
  const { userId: paramUserId } = useParams()
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isOwnProfile = !paramUserId || paramUserId === profile?.id
  const targetUserId = paramUserId || profile?.id

  const { profil, posts, offres, reseaux, loading } = useInfluenceurProfile(targetUserId)
  const [tab, setTab] = useState('publications')

  const startConversation = async (offre) => {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('client_id', profile.id)
      .eq('influenceur_id', profil.id)
      .eq('offre_id', offre.id)
      .maybeSingle()

    let conversationId = existing?.id

    if (!conversationId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ client_id: profile.id, influenceur_id: profil.id, offre_id: offre.id })
        .select()
        .single()
      conversationId = newConv.id

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: profile.id,
        contenu: `Bonjour, je suis intéressé(e) par votre offre "${offre.titre}" (${Number(offre.prix).toLocaleString('fr-FR')} F). ${offre.description}`,
      })
    }

    navigate(`/messages/${conversationId}`)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ color: 'var(--fg)' }}>
        <WaveBars active />
      </div>
    )
  }

  if (!profil) {
    return (
      <div className="mx-auto min-h-screen max-w-md">
        <TopHeader title="Profil" />
        <div className="px-6 py-16 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>
          Ce profil n'a pas encore été configuré.
        </div>
      </div>
    )
  }

  const user = profil.users

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <TopHeader
        title={user?.nom_complet}
        right={
          isOwnProfile && (
            <>
              <button onClick={() => navigate('/parametres')} className="glass flex h-9 w-9 items-center justify-center rounded-full">
                <Settings size={16} />
              </button>
            </>
          )
        }
      />

      {/* Hero photo + card glassmorphism qui glisse par-dessus */}
      <div className="relative">
        <div className="aspect-[4/3] w-full" style={{ background: 'var(--bg-elevated)' }}>
          {user?.photo_url && (
            <img src={user.photo_url} alt="" className="h-full w-full object-cover grayscale" />
          )}
        </div>
        <div className="glass-strong relative -mt-10 mx-4 rounded-3xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-display text-xl font-semibold">{user?.nom_complet}</h2>
                {profil.verifie && <VerifiedBadge size={17} />}
              </div>
              {(profil.ville || profil.pays) && (
                <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: 'var(--fg-muted)' }}>
                  <MapPin size={11} /> {[profil.ville, profil.pays].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
            {isOwnProfile ? (
              <Button variant="outline" className="!py-2 !px-4 !text-xs" onClick={() => navigate('/profil/editer')}>
                Modifier
              </Button>
            ) : (
              <Button className="!py-2 !px-4 !text-xs">Suivre</Button>
            )}
          </div>

          {profil.bio && <p className="mt-3 text-sm leading-relaxed">{profil.bio}</p>}

          {reseaux.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-2">
              {reseaux.map((r) => (
                <a
                  key={r.id}
                  href={r.lien_profil}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span>{platformIcons[r.plateforme]}</span>
                  <span className="font-mono font-medium">{r.nombre_abonnes.toLocaleString('fr-FR')}</span>
                  <ExternalLink size={10} className="opacity-50" />
                </a>
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 divide-x" style={{ borderColor: 'var(--border)' }}>
            <div className="text-center">
              <div className="font-mono text-base font-medium">{posts.length}</div>
              <div className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>publications</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-base font-medium">{offres.filter((o) => o.actif).length}</div>
              <div className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>offres actives</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-base font-medium">
                {reseaux.reduce((sum, r) => sum + r.nombre_abonnes, 0).toLocaleString('fr-FR')}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>abonnés cumulés</div>
            </div>
          </div>

          {isOwnProfile && (
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Button variant="outline" className="!text-xs" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
              <Button variant="outline" className="!text-xs" onClick={() => navigate('/wallet')}>
                Portefeuille
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Onglets Publications / Offres */}
      <div className="sticky top-[57px] z-30 mt-5 flex border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        <button
          onClick={() => setTab('publications')}
          className="flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-xs font-semibold"
          style={{ borderColor: tab === 'publications' ? 'var(--fg)' : 'transparent', opacity: tab === 'publications' ? 1 : 0.4 }}
        >
          <Grid3x3 size={15} /> Publications
        </button>
        <button
          onClick={() => setTab('offres')}
          className="flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-xs font-semibold"
          style={{ borderColor: tab === 'offres' ? 'var(--fg)' : 'transparent', opacity: tab === 'offres' ? 1 : 0.4 }}
        >
          <Tag size={15} /> Offres
        </button>
      </div>

      {tab === 'publications' ? (
        posts.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>
            Aucune publication pour l'instant.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {posts.map((post) => (
              <div key={post.id} className="aspect-square" style={{ background: 'var(--bg-elevated)' }}>
                {post.post_medias?.[0] && (
                  <img src={post.post_medias[0].media_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>
        )
      ) : offres.length === 0 ? (
        <div className="px-6 py-14 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>
          Aucune offre pour l'instant.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {offres.map((offre) => (
            <OffreCard
              key={offre.id}
              offre={offre}
              onContact={!isOwnProfile ? startConversation : undefined}
            />
          ))}
        </div>
      )}

      {isOwnProfile && (
        <div className="px-4 pt-6">
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center gap-2 text-sm font-medium"
            style={{ color: 'var(--danger)' }}
          >
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>
      )}
    </div>
  )
}
