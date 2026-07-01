// ============================================================================
//  MODO DEMO  —  activa las fotos de ejemplo SOLO en /demo (ver src/pages/Demo)
// ----------------------------------------------------------------------------
//  La web real (Inicio, Colecciones, Servicios, Contacto) nunca debe enseñar
//  fotos de mentira a un visitante de verdad: si la dueña aún no ha subido su
//  foto, se ve un hueco neutro. La ruta /demo (solo existe con `pnpm dev`,
//  nunca en el build de producción — ver src/App.jsx) envuelve las mismas
//  páginas con este contexto a `true` para poder enseñar el diseño ya
//  «relleno» de fotos de ejemplo, sin tocar el código de cada página.
// ============================================================================
import { createContext, useContext } from 'react'

const DemoModeContext = createContext(false)

export function DemoModeProvider({ children }) {
  return <DemoModeContext.Provider value={true}>{children}</DemoModeContext.Provider>
}

export function useDemoMode() {
  return useContext(DemoModeContext)
}
