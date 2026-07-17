import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

export default function StoriesBar({ stories, currentUserId, isInfluenceur }) {
  const [viewing, setViewing] = useState(null)
  const navigate = useNavigate()

  // Grouper les stories par influenceur
  const grouped = stories.reduce((acc, s) => {
    const key = s.profils_influenceur?.id
    if (!key) return acc
    if (!acc[key]) acc[key] = { profil: s.profils_influenceur, items: [] }
    acc[key].items.push(s)
    return acc
  }, {})
  const groups = Object.values(grouped)

  return (
    <>
      <div className="flex gap-4 overflow-x-auto px-4 py-3">
        {isInfluenceur && (
          <button
            onClick={() => navigate('/publier?type=story')}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed text-2xl font-light"
              style={{ borderColor: 'var(--border)', color: 'var(--fg-muted)' }}
            >
              +
            </div>
            <span className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>
              Ta story
            </span>
          </button>
        )}
        {groups.map((g) => (
          <button
            key={g.profil.id}
            onClick={() => setViewing(g)}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <div
              className="rounded-full p-[2.5px]"
              style={{ background: 'linear-gradient(135deg, #fff, #888, #fff)' }}
            >
              <div className="rounded-full p-[2px]" style={{ background: 'var(--bg)' }}>
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full font-display text-sm font-semibold"
                  style={{ background: 'var(--invert-bg)', color: 'var(--invert-fg)' }}
                >
                  {g.profil.users?.photo_url ? (
                    <img src={g.profil.users.photo_url} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    g.profil.users?.nom_complet?.[0]?.toUpperCase()
                  )}
                </div>
              </div>
            </div>
            <span className="max-w-[64px] truncate text-[11px]">{g.profil.users?.nom_complet}</span>
          </button>
        ))}
      </div>

      {viewing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
          <button
            onClick={() => setViewing(null)}
            className="absolute right-4 top-4 z-10 text-white"
          >
            <X size={24} />
          </button>
          <div className="absolute left-3 right-3 top-3 flex gap-1">
            {viewing.items.map((_, i) => (
              <div key={i} className="h-0.5 flex-1 rounded-full bg-white/30">
                <div className="h-full w-full rounded-full bg-white" />
              </div>
            ))}
          </div>
          <img
            src={viewing.items[0]?.post_medias?.[0]?.media_url}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </>
  )
}
