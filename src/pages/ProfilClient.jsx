import { useEffect, useState } from 'react'
import { LogOut, Settings, MessageCircle, ShoppingBag, CreditCard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import TopHeader from '../components/TopHeader'
import Button from '../components/Button'
import WaveBars from '../components/WaveBars'

export default function ProfilClient() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ conversations: 0, commandes: 0, paiements: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!profile?.id) return
      const [{ count: convCount }, { count: cmdCount }, { data: commandesData }] = await Promise.all([
        supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('client_id', profile.id),
        supabase.from('commandes').select('*', { count: 'exact', head: true }).eq('client_id', profile.id),
        supabase.from('commandes').select('id').eq('client_id', profile.id).eq('status', 'paiement_effectue'),
      ])
      setStats({
        conversations: convCount || 0,
        commandes: cmdCount || 0,
        paiements: commandesData?.length || 0,
      })
      setLoading(false)
    }
    load()
  }, [profile?.id])

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <TopHeader
        title="Profil"
        right={
          <button onClick={() => navigate('/parametres')} className="glass flex h-9 w-9 items-center justify-center rounded-full">
            <Settings size={16} />
          </button>
        }
      />

      <div className="px-5 pt-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full font-display text-xl font-semibold"
            style={{ background: 'var(--invert-bg)', color: 'var(--invert-fg)' }}
          >
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              profile?.nom_complet?.[0]?.toUpperCase()
            )}
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">{profile?.nom_complet}</h2>
            <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>{profile?.email}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10" style={{ color: 'var(--fg)' }}>
            <WaveBars />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-3 gap-3">
            <StatCard icon={MessageCircle} value={stats.conversations} label="conversations" onClick={() => navigate('/messages')} />
            <StatCard icon={ShoppingBag} value={stats.commandes} label="commandes" onClick={() => navigate('/dashboard')} />
            <StatCard icon={CreditCard} value={stats.paiements} label="paiements" onClick={() => navigate('/dashboard')} />
          </div>
        )}

        <div className="mt-6 space-y-2.5">
          <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
            Voir mon historique complet
          </Button>
        </div>

        <button
          onClick={signOut}
          className="mt-8 flex w-full items-center justify-center gap-2 text-sm font-medium"
          style={{ color: 'var(--danger)' }}
        >
          <LogOut size={15} /> Se déconnecter
        </button>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, value, label, onClick }) {
  return (
    <button onClick={onClick} className="glass rounded-2xl p-4 text-center">
      <Icon size={17} className="mx-auto mb-1.5 opacity-70" />
      <div className="font-mono text-lg font-medium">{value}</div>
      <div className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>{label}</div>
    </button>
  )
}
