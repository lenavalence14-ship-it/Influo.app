import { useEffect, useState } from 'react'
import { Lock, Unlock, TrendingUp, ArrowDownToLine } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import TopHeader from '../components/TopHeader'
import Button from '../components/Button'
import WaveBars from '../components/WaveBars'

export default function Wallet() {
  const { profile } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [retraits, setRetraits] = useState([])
  const [moyensPaiement, setMoyensPaiement] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRetraitForm, setShowRetraitForm] = useState(false)
  const [showMoyenForm, setShowMoyenForm] = useState(false)
  const [montantRetrait, setMontantRetrait] = useState('')
  const [provider, setProvider] = useState('mtn_momo')
  const [numero, setNumero] = useState('')

  const load = async () => {
    const { data: profilData } = await supabase
      .from('profils_influenceur')
      .select('id')
      .eq('user_id', profile.id)
      .single()

    const { data: walletData } = await supabase
      .from('wallets')
      .select('*')
      .eq('influenceur_id', profilData.id)
      .maybeSingle()
    setWallet(walletData)

    if (walletData) {
      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletData.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setTransactions(txData || [])
    }

    const { data: retraitsData } = await supabase
      .from('retraits')
      .select('*')
      .eq('influenceur_id', profilData.id)
      .order('created_at', { ascending: false })
    setRetraits(retraitsData || [])

    const { data: moyensData } = await supabase
      .from('moyens_paiement')
      .select('*')
      .eq('influenceur_id', profilData.id)
    setMoyensPaiement(moyensData || [])

    setLoading(false)
  }

  useEffect(() => {
    if (profile?.id) load()
  }, [profile?.id])

  const ajouterMoyenPaiement = async (e) => {
    e.preventDefault()
    const { data: profilData } = await supabase
      .from('profils_influenceur')
      .select('id')
      .eq('user_id', profile.id)
      .single()
    await supabase.from('moyens_paiement').insert({ influenceur_id: profilData.id, provider, numero })
    setShowMoyenForm(false)
    setNumero('')
    load()
  }

  const demanderRetrait = async (e) => {
    e.preventDefault()
    const montant = Number(montantRetrait)
    if (!montant || montant <= 0 || montant > Number(wallet.solde_disponible)) return

    const { data: profilData } = await supabase
      .from('profils_influenceur')
      .select('id')
      .eq('user_id', profile.id)
      .single()

    await supabase.from('retraits').insert({
      influenceur_id: profilData.id,
      moyen_paiement_id: moyensPaiement[0]?.id,
      montant,
      status: 'en_attente',
    })

    await supabase
      .from('wallets')
      .update({ solde_disponible: Number(wallet.solde_disponible) - montant })
      .eq('id', wallet.id)

    await supabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      type: 'retrait',
      montant: -montant,
    })

    setShowRetraitForm(false)
    setMontantRetrait('')
    load()
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ color: 'var(--fg)' }}>
        <WaveBars active />
      </div>
    )
  }

  const soldeDisponible = Number(wallet?.solde_disponible || 0)
  const soldeVerrouille = Number(wallet?.solde_verrouille || 0)
  const revenusTotaux = Number(wallet?.revenus_totaux || 0)

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <TopHeader title="Portefeuille" />

      <div className="px-4 pt-4">
        <div className="glass-strong rounded-3xl p-5 text-center">
          <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>Solde disponible</div>
          <div className="font-mono mt-1 text-4xl font-semibold">
            {soldeDisponible.toLocaleString('fr-FR')} F
          </div>
          <Button
            className="mt-4 w-full"
            disabled={soldeDisponible <= 0}
            onClick={() => (moyensPaiement.length === 0 ? setShowMoyenForm(true) : setShowRetraitForm(true))}
          >
            <ArrowDownToLine size={15} /> Retirer
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-4">
            <Lock size={15} className="mb-1.5 opacity-60" />
            <div className="font-mono text-lg font-medium">{soldeVerrouille.toLocaleString('fr-FR')} F</div>
            <div className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>Verrouillé</div>
          </div>
          <div className="glass rounded-2xl p-4">
            <TrendingUp size={15} className="mb-1.5 opacity-60" />
            <div className="font-mono text-lg font-medium">{revenusTotaux.toLocaleString('fr-FR')} F</div>
            <div className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>Revenus totaux</div>
          </div>
        </div>

        {showMoyenForm && (
          <form onSubmit={ajouterMoyenPaiement} className="glass mt-4 space-y-3 rounded-2xl p-4">
            <div className="text-xs font-medium">Ajouter un moyen de paiement</div>
            <div className="flex gap-2">
              {['mtn_momo', 'moov_money'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className="flex-1 rounded-xl border py-2 text-xs font-medium"
                  style={{ borderColor: provider === p ? 'var(--fg)' : 'var(--border)' }}
                >
                  {p === 'mtn_momo' ? 'MTN Mobile Money' : 'Moov Money'}
                </button>
              ))}
            </div>
            <input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Numéro de téléphone"
              required
              className="w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-sm outline-none"
              style={{ borderColor: 'var(--border)' }}
            />
            <Button type="submit" className="w-full !py-2 !text-xs">Enregistrer</Button>
          </form>
        )}

        {showRetraitForm && (
          <form onSubmit={demanderRetrait} className="glass mt-4 space-y-3 rounded-2xl p-4">
            <div className="text-xs font-medium">
              Retrait vers {moyensPaiement[0]?.provider === 'mtn_momo' ? 'MTN Mobile Money' : 'Moov Money'} ({moyensPaiement[0]?.numero})
            </div>
            <input
              type="number"
              value={montantRetrait}
              onChange={(e) => setMontantRetrait(e.target.value)}
              placeholder={`Montant (max ${soldeDisponible.toLocaleString('fr-FR')} F)`}
              max={soldeDisponible}
              required
              className="w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-sm outline-none"
              style={{ borderColor: 'var(--border)' }}
            />
            <Button type="submit" className="w-full !py-2 !text-xs">Confirmer le retrait</Button>
          </form>
        )}

        <div className="mt-6">
          <h2 className="mb-2.5 text-xs font-semibold uppercase" style={{ color: 'var(--fg-muted)' }}>
            Historique des paiements
          </h2>
          {transactions.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>Aucune transaction pour l'instant.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-xl border px-3.5 py-2.5" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                    {tx.type === 'credit_verrouille' ? 'Paiement reçu (verrouillé)' : tx.type === 'deverrouillage' ? 'Fonds débloqués' : 'Retrait'}
                  </span>
                  <span className="font-mono text-sm font-medium">
                    {Number(tx.montant) > 0 ? '+' : ''}{Number(tx.montant).toLocaleString('fr-FR')} F
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {retraits.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2.5 text-xs font-semibold uppercase" style={{ color: 'var(--fg-muted)' }}>
              Historique des retraits
            </h2>
            <div className="space-y-2">
              {retraits.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border px-3.5 py-2.5" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                    {new Date(r.created_at).toLocaleDateString('fr-FR')} · {r.status}
                  </span>
                  <span className="font-mono text-sm font-medium">{Number(r.montant).toLocaleString('fr-FR')} F</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
