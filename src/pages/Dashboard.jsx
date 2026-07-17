import { useAuth } from '../context/AuthContext'
import DashboardInfluenceur from './DashboardInfluenceur'
import DashboardClient from './DashboardClient'
import DashboardAdmin from './DashboardAdmin'

export default function Dashboard() {
  const { profile } = useAuth()
  if (profile?.role === 'admin') return <DashboardAdmin />
  if (profile?.role === 'influenceur') return <DashboardInfluenceur />
  return <DashboardClient />
}
