import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import BottomNav from './components/BottomNav'

import Auth from './pages/Auth'
import Home from './pages/Home'
import Recherche from './pages/Recherche'
import Publier from './pages/Publier'
import Notifications from './pages/Notifications'
import Profil from './pages/Profil'
import ProfilInfluenceur from './pages/ProfilInfluenceur'
import EditerProfilInfluenceur from './pages/EditerProfilInfluenceur'
import Messages from './pages/Messages'
import Conversation from './pages/Conversation'
import Wallet from './pages/Wallet'
import Dashboard from './pages/Dashboard'
import OffreForm from './pages/OffreForm'
import Parametres from './pages/Parametres'

function Layout({ children }) {
  const { session } = useAuth()
  const location = useLocation()
  const hideNav = location.pathname.startsWith('/messages/') || location.pathname === '/auth'

  return (
    <>
      {children}
      {session && !hideNav && <BottomNav />}
    </>
  )
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/auth" element={<Auth />} />

        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/recherche" element={<ProtectedRoute><Recherche /></ProtectedRoute>} />
        <Route path="/publier" element={<ProtectedRoute requiredRole="influenceur"><Publier /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

        <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
        <Route path="/profil/editer" element={<ProtectedRoute requiredRole="influenceur"><EditerProfilInfluenceur /></ProtectedRoute>} />
        <Route path="/profil/:userId" element={<ProtectedRoute><ProfilInfluenceur /></ProtectedRoute>} />

        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/messages/:id" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />

        <Route path="/wallet" element={<ProtectedRoute requiredRole="influenceur"><Wallet /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        <Route path="/offres/nouvelle" element={<ProtectedRoute requiredRole="influenceur"><OffreForm /></ProtectedRoute>} />
        <Route path="/offres/:id/editer" element={<ProtectedRoute requiredRole="influenceur"><OffreForm /></ProtectedRoute>} />

        <Route path="/parametres" element={<ProtectedRoute><Parametres /></ProtectedRoute>} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
