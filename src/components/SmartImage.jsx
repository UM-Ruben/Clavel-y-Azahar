// <img> que degrada con elegancia. Si la foto no existe (src vacío) o falla al
// cargar —el caso típico: la dueña borró el archivo del Storage de Supabase
// pero la web aún tenía guardada su URL— muestra un hueco neutro en vez del
// feo icono de «imagen rota» del navegador. Así la web nunca queda mal por una
// foto que ya no está. El hueco es el mismo EmptyPhoto que se usa cuando aún no
// hay foto subida, salvo que el llamante pase su propio `fallback`.
//
// `pending` (true mientras la foto se está trayendo de la base de datos) se
// pasa al hueco por defecto para que NO enseñe el icono «image» durante la
// precarga: se ve un hueco neutro y, en cuanto llega la foto, solo la foto.
// (Se llama `pending` y no `loading` para no chocar con el atributo nativo
// `loading="lazy"/"eager"` de <img>, que se sigue reenviando vía imgProps.)
import { useState, useEffect } from 'react'
import EmptyPhoto from './EmptyPhoto'

export default function SmartImage({ src, fallback, pending = false, ...imgProps }) {
  const [failed, setFailed] = useState(false)

  // Si cambia la foto, olvidamos el error anterior y reintentamos cargarla.
  useEffect(() => setFailed(false), [src])

  if (!src || failed) return fallback ?? <EmptyPhoto loading={pending} />
  return <img src={src} onError={() => setFailed(true)} {...imgProps} />
}
