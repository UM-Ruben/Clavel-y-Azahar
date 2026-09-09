// Avisos emergentes (éxito / error) para el panel. Uso: const toast = useToast()
// y luego toast.ok('Guardado') o toast.error('No se pudo guardar').
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const push = useCallback((type, message) => {
    const id = `${Date.now()}-${Math.random()}`
    setItems((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const api = useMemo(() => ({
    ok: (m) => push('ok', m),
    error: (m) => push('error', m),
  }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 max-w-sm">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`px-5 py-4 rounded-lg shadow-lg text-sm font-body-md border ${
              t.type === 'ok'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-error-container text-on-error-container border-error/30'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
