// Hueco neutro para un espacio de UNA foto (heros, cabeceras…) cuando aún no
// hay foto real subida y no estamos en modo demo (ver src/lib/demoMode.jsx).
// Se coloca dentro del mismo contenedor con aspect-ratio de siempre, así que
// el diseño no se mueve ni un píxel cuando la dueña sube su foto.
export default function EmptyPhoto({ className = '' }) {
  return (
    <div className={`w-full h-full flex items-center justify-center bg-surface-container-high ${className}`}>
      <span className="material-symbols-outlined text-4xl text-outline-variant" aria-hidden="true">
        image
      </span>
    </div>
  )
}
