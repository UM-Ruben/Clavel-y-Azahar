import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import Inicio from './pages/Inicio'
import Colecciones from './pages/Colecciones'
import Servicios from './pages/Servicios'
import Contacto from './pages/Contacto'
import Eventos from './pages/Eventos'
import AdminRoute from './admin/AdminRoute'
import DemoLayout from './pages/demo/DemoLayout'
import { ADMIN_PATH } from './config/admin'

function Layout() {
  return (
    <div className="bg-surface text-on-surface antialiased font-body min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}

// Rutas en formato data-router que consume vite-react-ssg para prerenderizar
// cada página como HTML estático en el build.
export const routes = [
  {
    path: '/',
    element: <Layout />,
    entry: 'src/App.jsx',
    children: [
      { index: true, element: <Inicio /> },
      { path: 'colecciones', element: <Colecciones /> },
      { path: 'servicios', element: <Servicios /> },
      { path: 'eventos', element: <Eventos /> },
      { path: 'contacto', element: <Contacto /> },
    ],
  },
  // Panel privado de la dueña. Fuera del Layout para que NO lleve Navbar/Footer.
  // Se renderiza en el cliente (lazy); en el build solo se prerenderiza su
  // pantalla de carga. Bloqueado en robots.txt y marcado noindex.
  {
    path: ADMIN_PATH,
    element: <AdminRoute />,
    entry: 'src/admin/AdminRoute.jsx',
  },
  // Vista de demostración: las mismas páginas, pero con fotos de ejemplo
  // (modo demo, ver src/lib/demoMode.jsx). Solo se registra en desarrollo
  // (`import.meta.env.DEV`), así que el build de producción ni la genera ni
  // la incluye en el bundle — no existe en la web publicada.
  ...(import.meta.env.DEV
    ? [
        {
          path: '/demo',
          element: <DemoLayout />,
          entry: 'src/pages/demo/DemoLayout.jsx',
          children: [
            { index: true, element: <Inicio /> },
            { path: 'colecciones', element: <Colecciones /> },
            { path: 'servicios', element: <Servicios /> },
            { path: 'contacto', element: <Contacto /> },
          ],
        },
      ]
    : []),
]
