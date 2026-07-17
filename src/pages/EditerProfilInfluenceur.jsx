import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Input from '../components/Input'
import Button from '../components/Button'

const platforms = ['tiktok', 'instagram', 'youtube', 'facebook', 'x', 'snapchat', 'autre']

export default function EditerProfilInfluenceur() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [profilId, setProfilId] = useState(null)
  const [bio, setBio] = useState('')
  const [pays, setPays] = useState('')
  const [ville, setVille] = useState('')
  const [reseaux, setReseaux] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profils_influenceur')
        .select('*, reseaux_sociaux(*)')
        .eq('user_id', profile.id)
        .single()
      if (data) {
        setProfilId(data.id)
        setBio(data.bio || '')
        setPays(data.pays || '')
        setVille(data.ville || '')
        setReseaux(data.reseaux_sociaux || [])
      }
    }
    if (profile?.id) load()
  }, [profile?.id])

  const addReseau = () => {
    setReseaux((r) => [...r, { plateforme: 'instagram', nom_compte: '', lien_profil: '', nombre_abonnes: 0, _new: true }])
  }

  const updateReseau = (idx, field, value) => {
    setReseaux((r) => r.map((res, i) => (i === idx ? { ...res, [field]: value } : res)))
  }

  const removeReseau = async (idx) => {
    const reseau = reseaux[idx]
    if (reseau.id) await supabase.from('reseaux_sociaux').delete().eq('id', reseau.id)
    setReseaux((r) => r.filter((_, i) => i !== idx))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    await supabase.from('profils_influenceur').update({ bio, pays, ville }).eq('id', profilId)

    for (const reseau of reseaux) {
      if (reseau.id) {
        await supabase
          .from('reseaux_sociaux')
          .update({
            plateforme: reseau.plateforme,
            nom_compte: reseau.nom_compte,
            lien_profil: reseau.lien_profil,
            nombre_abonnes: Number(reseau.nombre_abonnes),
          })
          .eq('id', reseau.id)
      } else {
        await supabase.from('reseaux_sociaux').insert({
          influenceur_id: profilId,
          plateforme: reseau.plateforme,
          nom_compte: reseau.nom_compte,
          lien_profil: reseau.lien_profil,
          nombre_abonnes: Number(reseau.nombre_abonnes) || 0,
        })
      }
    }

    setSaving(false)
    navigate('/profil')
  }

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <div className="glass-strong sticky top-0 z-40 flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Modifier le profil</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-3.5 px-4 pt-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border bg-transparent p-3.5 text-sm outline-none"
            style={{ borderColor: 'var(--border)' }}
            placeholder="Parle un peu de toi…"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Pays" value={pays} onChange={(e) => setPays(e.target.value)} />
          <Input label="Ville" value={ville} onChange={(e) => setVille(e.target.value)} />
        </div>

        <div className="pt-2">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-sm font-semibold">Réseaux sociaux</span>
            <button type="button" onClick={addReseau} className="flex items-center gap-1 text-xs font-semibold">
              <Plus size={13} /> Ajouter
            </button>
          </div>

          <div className="space-y-3">
            {reseaux.map((reseau, idx) => (
              <div key={reseau.id || idx} className="glass space-y-2.5 rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <select
                    value={reseau.plateforme}
                    onChange={(e) => updateReseau(idx, 'plateforme', e.target.value)}
                    className="rounded-lg border bg-transparent px-2.5 py-1.5 text-xs capitalize"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {platforms.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeReseau(idx)}>
                    <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                  </button>
                </div>
                <input
                  value={reseau.nom_compte}
                  onChange={(e) => updateReseau(idx, 'nom_compte', e.target.value)}
                  placeholder="Nom du compte"
                  className="w-full rounded-lg border bg-transparent px-3 py-2 text-xs outline-none"
                  style={{ borderColor: 'var(--border)' }}
                />
                <input
                  value={reseau.lien_profil}
                  onChange={(e) => updateReseau(idx, 'lien_profil', e.target.value)}
                  placeholder="Lien du profil"
                  className="w-full rounded-lg border bg-transparent px-3 py-2 text-xs outline-none"
                  style={{ borderColor: 'var(--border)' }}
                />
                <input
                  type="number"
                  value={reseau.nombre_abonnes}
                  onChange={(e) => updateReseau(idx, 'nombre_abonnes', e.target.value)}
                  placeholder="Nombre d'abonnés"
                  className="w-full rounded-lg border bg-transparent px-3 py-2 text-xs outline-none"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </form>
    </div>
  )
}
