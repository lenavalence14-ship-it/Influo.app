import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Image as ImageIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import TopHeader from '../components/TopHeader'
import Input from '../components/Input'
import Button from '../components/Button'
import OffreCard from '../components/OffreCard'

const platforms = [
  { key: 'tiktok', label: 'TikTok' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'x', label: 'X' },
  { key: 'snapchat', label: 'Snapchat' },
  { key: 'autre', label: 'Autre' },
]

export default function OffreForm() {
  const { id } = useParams()
  const isEditing = !!id
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [prix, setPrix] = useState('')
  const [plateforme, setPlateforme] = useState('instagram')
  const [delaiJours, setDelaiJours] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEditing) {
      supabase.from('offres').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          setTitre(data.titre)
          setDescription(data.description)
          setPrix(data.prix)
          setPlateforme(data.plateforme)
          setDelaiJours(data.delai_jours)
          setPhotoPreview(data.photo_url)
        }
      })
    }
  }, [id, isEditing])

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const { data: profilData } = await supabase
      .from('profils_influenceur')
      .select('id')
      .eq('user_id', profile.id)
      .single()

    let photoUrl = photoPreview

    if (photoFile) {
      const path = `${profile.id}/${Date.now()}_${photoFile.name}`
      await supabase.storage.from('offres').upload(path, photoFile)
      const { data: urlData } = supabase.storage.from('offres').getPublicUrl(path)
      photoUrl = urlData.publicUrl
    }

    const payload = {
      influenceur_id: profilData.id,
      titre,
      description,
      prix: Number(prix),
      plateforme,
      delai_jours: Number(delaiJours),
      photo_url: photoUrl,
    }

    if (isEditing) {
      await supabase.from('offres').update(payload).eq('id', id)
    } else {
      await supabase.from('offres').insert(payload)
    }

    setSaving(false)
    navigate('/dashboard')
  }

  const previewOffre = {
    titre: titre || 'Titre de l\'offre',
    description: description || 'Description de la prestation…',
    prix: prix || 0,
    plateforme,
    delai_jours: delaiJours || '—',
    photo_url: photoPreview,
    actif: true,
  }

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <TopHeader title={isEditing ? "Modifier l'offre" : 'Nouvelle offre'} />

      <div className="px-4 pt-4">
        <div className="mb-2 text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>Aperçu</div>
        <div className="mx-auto max-w-[220px]">
          <OffreCard offre={previewOffre} />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
          <label
            className="flex h-28 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed"
            style={{ borderColor: 'var(--border)' }}
          >
            <ImageIcon size={18} style={{ color: 'var(--fg-muted)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>
              {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>

          <Input label="Titre" required value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex : Story sponsorisée" />

          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>
              Description
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border bg-transparent p-3.5 text-sm outline-none"
              style={{ borderColor: 'var(--border)' }}
              placeholder="Décris ce que tu proposes…"
            />
          </div>

          <Input label="Prix (F CFA)" type="number" required value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="45000" />

          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>
              Plateforme
            </label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPlateforme(p.key)}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium"
                  style={{ borderColor: plateforme === p.key ? 'var(--fg)' : 'var(--border)' }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <Input label="Délai de réalisation (jours)" type="number" required value={delaiJours} onChange={(e) => setDelaiJours(e.target.value)} placeholder="3" />

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Enregistrement…' : isEditing ? "Modifier l'offre" : "Créer l'offre"}
          </Button>
        </form>
      </div>
    </div>
  )
}
