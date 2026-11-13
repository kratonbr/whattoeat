"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ToastContext = createContext(null);

export function useAdminToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useAdminToast deve ser usado dentro de AdminToastProvider.");
  return context;
}

export default function AdminToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const lastToast = useRef(null);
  const timer = useRef(null);

  const dismissToast = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    lastToast.current = null;
    setToast(null);
  }, []);

  const showToast = useCallback((message, severity = "error") => {
    const text = String(message ?? "").trim();
    if (!text) return;
    const signature = `${severity}:${text}`;
    if (lastToast.current === signature) return;
    if (timer.current) clearTimeout(timer.current);
    lastToast.current = signature;
    setToast({ message: text, severity });
    timer.current = severity === "success" ? setTimeout(() => {
      timer.current = null;
      lastToast.current = null;
      setToast(null);
    }, 4000) : null;
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {toast && <div className="pointer-events-none fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-md sm:right-6 sm:top-6" lang="pt-BR">
        <div className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl ${toast.severity === "success" ? "border-[#BFD4BC] bg-[#F1F7EE] text-[#254936]" : toast.severity === "warning" ? "border-[#E8D7A8] bg-[#FFF9E8] text-[#66552D]" : "border-[#EACFC3] bg-[#FFF8F4] text-[#8D432D]"}`} role={toast.severity === "error" ? "alert" : undefined} aria-live={toast.severity === "error" ? "assertive" : "polite"}>
          <span aria-hidden="true" className="mt-0.5 text-lg font-black">{toast.severity === "success" ? "✓" : toast.severity === "warning" ? "!" : "×"}</span>
          <p className="min-w-0 flex-1 text-sm font-semibold leading-5">{toast.message}</p>
          <button type="button" onClick={dismissToast} aria-label="Fechar notificação" className="grid size-8 shrink-0 place-items-center rounded-full text-lg hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current">×</button>
        </div>
      </div>}
    </ToastContext.Provider>
  );
}
