import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeContextType = {
 theme: 'light' | 'dark';
 toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
 const ctx = useContext(ThemeContext);
 if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
 return ctx;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
 const [theme, setTheme] = useState<'light' | 'dark'>( (localStorage.getItem('theme') as any) || 'light' );
 useEffect(() => {
   document.documentElement.classList.toggle('dark', theme === 'dark');
   localStorage.setItem('theme', theme);
 }, [theme]);
 const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
 return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

