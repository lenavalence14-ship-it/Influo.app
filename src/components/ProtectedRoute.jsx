import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import WaveBars from './WaveBars'

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ color: 'var(--fg)' }}>
        <WaveBars size="md" active />
      </div>
    )
  }

  if (!session) return <Navigate to="/auth" replace />

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return children
}
