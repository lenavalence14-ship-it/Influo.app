import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Image as ImageIcon, X, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import TopHeader from '../components/TopHeader'
import Button from '../components/Button'

const cropOptions = [
  { key: 'carre', label: 'Carré', icon: Square },
  { key: 'horizontal', label: 'Horizontal', icon: RectangleHorizontal },
  { key: 'vertical', label: 'Vertical', icon: RectangleVertical },
]

export default function Publier() {
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type') === 'story' ? 'story' : 'photo'
  const [postType, setPostType] = useState(initialType)
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [legende, setLegende] = useState('')
  const [cropFormat, setCropFormat] = useState('carre')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const { profile } = useAuth()
  const navigate = useNavigate()

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || [])
    if (postType !== 'carrousel' && selected.length > 1) {
      setPostType('carrousel')
    }
    setFiles(selected)
    setPreviews(selected.map((f) => URL.createObjectURL(f)))
  }

  const removeFile = (idx) => {
    setFiles((f) => f.filter((_, i) => i !== idx))
    setPreviews((p) => p.filter((_, i) => i !== idx))
  }

  const handlePublish = async () => {
    if (files.length === 0) {
      setError('Ajoute au moins une photo')
      return
    }
    setUploading(true)
    setError('')

    try {
      const { data: profilData } = await supabase
        .from('profils_influenceur')
        .select('id')
        .eq('user_id', profile.id)
        .single()

      const type = postType === 'story' ? 'story' : files.length > 1 ? 'carrousel' : 'photo'
      const expireAt = type === 'story' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          influenceur_id: profilData.id,
          type,
          legende: type !== 'story' ? legende : null,
          crop_format: cropFormat,
          expire_at: expireAt,
        })
        .select()
        .single()

      if (postError) throw postError

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const path = `${profile.id}/${post.id}_${i}_${file.name}`
        const { error: uploadError } = await supabase.storage.from('posts').upload(path, file)
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('posts').getPublicUrl(path)

        await supabase.from('post_medias').insert({
          post_id: post.id,
          media_url: urlData.publicUrl,
          position: i,
        })
      }

      navigate('/')
    } catch (err) {
      setError(err.message || 'Erreur lors de la publication')
    } finally {
      setUploading(false)
    }
  }

  const aspectClass =
    cropFormat === 'carre' ? 'aspect-square' : cropFormat === 'horizontal' ? 'aspect-video' : 'aspect-[4/5]'

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <TopHeader title="Publier" />

      <div className="px-4 pt-4">
        <div className="glass mb-5 flex rounded-2xl p-1">
          {['photo', 'story'].map((t) => (
            <button
              key={t}
              onClick={() => setPostType(t)}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors"
              style={
                postType === t || (t === 'photo' && postType === 'carrousel')
                  ? { background: 'var(--invert-bg)', color: 'var(--invert-fg)' }
                  : { color: 'var(--fg-muted)' }
              }
            >
              {t === 'photo' ? 'Publication' : 'Story (24h)'}
            </button>
          ))}
        </div>

        {previews.length === 0 ? (
          <label
            className={`flex ${aspectClass} w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed`}
            style={{ borderColor: 'var(--border)' }}
          >
            <ImageIcon size={28} style={{ color: 'var(--fg-muted)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--fg-muted)' }}>
              Ajouter des photos
            </span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
          </label>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2 overflow-x-auto">
              {previews.map((src, i) => (
                <div key={i} className={`relative ${aspectClass} w-32 shrink-0 overflow-hidden rounded-xl`}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeFile(i)}
                    className="glass absolute right-1 top-1 rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            {postType !== 'story' && (
              <div>
                <div className="mb-2 text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>
                  Format
                </div>
                <div className="flex gap-2">
                  {cropOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setCropFormat(opt.key)}
                      className="flex flex-1 flex-col items-center gap-1 rounded-xl border py-2.5"
                      style={{ borderColor: cropFormat === opt.key ? 'var(--fg)' : 'var(--border)' }}
                    >
                      <opt.icon size={16} />
                      <span className="text-[10px]">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {postType !== 'story' && (
              <textarea
                value={legende}
                onChange={(e) => setLegende(e.target.value)}
                placeholder="Écris une légende…"
                rows={3}
                className="w-full resize-none rounded-xl border bg-transparent p-3.5 text-sm outline-none"
                style={{ borderColor: 'var(--border)' }}
              />
            )}
          </div>
        )}

        {error && <p className="mt-3 text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

        <Button className="mt-5 w-full" disabled={uploading || files.length === 0} onClick={handlePublish}>
          {uploading ? 'Publication…' : 'Publier'}
        </Button>
      </div>
    </div>
  )
}
