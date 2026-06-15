import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App.jsx'
import './index.css'

// vite-react-ssg monta la app en el cliente y la prerenderiza en el build.
export const createRoot = ViteReactSSG({ routes })
