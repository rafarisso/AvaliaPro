import React, { createContext, useContext, useState, ReactNode } from 'react';

type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' };
type ToastContextType = {
 toasts: Toast[];
 showToast: (message: string, type?: Toast['type']) => void;
 removeToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
 const ctx = useContext(ToastContext);
 if (!ctx) throw new Error('useToast must be used within a ToastProvider');
 return ctx;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
 const [toasts, setToasts] = useState<Toast[]>([]);

 const showToast = (message: string, type: Toast['type'] = 'info') => {
   const t: Toast = { id: Date.now(), message, type };
   setToasts(prev => [...prev, t]);
   setTimeout(() => removeToast(t.id), 4000);
 };
 const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

 return (
   <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
     {children}
   </ToastContext.Provider>
 );
};

