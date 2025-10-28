import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getSupabase } from '../services/supabaseClient';
import { useAuth } from './useAuth';

type SchoolContextType = {
 escola: any | null;
 usuario: any | null;
 loading: boolean;
 refetch: () => void;
};

const SchoolContext = createContext<SchoolContextType | null>(null);

export const useSchool = () => {
 const ctx = useContext(SchoolContext);
 if (!ctx) throw new Error('useSchool must be used within a SchoolProvider');
 return ctx;
};

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
 const { user } = useAuth();
 const [escola, setEscola] = useState<any | null>(null);
 const [usuario, setUsuario] = useState<any | null>(null);
 const [loading, setLoading] = useState(true);

 const fetchSchoolData = useCallback(async () => {
   const supabase = getSupabase();
   if (!user) {
     setEscola(null);
     setUsuario(null);
     setLoading(false);
     return;
   }
   setLoading(true);
   const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
   setUsuario(perfil ?? null);
   if (perfil?.escola_id) {
     const { data: escolaData } = await supabase.from('escolas').select('*').eq('id', perfil.escola_id).single();
     setEscola(escolaData ?? null);
   } else {
     setEscola(null);
   }
   setLoading(false);
 }, [user]);

 useEffect(() => { fetchSchoolData(); }, [fetchSchoolData]);

 return (
   <SchoolContext.Provider value={{ escola, usuario, loading, refetch: fetchSchoolData }}>
     {children}
   </SchoolContext.Provider>
 );
};

