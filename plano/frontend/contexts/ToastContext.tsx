// src/contexts/ToastContext.tsx
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Toast = { id: string; type?: "info" | "success" | "warning" | "error"; message: string; timeoutMs?: number; };
export type ToastContextValue = { toasts: Toast[]; addToast: (t: Omit<Toast,"id">) => void; removeToast: (id: string) => void; clear: () => void; };

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
export function useToast(){ const ctx = useContext(ToastContext); if(!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>"); return ctx; }

export function ToastProvider({children}:{children: React.ReactNode}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const removeToast = useCallback((id:string)=>setToasts(p=>p.filter(t=>t.id!==id)),[]);
  const addToast = useCallback((t:Omit<Toast,"id">)=>{
    const id=`${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toast:Toast={id,type:"info",timeoutMs:3500,...t};
    setToasts(p=>[toast,...p]);
    if(toast.timeoutMs) setTimeout(()=>removeToast(id), toast.timeoutMs);
  },[removeToast]);
  const clear = useCallback(()=>setToasts([]),[]);
  const value = useMemo(()=>({toasts,addToast,removeToast,clear}),[toasts,addToast,removeToast,clear]);

  return (
    <ToastContext.Provider value={value}>
      <div style={{position:"fixed",right:16,top:16,display:"flex",flexDirection:"column",gap:8,zIndex:9999}}>
        {toasts.map(t=>(
          <div key={t.id} onClick={()=>removeToast(t.id)}
            style={{background:t.type==="success"?"#2e7d32":t.type==="warning"?"#ed6c02":t.type==="error"?"#c62828":"#0277bd",
                    color:"#fff",padding:"10px 12px",borderRadius:8,boxShadow:"0 6px 16px rgba(0,0,0,.22)",cursor:"pointer",
                    minWidth:240,maxWidth:420}}>
            {t.message}
          </div>
        ))}
      </div>
      {children}
    </ToastContext.Provider>
  );
}
