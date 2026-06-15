// Punto de entrada de la ruta /admin. Carga el panel de forma diferida (lazy)
// para que su código NO forme parte del paquete de la web pública.
import { lazy, Suspense } from 'react'

const AdminApp = lazy(() => import('./AdminApp'))

export default function AdminRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center font-body text-on-surface-variant">
          Cargando panel…
        </div>
      }
    >
      <AdminApp />
    </Suspense>
  )
}
