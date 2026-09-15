// Hueco neutro para una colección de fotos (tarjetas, galerías…) cuando
// todavía no hay ninguna foto real publicada. Sustituye a la rejilla entera.
export default function EmptyGallery({ message = 'Muy pronto verás aquí nuestras fotos.' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-outline-variant rounded-xl bg-surface-container-low">
      <span className="material-symbols-outlined text-4xl text-outline-variant mb-3" aria-hidden="true">
        image
      </span>
      <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
    </div>
  )
}
