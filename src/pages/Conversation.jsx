import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Paperclip, Camera, Send, DollarSign, Link2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import WaveBars from '../components/WaveBars'
import Button from '../components/Button'

export default function Conversation() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const isInfluenceur = profile?.role === 'influenceur'

  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [commande, setCommande] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showLivraison, setShowLivraison] = useState(false)
  const [livraisonLien, setLivraisonLien] = useState('')

  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const scrollRef = useRef(null)

  const load = useCallback(async () => {
    const { data: conv } = await supabase
      .from('conversations')
      .select('*, offres(*), profils_influenceur(*, users(*)), users:client_id(*)')
      .eq('id', id)
      .single()
    setConversation(conv)

    const { data: msgs } = await supabase
      .from('messages')
      .select('*, users(nom_complet)')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
    setMessages(msgs || [])

    const { data: cmd } = await supabase
      .from('commandes')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: false })
      .maybeSingle()
    setCommande(cmd)

    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`conversation-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [id, load])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (contenu, fichierUrl = null, fichierType = null, isSystem = false) => {
    await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: isSystem ? null : profile.id,
      is_system: isSystem,
      contenu,
      fichier_url: fichierUrl,
      fichier_type: fichierType,
    })
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', id)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    await sendMessage(text.trim())
    setText('')
    setSending(false)
    load()
  }

  const handleFileUpload = async (file, type) => {
    if (!file) return
    setSending(true)
    const path = `${id}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('messagerie').upload(path, file)
    if (!error) {
      const { data: urlData } = supabase.storage.from('messagerie').createSignedUrl(path, 60 * 60 * 24 * 7)
      await sendMessage(null, urlData?.signedUrl, type)
    }
    setSending(false)
    load()
  }

  const demanderPaiement = async () => {
    const offre = conversation.offres
    if (!offre) return

    const commission = Number(offre.prix) * 0.1
    const montantNet = Number(offre.prix) - commission

    const { data: newCmd } = await supabase
      .from('commandes')
      .insert({
        conversation_id: id,
        client_id: conversation.client_id,
        influenceur_id: conversation.influenceur_id,
        offre_id: offre.id,
        montant: offre.prix,
        commission,
        montant_net: montantNet,
        status: 'paiement_demande',
      })
      .select()
      .single()

    await sendMessage(
      `L'influenceur demande le paiement de ${Number(offre.prix).toLocaleString('fr-FR')} F pour l'offre "${offre.titre}".`,
      null,
      null,
      true
    )
    setCommande(newCmd)
    load()
  }

  const payer = async () => {
    setSending(true)
    // MOCK : simulation de paiement, pas de vraie API locale connectée pour l'instant
    await supabase
      .from('paiements')
      .insert({
        commande_id: commande.id,
        montant: commande.montant,
        commission: commande.commission,
        provider_simule: 'mock',
        reussi: true,
      })

    await supabase
      .from('commandes')
      .update({ status: 'paiement_effectue' })
      .eq('id', commande.id)

    // Créditer le wallet influenceur (verrouillé)
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('influenceur_id', conversation.influenceur_id)
      .maybeSingle()

    if (wallet) {
      await supabase
        .from('wallets')
        .update({
          solde_verrouille: Number(wallet.solde_verrouille) + Number(commande.montant_net),
          revenus_totaux: Number(wallet.revenus_totaux) + Number(commande.montant_net),
        })
        .eq('id', wallet.id)
      await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        commande_id: commande.id,
        type: 'credit_verrouille',
        montant: commande.montant_net,
      })
    } else {
      const { data: newWallet } = await supabase
        .from('wallets')
        .insert({
          influenceur_id: conversation.influenceur_id,
          solde_verrouille: commande.montant_net,
          revenus_totaux: commande.montant_net,
        })
        .select()
        .single()
      await supabase.from('wallet_transactions').insert({
        wallet_id: newWallet.id,
        commande_id: commande.id,
        type: 'credit_verrouille',
        montant: commande.montant_net,
      })
    }

    await sendMessage(`Paiement effectué avec succès (reçu disponible).`, null, null, true)
    setSending(false)
    load()
  }

  const envoyerLivraison = async (e) => {
    e.preventDefault()
    if (!livraisonLien.trim()) return
    await supabase
      .from('commandes')
      .update({ status: 'en_attente_validation', lien_livraison: livraisonLien.trim() })
      .eq('id', commande.id)
    await sendMessage(`Prestation livrée : ${livraisonLien.trim()}`)
    setShowLivraison(false)
    setLivraisonLien('')
    load()
  }

  const confirmerReception = async () => {
    setSending(true)
    await supabase.from('commandes').update({ status: 'terminee' }).eq('id', commande.id)

    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('influenceur_id', conversation.influenceur_id)
      .single()

    await supabase
      .from('wallets')
      .update({
        solde_verrouille: Number(wallet.solde_verrouille) - Number(commande.montant_net),
        solde_disponible: Number(wallet.solde_disponible) + Number(commande.montant_net),
      })
      .eq('id', wallet.id)

    await supabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      commande_id: commande.id,
      type: 'deverrouillage',
      montant: commande.montant_net,
    })

    await sendMessage('Prestation validée. Les fonds sont désormais disponibles pour l\'influenceur.', null, null, true)
    setSending(false)
    load()
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ color: 'var(--fg)' }}>
        <WaveBars active />
      </div>
    )
  }

  const otherName = isInfluenceur ? conversation?.users?.nom_complet : conversation?.profils_influenceur?.users?.nom_complet

  return (
    <div className="mx-auto flex h-screen max-w-md flex-col">
      <div className="glass-strong sticky top-0 z-40 flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate('/messages')}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="text-sm font-semibold">{otherName}</div>
          {conversation?.offres?.titre && (
            <div className="text-[11px]" style={{ color: 'var(--fg-muted)' }}>
              {conversation.offres.titre} · {Number(conversation.offres.prix).toLocaleString('fr-FR')} F
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} isMine={msg.sender_id === profile.id} />
        ))}

        {/* Actions contextuelles selon l'état de la commande */}
        {commande?.status === 'paiement_demande' && !isInfluenceur && (
          <div className="glass mx-auto my-3 max-w-xs rounded-2xl p-4 text-center">
            <div className="font-mono text-lg font-semibold">
              {Number(commande.montant).toLocaleString('fr-FR')} F
            </div>
            <Button className="mt-3 w-full" onClick={payer} disabled={sending}>
              Payer
            </Button>
          </div>
        )}

        {commande?.status === 'paiement_effectue' && !isInfluenceur && (
          <div className="glass mx-auto my-3 max-w-xs rounded-2xl p-4 text-center">
            <CheckCircle2 size={20} className="mx-auto mb-1.5" />
            <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>Paiement confirmé</p>
            <button className="mt-2 text-xs font-semibold underline">Télécharger le reçu</button>
          </div>
        )}

        {commande?.status === 'paiement_effectue' && isInfluenceur && (
          <div className="glass mx-auto my-3 max-w-xs rounded-2xl p-4 text-center">
            <p className="mb-2 text-xs" style={{ color: 'var(--fg-muted)' }}>
              Une fois la prestation réalisée, envoie le lien de la publication.
            </p>
            {showLivraison ? (
              <form onSubmit={envoyerLivraison} className="space-y-2">
                <input
                  value={livraisonLien}
                  onChange={(e) => setLivraisonLien(e.target.value)}
                  placeholder="Lien de la publication"
                  className="w-full rounded-xl border bg-transparent px-3 py-2 text-xs outline-none"
                  style={{ borderColor: 'var(--border)' }}
                />
                <Button type="submit" className="w-full !py-2 !text-xs">Envoyer</Button>
              </form>
            ) : (
              <Button className="w-full !py-2 !text-xs" onClick={() => setShowLivraison(true)}>
                <Link2 size={13} /> Envoyer le lien
              </Button>
            )}
          </div>
        )}

        {commande?.status === 'en_attente_validation' && !isInfluenceur && (
          <div className="glass mx-auto my-3 max-w-xs rounded-2xl p-4 text-center">
            <p className="mb-2 text-xs" style={{ color: 'var(--fg-muted)' }}>
              La prestation a été livrée. Si tu es satisfait(e), confirme la réception.
            </p>
            <Button className="w-full !py-2 !text-xs" onClick={confirmerReception} disabled={sending}>
              Confirmer la réception
            </Button>
          </div>
        )}

        {commande?.status === 'terminee' && (
          <div className="my-3 text-center text-xs" style={{ color: 'var(--fg-muted)' }}>
            ✓ Prestation terminée
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="glass-strong sticky bottom-0 flex items-center gap-2 px-3 py-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files[0], 'fichier')}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files[0], 'image')}
        />
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          <Paperclip size={19} style={{ color: 'var(--fg-muted)' }} />
        </button>
        <button type="button" onClick={() => cameraInputRef.current?.click()}>
          <Camera size={19} style={{ color: 'var(--fg-muted)' }} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          className="flex-1 rounded-full border bg-transparent px-4 py-2.5 text-sm outline-none"
          style={{ borderColor: 'var(--border)' }}
        />
        {isInfluenceur && conversation?.offres && !commande && (
          <button
            type="button"
            onClick={demanderPaiement}
            className="glass flex h-9 w-9 items-center justify-center rounded-full shrink-0"
            title="Recevoir le paiement"
          >
            <DollarSign size={16} />
          </button>
        )}
        <button type="submit" disabled={sending || !text.trim()}>
          <Send size={19} style={{ color: 'var(--fg)' }} />
        </button>
      </form>
    </div>
  )
}

function MessageBubble({ msg, isMine }) {
  if (msg.is_system) {
    return (
      <div className="my-3 text-center">
        <span className="glass inline-block rounded-full px-3.5 py-1.5 text-[11px]" style={{ color: 'var(--fg-muted)' }}>
          {msg.contenu}
        </span>
      </div>
    )
  }

  return (
    <div className={`mb-2.5 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm"
        style={
          isMine
            ? { background: 'var(--invert-bg)', color: 'var(--invert-fg)' }
            : { background: 'var(--bg-elevated)', border: '1px solid var(--border)' }
        }
      >
        {msg.fichier_url && msg.fichier_type === 'image' ? (
          <img src={msg.fichier_url} alt="" className="mb-1 max-w-full rounded-lg" />
        ) : msg.fichier_url ? (
          <a href={msg.fichier_url} target="_blank" rel="noopener noreferrer" className="underline">
            📎 Fichier joint
          </a>
        ) : null}
        {msg.contenu}
      </div>
    </div>
  )
}
