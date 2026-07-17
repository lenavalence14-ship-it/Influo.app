import { useState } from 'react'
import { Heart, MessageCircle, Send, ChevronLeft, ChevronRight } from 'lucide-react'
import VerifiedBadge from './VerifiedBadge'
import { useAuth } from '../context/AuthContext'

export default function PostCard({ post, onLike, onComment }) {
  const { profile } = useAuth()
  const [slideIndex, setSlideIndex] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')

  const medias = (post.post_medias || []).sort((a, b) => a.position - b.position)
  const influenceur = post.profils_influenceur
  const user = influenceur?.users
  const isLiked = post.post_likes?.some((l) => l.user_id === profile?.id)
  const likesCount = post.post_likes?.length || 0
  const comments = post.post_comments || []

  const aspectClass =
    post.crop_format === 'carre' ? 'aspect-square' : post.crop_format === 'horizontal' ? 'aspect-video' : 'aspect-[4/5]'

  const handleSubmitComment = (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    onComment(post.id, commentText.trim())
    setCommentText('')
  }

  return (
    <div className="mb-1 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold"
          style={{ background: 'var(--invert-bg)', color: 'var(--invert-fg)' }}
        >
          {user?.photo_url ? (
            <img src={user.photo_url} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            user?.nom_complet?.[0]?.toUpperCase() || '?'
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold">{user?.nom_complet}</span>
          {influenceur?.verifie && <VerifiedBadge size={14} />}
        </div>
        {influenceur?.ville && (
          <span className="ml-auto text-xs" style={{ color: 'var(--fg-muted)' }}>
            {influenceur.ville}
          </span>
        )}
      </div>

      {/* Media */}
      <div className={`relative w-full overflow-hidden ${aspectClass}`} style={{ background: 'var(--bg-elevated)' }}>
        {medias.length > 0 && (
          <img src={medias[slideIndex]?.media_url} alt="" className="h-full w-full object-cover" />
        )}
        {medias.length > 1 && (
          <>
            {slideIndex > 0 && (
              <button
                onClick={() => setSlideIndex((i) => i - 1)}
                className="glass absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1.5"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {slideIndex < medias.length - 1 && (
              <button
                onClick={() => setSlideIndex((i) => i + 1)}
                className="glass absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5"
              >
                <ChevronRight size={16} />
              </button>
            )}
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {medias.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: i === slideIndex ? 'white' : 'rgba(255,255,255,0.4)' }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 pt-3">
        <button onClick={() => onLike(post.id, isLiked)} className="flex items-center gap-1.5">
          <Heart
            size={22}
            fill={isLiked ? 'var(--danger)' : 'none'}
            color={isLiked ? 'var(--danger)' : 'currentColor'}
          />
        </button>
        <button onClick={() => setShowComments((s) => !s)} className="flex items-center gap-1.5">
          <MessageCircle size={22} />
        </button>
        <Send size={20} className="opacity-70" />
      </div>

      <div className="px-4 pt-1.5 text-sm font-semibold">{likesCount} j'aime</div>

      {post.legende && (
        <div className="px-4 pt-1 text-sm">
          <span className="font-semibold">{user?.nom_complet}</span> {post.legende}
        </div>
      )}

      {comments.length > 0 && !showComments && (
        <button
          onClick={() => setShowComments(true)}
          className="px-4 pt-1 text-sm"
          style={{ color: 'var(--fg-muted)' }}
        >
          Voir les {comments.length} commentaires
        </button>
      )}

      {showComments && (
        <div className="mt-2 space-y-1.5 px-4">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-semibold">{c.users?.nom_complet}</span> {c.contenu}
            </div>
          ))}
          <form onSubmit={handleSubmitComment} className="mt-2 flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ajouter un commentaire…"
              className="flex-1 rounded-full border bg-transparent px-3.5 py-2 text-sm outline-none"
              style={{ borderColor: 'var(--border)' }}
            />
            <button type="submit" className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
              Publier
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
