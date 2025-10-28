import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './hooks/useAuth.tsx';
import { SchoolProvider, useSchool } from './hooks/useSchool.tsx';

import AppLayout from './components/layout/AppLayout.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import GerarRelatorio from './pages/GerarRelatorio.tsx';
import GerarPlano from './pages/GerarPlano.tsx';
import GerarApresentacao from './pages/GerarApresentacao.tsx';
import Turmas from './pages/Turmas.tsx';
import Alunos from './pages/Alunos.tsx';
import Avaliacoes from './pages/Avaliacoes.tsx';
import Configuracoes from './pages/Configuracoes.tsx';
import Assinatura from './pages/Assinatura.tsx';
import LandingPage from './pages/LandingPage.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { ToastProvider } from './hooks/useToast.tsx';
import Onboarding from './pages/Onboarding.tsx';
import { Spinner } from './components/ui/Spinner.tsx';
import { ThemeProvider } from './hooks/useTheme.tsx';

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
