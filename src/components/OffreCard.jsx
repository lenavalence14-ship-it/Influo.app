import { Clock, Zap } from 'lucide-react'

const platformLabels = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  x: 'X',
  snapchat: 'Snapchat',
  autre: 'Autre',
}

export default function OffreCard({ offre, onContact, compact = false }) {
  return (
    <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-2xl">
      {offre.photo_url ? (
        <img src={offre.photo_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

      {!offre.actif && (
        <div className="absolute right-2.5 top-2.5 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium text-white/70">
          Inactive
        </div>
      )}

      <div className="glass absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-medium text-white">
        {platformLabels[offre.plateforme] || offre.plateforme}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <div className="font-display text-base font-semibold leading-tight">{offre.titre}</div>
        {!compact && (
          <p className="mt-1 line-clamp-2 text-xs text-white/75">{offre.description}</p>
        )}
        <div className="mt-2.5 flex items-center justify-between">
          <span className="font-mono text-lg font-medium">
            {Number(offre.prix).toLocaleString('fr-FR')} F
          </span>
          <span className="flex items-center gap-1 text-[11px] text-white/70">
            <Clock size={11} /> {offre.delai_jours}j
          </span>
        </div>
        {onContact && (
          <button
            onClick={() => onContact(offre)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-xs font-semibold text-black"
          >
            <Zap size={13} /> Entrer en contact
          </button>
        )}
      </div>
    </div>
  )
}
