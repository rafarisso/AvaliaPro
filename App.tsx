import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { getSupabase } from './services/supabaseClient';
import { User, Escola, Usuario } from './types';

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

// --- Auth Context ---
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    let isMounted = true;
    
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if(isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if(isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    }
  }, []);

  const logout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
  };

  const value = { session, user, loading, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- School Context ---
interface SchoolContextType {
  escola: Escola | null;
  usuario: Usuario | null; // Alterado de 'membro' para 'usuario'
  loading: boolean;
  refetch: () => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [escola, setEscola] = useState<Escola | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSchoolData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setEscola(null);
      setUsuario(null);
      return;
    };
    
    setLoading(true);

    try {
      const supabase = getSupabase();
      // 1. Buscar o perfil do usuário na tabela 'usuarios'
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (usuarioError || !usuarioData) {
        setEscola(null);
        setUsuario(null);
        return; // Usuário pode não ter um perfil ou escola ainda
      }
      
      // FIX: Add explicit type assertion for usuarioData to resolve Supabase type inference issue.
      // This ensures that properties like 'escola_id' are recognized by TypeScript.
      const typedUsuarioData = usuarioData as Usuario;
      setUsuario(typedUsuarioData);

      // 2. Se o usuário tem um escola_id, buscar os dados da escola
      if (typedUsuarioData.escola_id) {
        const { data: escolaData, error: escolaError } = await supabase
          .from('escolas')
          .select('*')
          .eq('id', typedUsuarioData.escola_id)
          .single();
        
        if (escolaError) throw escolaError;
        setEscola(escolaData as Escola | null);
      } else {
        setEscola(null); // Usuário existe mas não está associado a uma escola
      }

    } catch (error) {
      console.error('Error fetching school data:', error);
      setEscola(null);
      setUsuario(null);
    } finally {
        setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSchoolData();
  }, [fetchSchoolData, user]);

  return (
    <SchoolContext.Provider value={{ escola, usuario, loading, refetch: fetchSchoolData }}>
      {children}
    </SchoolContext.Provider>
  );
};


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