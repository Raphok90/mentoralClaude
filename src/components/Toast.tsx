import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type Kind = "success" | "error";
const ToastContext = createContext<(message: string, kind?: Kind) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; kind: Kind } | null>(null);
  const timer = useRef<number>();

  const show = useCallback((message: string, kind: Kind = "success") => {
    setToast({ message, kind });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div
          role="status"
          className={`fixed left-1/2 z-[60] max-w-[calc(100%-32px)] -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium shadow-lg ${
            toast.kind === "error" ? "bg-danger text-white" : "bg-fg text-bg"
          }`}
          style={{ bottom: "calc(88px + env(safe-area-inset-bottom, 0px))" }}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
