import { NavLink } from 'react-router-dom'
import { Home, Search, PlusSquare, Heart, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function BottomNav() {
  const { profile } = useAuth()
  const isInfluenceur = profile?.role === 'influenceur'

  const items = [
    { to: '/', icon: Home, label: 'Accueil', end: true },
    { to: '/recherche', icon: Search, label: 'Recherche' },
    ...(isInfluenceur ? [{ to: '/publier', icon: PlusSquare, label: 'Publier' }] : []),
    { to: '/notifications', icon: Heart, label: 'Notifications' },
    { to: '/profil', icon: User, label: 'Profil' },
  ]

  return (
    <nav
      className="glass-strong fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-md items-center justify-around px-2 py-2.5"
      style={{
        paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--border-glass)',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
      }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 transition-opacity ${
              isActive ? 'opacity-100' : 'opacity-45'
            }`
          }
          style={{ color: 'var(--fg)' }}
        >
          <item.icon size={23} strokeWidth={2} />
        </NavLink>
      ))}
    </nav>
  )
}
