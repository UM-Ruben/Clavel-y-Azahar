// Hueco neutro para un espacio de UNA foto (heros, cabeceras…) cuando aún no
// hay una foto real publicada.
// Se coloca dentro del mismo contenedor con aspect-ratio de siempre, así que
// el diseño no se mueve ni un píxel cuando la dueña sube su foto.
//
// Con `loading` en true (todavía se está trayendo la foto de la base de datos)
// se muestra el hueco SIN el icono «image», para que ese recuadro no parpadee
// justo antes de que aparezca la foto. El icono solo se ve cuando ya sabemos
// con seguridad que la sección está vacía.
export default function EmptyPhoto({ className = '', loading = false }) {
  return (
    <div className={`w-full h-full flex items-center justify-center bg-surface-container-high ${className}`}>
      {!loading && (
        <span className="material-symbols-outlined text-4xl text-outline-variant" aria-hidden="true">
          image
        </span>
      )}
    </div>
  )
}
