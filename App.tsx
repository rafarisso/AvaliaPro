import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { SchoolProvider } from './hooks/useSchool'
import { ThemeProvider } from './hooks/useTheme'
import { ToastProvider } from './hooks/useToast'
import AuthCallback from './src/pages/AuthCallback'
import Dashboard from './src/pages/Dashboard'
import Health from './src/pages/Health'
import LandingPage from './src/pages/LandingPage'
import LoginPage from './src/pages/LoginPage'
import NovaAvaliacao from './src/pages/avaliacoes/NovaAvaliacao'
import NovoPlano from './src/pages/plano/NovoPlano'
import ModelosPage from './src/pages/modelos/ModelosPage'
import RelatoriosPage from './src/pages/relatorios/RelatoriosPage'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-600">
        Carregando...
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/avaliacoes/nova" element={<NovaAvaliacao />} />
      <Route path="/plano-aula/novo" element={<NovoPlano />} />
      <Route path="/modelos" element={<ModelosPage />} />
      <Route path="/relatorios" element={<RelatoriosPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/health" element={<Health />} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SchoolProvider>
            <AppRoutes />
          </SchoolProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}




