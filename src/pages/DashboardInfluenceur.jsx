import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Power, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import TopHeader from '../components/TopHeader'
import Button from '../components/Button'
import WaveBars from '../components/WaveBars'

export default function DashboardInfluenceur() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [offres, setOffres] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data: profilData } = await supabase
      .from('profils_influenceur')
      .select('id')
      .eq('user_id', profile.id)
      .single()

    const [{ data: wallet }, { count: commandesCount }, { count: convCount }, { data: offresData }] = await Promise.all([
      supabase.from('wallets').select('*').eq('influenceur_id', profilData.id).maybeSingle(),
      supabase.from('commandes').select('*', { count: 'exact', head: true }).eq('influenceur_id', profilData.id),
      supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('influenceur_id', profilData.id),
      supabase.from('offres').select('*').eq('influenceur_id', profilData.id).order('created_at', { ascending: false }),
    ])

    setStats({
      revenusTotaux: Number(wallet?.revenus_totaux || 0),
      revenusDisponibles: Number(wallet?.solde_disponible || 0),
      revenusVerrouilles: Number(wallet?.solde_verrouille || 0),
      commandesCount: commandesCount || 0,
      conversationsCount: convCount || 0,
      offresCount: offresData?.length || 0,
    })
    setOffres(offresData || [])
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.id) load()
  }, [profile?.id])

  const toggleOffre = async (offre) => {
    await supabase.from('offres').update({ actif: !offre.actif }).eq('id', offre.id)
    load()
  }

  const supprimerOffre = async (offreId) => {
    await supabase.from('offres').delete().eq('id', offreId)
    load()
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ color: 'var(--fg)' }}>
        <WaveBars active />
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <TopHeader title="Dashboard" />

      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 gap-2.5">
          <StatBox value={`${stats.revenusTotaux.toLocaleString('fr-FR')} F`} label="Revenus totaux" />
          <StatBox value={`${stats.revenusDisponibles.toLocaleString('fr-FR')} F`} label="Disponible" />
          <StatBox value={`${stats.revenusVerrouilles.toLocaleString('fr-FR')} F`} label="Verrouillé" />
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          <StatBox value={stats.commandesCount} label="Commandes" />
          <StatBox value={stats.conversationsCount} label="Conversations" />
          <StatBox value={stats.offresCount} label="Offres" />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Mes offres</h2>
          <button
            onClick={() => navigate('/offres/nouvelle')}
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: 'var(--fg)' }}
          >
            <Plus size={14} /> Nouvelle offre
          </button>
        </div>

        <div className="mt-3 space-y-2.5">
          {offres.map((offre) => (
            <div key={offre.id} className="glass flex items-center gap-3 rounded-2xl p-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                {offre.photo_url && <img src={offre.photo_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{offre.titre}</div>
                <div className="font-mono text-xs" style={{ color: 'var(--fg-muted)' }}>
                  {Number(offre.prix).toLocaleString('fr-FR')} F · {offre.actif ? 'Active' : 'Inactive'}
                </div>
              </div>
              <button onClick={() => toggleOffre(offre)} className="p-1.5" title={offre.actif ? 'Désactiver' : 'Activer'}>
                <Power size={15} style={{ opacity: offre.actif ? 1 : 0.4 }} />
              </button>
              <button onClick={() => navigate(`/offres/${offre.id}/editer`)} className="p-1.5">
                <Pencil size={15} />
              </button>
              <button onClick={() => supprimerOffre(offre.id)} className="p-1.5">
                <Trash2 size={15} style={{ color: 'var(--danger)' }} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatBox({ value, label }) {
  return (
    <div className="glass rounded-2xl p-3 text-center">
      <div className="font-mono text-sm font-semibold">{value}</div>
      <div className="text-[9px]" style={{ color: 'var(--fg-muted)' }}>{label}</div>
    </div>
  )
}
