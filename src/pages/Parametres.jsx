import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Parametres() {
  const { profile, reloadProfile } = useAuth()
  const navigate = useNavigate()
  const [nomComplet, setNomComplet] = useState(profile?.nom_complet || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('users').update({ nom_complet: nomComplet }).eq('id', profile.id)
    await reloadProfile()
    setSaving(false)
    navigate(-1)
  }

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <div className="glass-strong sticky top-0 z-40 flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Paramètres</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-3.5 px-4 pt-5">
        <Input label="Nom complet" value={nomComplet} onChange={(e) => setNomComplet(e.target.value)} />
        <Input label="E-mail" value={profile?.email} disabled className="opacity-50" />
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </form>
    </div>
  )
}
