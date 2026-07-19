import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Parametres() {
  const { profile, reloadProfile } = useAuth()
  const navigate = useNavigate()
  const [nomComplet, setNomComplet] = useState(profile?.nom_complet || '')
  const [photoPreview, setPhotoPreview] = useState(profile?.photo_url || null)
  const [photoFile, setPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      let photoUrl = profile?.photo_url || null

      if (photoFile) {
        const path = `${profile.id}/avatar_${Date.now()}_${photoFile.name}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(path, photoFile, {
          upsert: true,
        })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        photoUrl = urlData.publicUrl
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ nom_complet: nomComplet, photo_url: photoUrl })
        .eq('id', profile.id)
      if (updateError) throw updateError

      await reloadProfile()
      navigate(-1)
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <div className="glass-strong sticky top-0 z-40 flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Paramètres</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-4 px-4 pt-6">
        <div className="flex justify-center">
          <label className="relative cursor-pointer">
            <div
              className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full font-display text-2xl font-semibold"
              style={{ background: 'var(--invert-bg)', color: 'var(--invert-fg)' }}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                profile?.nom_complet?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <div
              className="glass absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full"
            >
              <Camera size={14} />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>
        <p className="text-center text-xs" style={{ color: 'var(--fg-muted)' }}>
          Touche la photo pour la changer
        </p>

        <Input label="Nom complet" value={nomComplet} onChange={(e) => setNomComplet(e.target.value)} />
        <Input label="E-mail" value={profile?.email} disabled className="opacity-50" />

        {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </form>
    </div>
  )
}
