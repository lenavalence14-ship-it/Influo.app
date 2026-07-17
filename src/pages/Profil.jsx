import { useAuth } from '../context/AuthContext'
import ProfilInfluenceur from './ProfilInfluenceur'
import ProfilClient from './ProfilClient'

export default function Profil() {
  const { profile } = useAuth()
  if (profile?.role === 'influenceur') return <ProfilInfluenceur />
  return <ProfilClient />
}
