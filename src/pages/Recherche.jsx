import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import TopHeader from '../components/TopHeader'
import VerifiedBadge from '../components/VerifiedBadge'
import WaveBars from '../components/WaveBars'

const filters = [
  { key: 'tous', label: 'Tous' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
]

export default function Recherche() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('tous')
  const [profils, setProfils] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      setLoading(true)
      let q = supabase.from('profils_influenceur').select('*, users(*), reseaux_sociaux(*)')
      const { data } = await q
      setProfils(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = profils.filter((p) => {
    const matchQuery =
      !query ||
      p.users?.nom_complet?.toLowerCase().includes(query.toLowerCase()) ||
      p.ville?.toLowerCase().includes(query.toLowerCase())
    const matchFilter =
      filter === 'tous' || p.reseaux_sociaux?.some((r) => r.plateforme === filter)
    return matchQuery && matchFilter
  })

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <TopHeader title="Découvrir" />

      <div className="px-4 pt-4">
        <div className="glass flex items-center gap-2.5 rounded-2xl px-4 py-3">
          <Search size={16} style={{ color: 'var(--fg-muted)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder="Nom, ville…"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium"
              style={
                filter === f.key
                  ? { background: 'var(--invert-bg)', color: 'var(--invert-fg)' }
                  : { border: '1px solid var(--border)', color: 'var(--fg-muted)' }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16" style={{ color: 'var(--fg)' }}>
          <WaveBars active />
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-6 py-16 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>
          Aucun influenceur ne correspond à ta recherche.
        </div>
      ) : (
        <div className="space-y-2.5 p-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/profil/${p.user_id}`)}
              className="glass flex w-full items-center gap-3.5 rounded-2xl p-4 text-left"
            >
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-lg font-semibold"
                style={{ background: 'var(--invert-bg)', color: 'var(--invert-fg)' }}
              >
                {p.users?.photo_url ? (
                  <img src={p.users.photo_url} alt="" className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  p.users?.nom_complet?.[0]?.toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold">{p.users?.nom_complet}</span>
                  {p.verifie && <VerifiedBadge size={13} />}
                </div>
                {(p.ville || p.pays) && (
                  <div className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: 'var(--fg-muted)' }}>
                    <MapPin size={11} /> {[p.ville, p.pays].filter(Boolean).join(', ')}
                  </div>
                )}
                <div className="mt-1.5 flex gap-1.5">
                  {(p.reseaux_sociaux || []).slice(0, 3).map((r) => (
                    <span
                      key={r.id}
                      className="rounded-full px-2 py-0.5 text-[10px]"
                      style={{ border: '1px solid var(--border)', color: 'var(--fg-muted)' }}
                    >
                      {r.plateforme}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
