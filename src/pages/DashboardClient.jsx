import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import TopHeader from '../components/TopHeader'
import WaveBars from '../components/WaveBars'

const statusLabels = {
  en_discussion: 'En discussion',
  paiement_demande: 'Paiement demandé',
  paiement_effectue: 'Paiement effectué',
  prestation_en_cours: 'Prestation en cours',
  en_attente_validation: "En attente de validation",
  terminee: 'Terminée',
}

export default function DashboardClient() {
  const { profile } = useAuth()
  const [commandes, setCommandes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('commandes')
        .select('*, offres(titre), profils_influenceur(users(nom_complet))')
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false })
      setCommandes(data || [])
      setLoading(false)
    }
    if (profile?.id) load()
  }, [profile?.id])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ color: 'var(--fg)' }}>
        <WaveBars active />
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <TopHeader title="Mes commandes" />

      <div className="px-4 pt-4">
        {commandes.length === 0 ? (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>
            Aucune commande pour l'instant.
          </p>
        ) : (
          <div className="space-y-2.5">
            {commandes.map((c) => (
              <div key={c.id} className="glass rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold">{c.offres?.titre}</div>
                    <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                      {c.profils_influenceur?.users?.nom_complet}
                    </div>
                  </div>
                  <span className="font-mono text-sm font-medium">
                    {Number(c.montant).toLocaleString('fr-FR')} F
                  </span>
                </div>
                <div className="mt-2.5 inline-block rounded-full px-2.5 py-1 text-[10px]" style={{ border: '1px solid var(--border)' }}>
                  {statusLabels[c.status]}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
