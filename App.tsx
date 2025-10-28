import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { AuthProvider } from './hooks/useAuth';
import { SchoolProvider } from './hooks/useSchool';
import { useAuth } from './hooks/useAuth';
import { useSchool } from './hooks/useSchool';

import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import GerarRelatorio from './pages/GerarRelatorio';
import GerarPlano from './pages/GerarPlano';
import GerarApresentacao from './pages/GerarApresentacao';
import Turmas from './pages/Turmas';
import Alunos from './pages/Alunos';
import Avaliacoes from './pages/Avaliacoes';
import Configuracoes from './pages/Configuracoes';
import Assinatura from './pages/Assinatura';
import LandingPage from './pages/LandingPage';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './hooks/useToast';
import Onboarding from './pages/Onboarding';
import { Spinner } from './components/ui/Spinner';
import { ThemeProvider } from './hooks/useTheme';

const AppRoutes: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <div className="flex h-screen w-screen items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <Routes>
      <Route path="/" element={!session ? <LandingPage /> : <Navigate to="/dashboard" />} />
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!session ? <Register /> : <Navigate to="/dashboard" />} />
      <Route
        path="/*"
        element={
          session ? (
            <AppContent />
          ) : (
            <Navigate to="/login" state={{ from: location }} replace />
          )
        }
      />
    </Routes>
  );
};

const AppContent: React.FC = () => {
    const { escola, loading: schoolLoading, refetch } = useSchool();

    if (schoolLoading) {
        return <div className="flex h-screen w-screen items-center justify-center"><Spinner size="lg" /></div>;
    }

    if (!escola) {
        return <Onboarding onSchoolCreated={refetch} />;
    }

    return (
        <AppLayout>
            <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/relatorios" element={<GerarRelatorio />} />
                <Route path="/planos" element={<GerarPlano />} />
                <Route path="/apresentacoes" element={<GerarApresentacao />} />
                <Route path="/turmas" element={<Turmas />} />
                <Route path="/alunos" element={<Alunos />} />
                <Route path="/avaliacoes" element={<Avaliacoes />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/assinatura" element={<Assinatura />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </AppLayout>
    );
};


const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ThemeProvider>
            <AuthProvider>
                <SchoolProvider>
                    <AppRoutes />
                </SchoolProvider>
            </AuthProvider>
        </ThemeProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;