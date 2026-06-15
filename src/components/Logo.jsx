// Logotipo de la marca: emblema botánico de la dueña en line-art monocromo verde,
// para encajar con la estética de línea elegante del sitio (espíritu del logo 1).
// Es un SVG vectorial (escala nítido a cualquier tamaño) trazado del original a
// color (public/logo-orginal2.png): se redujo a una sola tinta separando el clavel
// por canal de color para que salga en contorno y no como mancha. Pesa ~53 KB.
// El emblema ya incluye el nombre, por eso en Navbar/Footer va solo.
export default function Logo({ className }) {
  return (
    <img
      src="/logo-emblema.svg"
      alt="Clavel y Azahar"
      className={className}
      width="256"
      height="256"
      decoding="async"
    />
  )
}
