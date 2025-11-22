import React from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider, useAuth } from "./hooks/useAuth"
import { SchoolProvider } from "./hooks/useSchool"
import { ThemeProvider } from "./hooks/useTheme"
import { ToastProvider } from "./hooks/useToast"
import AuthCallback from "./src/pages/AuthCallback"
import Dashboard from "./src/pages/Dashboard"
import Health from "./src/pages/Health"
import LandingPage from "./src/pages/LandingPage"
import Login from "./src/pages/Login"
import ModelosPage from "./src/pages/modelos/ModelosPage"
import RelatoriosPage from "./src/pages/relatorios/RelatoriosPage"
import NovaAvaliacao from "./src/pages/avaliacoes/NovaAvaliacao"
import NovoPlano from "./src/pages/plano/NovoPlano"

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return null

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/avaliacoes/nova"
        element={
          <RequireAuth>
            <NovaAvaliacao />
          </RequireAuth>
        }
      />
      <Route
        path="/plano-aula/novo"
        element={
          <RequireAuth>
            <NovoPlano />
          </RequireAuth>
        }
      />
      <Route path="/planos/nova" element={<Navigate to="/plano-aula/novo" replace />} />
      <Route
        path="/modelos"
        element={
          <RequireAuth>
            <ModelosPage />
          </RequireAuth>
        }
      />
      <Route
        path="/relatorios"
        element={
          <RequireAuth>
            <RelatoriosPage />
          </RequireAuth>
        }
      />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/health" element={<Health />} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  )
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
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
