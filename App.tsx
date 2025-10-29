import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { SchoolProvider } from './hooks/useSchool'
import { ThemeProvider } from './hooks/useTheme'
import { ToastProvider } from './hooks/useToast'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Health from './pages/Health'
import AuthCallback from './pages/AuthCallback'

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/auth/callback', element: <AuthCallback /> },
  { path: '/login', element: <Login /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/health', element: <Health /> },
])

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SchoolProvider>
            <RouterProvider router={router} />
          </SchoolProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}




