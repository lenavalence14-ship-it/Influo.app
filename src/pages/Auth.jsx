import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Briefcase } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import WaveBars from '../components/WaveBars'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('client')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nomComplet, setNomComplet] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [showReset, setShowReset] = useState(false)

  const { signUp, signIn, resetPassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await signUp({ email, password, nomComplet, role })
      if (error) {
        setError(traduireErreur(error.message))
        setLoading(false)
        return
      }
    } else {
      const { error } = await signIn({ email, password })
      if (error) {
        setError(traduireErreur(error.message))
        setLoading(false)
        return
      }
    }
    setLoading(false)
    navigate('/')
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    const { error } = await resetPassword(email)
    if (error) {
      setError(traduireErreur(error.message))
      return
    }
    setResetSent(true)
  }

  if (showReset) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-5 pb-10 pt-8">
        <div style={{ color: 'var(--fg)' }}>
          <WaveBars size="md" />
        </div>
        <h1 className="font-display mt-5 text-[26px] font-semibold tracking-tight">
          Mot de passe oublié
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--fg-muted)' }}>
          On t'envoie un lien de réinitialisation par e-mail
        </p>

        {resetSent ? (
          <div className="glass mt-6 rounded-2xl p-4 text-sm">
            E-mail envoyé. Vérifie ta boîte de réception.
          </div>
        ) : (
          <form onSubmit={handleReset} className="mt-6 space-y-3.5">
            <Input
              label="Adresse e-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@exemple.com"
            />
            {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
            <Button type="submit" className="w-full">Envoyer le lien</Button>
          </form>
        )}

        <button
          onClick={() => { setShowReset(false); setResetSent(false); setError('') }}
          className="mt-5 text-xs font-medium underline underline-offset-2"
          style={{ color: 'var(--fg-muted)' }}
        >
          Retour à la connexion
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-5 pb-10 pt-8">
      <div style={{ color: 'var(--fg)' }}>
        <WaveBars size="md" />
      </div>
      <h1 className="font-display mt-5 text-[26px] font-semibold tracking-tight">
        {mode === 'login' ? 'Content de te revoir' : 'Crée ton compte'}
      </h1>
      <p className="mt-1.5 text-sm" style={{ color: 'var(--fg-muted)' }}>
        {mode === 'login' ? 'Connecte-toi pour continuer' : 'Rejoins Influo en quelques secondes'}
      </p>

      <div className="glass mt-6 flex rounded-2xl p-1">
        <button
          onClick={() => { setMode('login'); setError('') }}
          className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors"
          style={mode === 'login' ? { background: 'var(--invert-bg)', color: 'var(--invert-fg)' } : { color: 'var(--fg-muted)' }}
        >
          Connexion
        </button>
        <button
          onClick={() => { setMode('signup'); setError('') }}
          className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors"
          style={mode === 'signup' ? { background: 'var(--invert-bg)', color: 'var(--invert-fg)' } : { color: 'var(--fg-muted)' }}
        >
          Inscription
        </button>
      </div>

      {mode === 'signup' && (
        <div className="mt-6">
          <div className="mb-3 text-center text-[11px]" style={{ color: 'var(--fg-muted)' }}>
            Tu es
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('influenceur')}
              className="rounded-2xl border p-4 text-center transition-colors"
              style={{
                borderColor: role === 'influenceur' ? 'var(--fg)' : 'var(--border)',
                background: 'var(--bg-elevated)',
              }}
            >
              <Sparkles size={18} className="mx-auto mb-2" />
              <div className="text-xs font-semibold">Influenceur</div>
            </button>
            <button
              type="button"
              onClick={() => setRole('client')}
              className="rounded-2xl border p-4 text-center transition-colors"
              style={{
                borderColor: role === 'client' ? 'var(--fg)' : 'var(--border)',
                background: 'var(--bg-elevated)',
              }}
            >
              <Briefcase size={18} className="mx-auto mb-2" />
              <div className="text-xs font-semibold">Entreprise</div>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
        {mode === 'signup' && (
          <Input
            label="Nom complet"
            required
            value={nomComplet}
            onChange={(e) => setNomComplet(e.target.value)}
            placeholder="Ton nom"
          />
        )}
        <Input
          label="Adresse e-mail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="toi@exemple.com"
        />
        <Input
          label="Mot de passe"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {mode === 'login' && (
          <button
            type="button"
            onClick={() => setShowReset(true)}
            className="text-xs font-medium underline underline-offset-2"
            style={{ color: 'var(--fg-muted)' }}
          >
            Mot de passe oublié ?
          </button>
        )}

        {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </Button>
      </form>
    </div>
  )
}

function traduireErreur(msg) {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou mot de passe incorrect'
  if (msg.includes('already registered')) return 'Cet e-mail est déjà utilisé'
  if (msg.includes('Password should be')) return 'Le mot de passe doit contenir au moins 6 caractères'
  return msg
}
