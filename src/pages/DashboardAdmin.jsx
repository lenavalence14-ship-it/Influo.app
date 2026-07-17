import { useEffect, useState } from 'react'
import { Users, UserCheck, Briefcase, CreditCard, TrendingUp, Percent, ArrowDownToLine, BadgeCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import TopHeader from '../components/TopHeader'
import VerifiedBadge from '../components/VerifiedBadge'
import WaveBars from '../components/WaveBars'

export default function DashboardAdmin() {
  const [stats, setStats] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [influenceurs, setInfluenceurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('stats')

  const load = async () => {
    const [
      { count: usersCount },
      { count: influenceursCount },
      { count: clientsCount },
      { data: paiements },
      { data: retraits },
      { data: users },
      { data: influenceursData },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'influenceur'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'client'),
      supabase.from('paiements').select('montant, commission').eq('reussi', true),
      supabase.from('retraits').select('montant').eq('status', 'traite'),
      supabase.from('users').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('profils_influenceur').select('*, users(*)').order('created_at', { ascending: false }),
    ])

    const chiffreAffaires = (paiements || []).reduce((sum, p) => sum + Number(p.montant), 0)
    const totalCommissions = (paiements || []).reduce((sum, p) => sum + Number(p.commission), 0)
    const totalRetraits = (retraits || []).reduce((sum, r) => sum + Number(r.montant), 0)

    setStats({
      usersCount: usersCount || 0,
      influenceursCount: influenceursCount || 0,
      clientsCount: clientsCount || 0,
      paiementsCount: paiements?.length || 0,
      chiffreAffaires,
      totalCommissions,
      totalRetraits,
    })
    setRecentUsers(users || [])
    setInfluenceurs(influenceursData || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const toggleVerification = async (profilId, current) => {
    await supabase.from('profils_influenceur').update({ verifie: !current }).eq('id', profilId)
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
      <TopHeader title="Admin" />

      <div className="sticky top-[57px] z-30 flex border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        {['stats', 'utilisateurs', 'vérification'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 border-b-2 py-3 text-xs font-semibold capitalize"
            style={{ borderColor: tab === t ? 'var(--fg)' : 'transparent', opacity: tab === t ? 1 : 0.4 }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'stats' && (
        <div className="grid grid-cols-2 gap-3 p-4">
          <StatCard icon={Users} value={stats.usersCount} label="Utilisateurs" />
          <StatCard icon={UserCheck} value={stats.influenceursCount} label="Influenceurs" />
          <StatCard icon={Briefcase} value={stats.clientsCount} label="Clients" />
          <StatCard icon={CreditCard} value={stats.paiementsCount} label="Paiements" />
          <StatCard icon={TrendingUp} value={`${stats.chiffreAffaires.toLocaleString('fr-FR')} F`} label="Chiffre d'affaires" wide />
          <StatCard icon={Percent} value={`${stats.totalCommissions.toLocaleString('fr-FR')} F`} label="Commissions (10%)" wide />
          <StatCard icon={ArrowDownToLine} value={`${stats.totalRetraits.toLocaleString('fr-FR')} F`} label="Retraits effectués" wide />
        </div>
      )}

      {tab === 'utilisateurs' && (
        <div className="space-y-2 p-4">
          {recentUsers.map((u) => (
            <div key={u.id} className="glass flex items-center justify-between rounded-2xl p-3.5">
              <div>
                <div className="text-sm font-semibold">{u.nom_complet}</div>
                <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>{u.email}</div>
              </div>
              <span className="rounded-full px-2.5 py-1 text-[10px] capitalize" style={{ border: '1px solid var(--border)' }}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'vérification' && (
        <div className="space-y-2 p-4">
          {influenceurs.length === 0 ? (
            <p className="py-10 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>
              Aucun influenceur pour l'instant.
            </p>
          ) : (
            influenceurs.map((p) => (
              <div key={p.id} className="glass flex items-center justify-between rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5">
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      {p.users?.nom_complet}
                      {p.verifie && <VerifiedBadge size={14} />}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>{p.users?.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => toggleVerification(p.id, p.verifie)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                  style={
                    p.verifie
                      ? { border: '1px solid var(--border)', color: 'var(--fg-muted)' }
                      : { background: 'var(--invert-bg)', color: 'var(--invert-fg)' }
                  }
                >
                  <BadgeCheck size={13} />
                  {p.verifie ? 'Retirer' : 'Vérifier'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, value, label, wide }) {
  return (
    <div className={`glass rounded-2xl p-4 ${wide ? 'col-span-2' : ''}`}>
      <Icon size={16} className="mb-2 opacity-60" />
      <div className="font-mono text-lg font-semibold">{value}</div>
      <div className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>{label}</div>
    </div>
  )
}
