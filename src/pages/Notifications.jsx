import { useEffect, useState } from 'react'
import { Heart, MessageCircle, DollarSign, CheckCircle2, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import TopHeader from '../components/TopHeader'
import WaveBars from '../components/WaveBars'

const iconMap = {
  like: Heart,
  comment: MessageCircle,
  message: Send,
  paiement_demande: DollarSign,
  paiement_recu: DollarSign,
  validation: CheckCircle2,
  retrait: DollarSign,
}

export default function Notifications() {
  const { profile } = useAuth()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      setNotifs(data || [])
      setLoading(false)
      await supabase.from('notifications').update({ lu: true }).eq('user_id', profile.id).eq('lu', false)
    }
    if (profile?.id) load()
  }, [profile?.id])

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <TopHeader title="Notifications" />

      {loading ? (
        <div className="flex justify-center py-16" style={{ color: 'var(--fg)' }}>
          <WaveBars active />
        </div>
      ) : notifs.length === 0 ? (
        <div className="px-6 py-16 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>
          Aucune notification pour l'instant.
        </div>
      ) : (
        <div>
          {notifs.map((n) => {
            const Icon = iconMap[n.type] || Heart
            return (
              <div
                key={n.id}
                className="flex items-center gap-3 border-b px-4 py-3.5"
                style={{ borderColor: 'var(--border)', opacity: n.lu ? 0.6 : 1 }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  <Icon size={15} />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{n.contenu}</p>
                  <p className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                    {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
