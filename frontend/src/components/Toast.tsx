import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Check, X } from 'lucide-react';

type ToastKind = 'success' | 'error';
type ToastValue = { message: string; kind: ToastKind } | null;
type ToastContextValue = { showToast: (message: string, kind?: ToastKind) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastValue>(null);
  const showToast = (message: string, kind: ToastKind = 'success') => setToast({ message, kind });
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 3800); return () => window.clearTimeout(timer); }, [toast]);
  return <ToastContext.Provider value={{ showToast }}>{children}{toast && <div className={`toast toast-${toast.kind}`} role="status"><span>{toast.kind === 'success' ? <Check size={16}/> : <X size={16}/>}</span><p>{toast.message}</p><button title="Dismiss" onClick={() => setToast(null)}><X size={14}/></button></div>}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
