import { useAuth } from '../context/AuthContext'
import { useFeed } from '../hooks/useFeed'
import TopHeader from '../components/TopHeader'
import StoriesBar from '../components/StoriesBar'
import PostCard from '../components/PostCard'
import WaveBars from '../components/WaveBars'

export default function Home() {
  const { profile } = useAuth()
  const { posts, stories, loading, toggleLike, addComment } = useFeed()
  const isInfluenceur = profile?.role === 'influenceur'

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <TopHeader />

      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <StoriesBar stories={stories} currentUserId={profile?.id} isInfluenceur={isInfluenceur} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16" style={{ color: 'var(--fg)' }}>
          <WaveBars active />
        </div>
      ) : posts.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
            Aucune publication pour l'instant. Suis des influenceurs pour voir leur contenu ici.
          </p>
        </div>
      ) : (
        <div className="pt-2">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={(postId, isLiked) => toggleLike(postId, profile.id, isLiked)}
              onComment={(postId, contenu) => addComment(postId, profile.id, contenu)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
