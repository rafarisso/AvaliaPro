import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from '../services/supabaseClient';

type AuthContextType = {
  session: Session | null;
  user: any | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
 const ctx = useContext(AuthContext);
 if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
 return ctx;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
 const [session, setSession] = useState<Session | null>(null);
 const [user, setUser] = useState<any | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
   const supabase = getSupabase();
   let mounted = true;

   const init = async () => {
     const { data: { session } } = await supabase.auth.getSession();
     if (!mounted) return;
     setSession(session);
     setUser(session?.user ?? null);
     setLoading(false);
   };
   init();

   const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
     setSession(s);
     setUser(s?.user ?? null);
   });
   return () => {
     mounted = false;
     subscription.unsubscribe();
   };
 }, []);

 const logout = async () => {
   const supabase = getSupabase();
   await supabase.auth.signOut();
   setSession(null);
   setUser(null);
 };

 return (
   <AuthContext.Provider value={{ session, user, loading, logout }}>
     {children}
   </AuthContext.Provider>
 );
};

