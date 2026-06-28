import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const notify = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((items) => [...items, { id, message, type }]);
    setTimeout(() => setToasts((items) => items.filter((toast) => toast.id !== id)), 3500);
  }, []);
  const value = useMemo(() => ({ notify }), [notify]);
  return <ToastContext.Provider value={value}>{children}<div className="toast-stack" aria-live="polite">
    {toasts.map((toast) => <div className={`toast ${toast.type}`} key={toast.id}>
      {toast.type === "error" ? <CircleAlert /> : <CheckCircle2 />}<span>{toast.message}</span>
      <button aria-label="Dismiss notification" onClick={() => setToasts((items) => items.filter((x) => x.id !== toast.id))}><X /></button>
    </div>)}
  </div></ToastContext.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);
