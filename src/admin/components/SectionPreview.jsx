// Vista previa de "cómo se verá en la web". Reproduce a tamaño reducido el
// mismo recorte, forma y textos superpuestos que usa la página pública real
// para esta sección (ver src/pages/Inicio.jsx, Colecciones.jsx, Servicios.jsx
// y Contacto.jsx), para que la dueña vea el encuadre antes de publicar la foto.
export default function SectionPreview({ sectionKey, page, imageUrl, fields = {} }) {
  return (
    <div>
      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
        Así se ve en la web{page ? ` · ${page}` : ''}
      </p>
      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 flex justify-center">
        {variant(sectionKey, imageUrl, fields)}
      </div>
    </div>
  )
}

function Placeholder({ className = '' }) {
  return (
    <div className={`w-full h-full flex items-center justify-center text-outline bg-surface-container-high ${className}`}>
      <span className="material-symbols-outlined text-2xl" aria-hidden="true">image</span>
    </div>
  )
}

function Photo({ src, className }) {
  return src ? <img src={src} alt="" className={className} /> : <Placeholder className={className} />
}

function variant(key, img, { title, desc, badge } = {}) {
  switch (key) {
    case 'inicio_hero':
      return (
        <div className="relative w-52 aspect-[4/5] overflow-hidden border border-on-tertiary-container/30 bg-surface-container-high">
          <Photo src={img} className="w-full h-full object-cover" />
          <div className="absolute bottom-2 right-2 bg-surface/90 border border-on-tertiary-container px-2.5 py-1.5">
            <p className="text-[8px] uppercase tracking-widest text-primary">Colección viva</p>
            <p className="font-headline text-xs text-on-tertiary-container">Tonos crema y verde</p>
          </div>
        </div>
      )

    case 'inicio_destacados':
      return (
        <div className="w-36">
          <div className="aspect-[4/5] overflow-hidden bg-surface-container-high mb-2">
            <Photo src={img} className="w-full h-full object-cover" />
          </div>
          <p className="font-headline text-base text-primary truncate">{title || 'Título del ramo'}</p>
          {desc ? <p className="text-on-surface-variant text-[11px] mt-0.5 line-clamp-2">{desc}</p> : null}
        </div>
      )

    case 'colecciones_temporada':
      return (
        <div className="w-36">
          <div className="relative aspect-[4/5] overflow-hidden bg-surface-container-low mb-2">
            <Photo src={img} className="w-full h-full object-cover" />
            {badge ? (
              <div className="absolute top-2 right-2 bg-[#fecbcb] text-[#061b0e] text-[9px] font-semibold px-2 py-1 rounded-xl">
                {badge}
              </div>
            ) : null}
          </div>
          <p className="font-headline-md text-sm text-primary text-center">{title || 'Título de la colección'}</p>
        </div>
      )

    case 'colecciones_centros':
      return (
        <div className="w-64 flex gap-3 items-center bg-surface-container-low p-3 rounded-DEFAULT border-[0.5px] border-outline-variant">
          <div className="relative w-1/2 aspect-square overflow-hidden shrink-0">
            <Photo src={img} className="w-full h-full object-cover" />
          </div>
          <div className="w-1/2 min-w-0">
            <p className="font-headline-md text-sm text-primary mb-1 truncate">{title || 'Nombre del centro'}</p>
            {desc ? <p className="text-on-surface-variant text-[10px] line-clamp-3">{desc}</p> : null}
          </div>
        </div>
      )

    case 'colecciones_exoticas':
      return (
        <div className="w-28 text-center">
          <div className="relative aspect-square overflow-hidden rounded-full border border-outline-variant mb-2 mx-auto w-4/5">
            <Photo src={img} className="w-full h-full object-cover" />
          </div>
          <p className="font-body-lg text-sm text-primary font-semibold truncate">{title || 'Nombre de la planta'}</p>
        </div>
      )

    case 'servicios_hero':
      return (
        <div className="relative w-64 aspect-[16/9] overflow-hidden bg-surface-container-high">
          <Photo src={img} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="font-display-lg text-sm text-surface-bright drop-shadow-md italic opacity-80">
              (título y texto se editan en «Textos»)
            </p>
          </div>
        </div>
      )

    case 'servicios_bodas':
      return (
        <div className="w-44 aspect-[4/5] overflow-hidden">
          <Photo src={img} className="w-full h-full object-cover" />
        </div>
      )

    case 'servicios_taller':
      return (
        <div className="w-44 aspect-square overflow-hidden">
          <Photo src={img} className="w-full h-full object-cover" />
        </div>
      )

    case 'contacto_local':
      return (
        <div className="relative w-64 aspect-[4/3] bg-surface-container overflow-hidden">
          <Photo src={img} className="w-full h-full object-cover" />
          <div className="absolute inset-0 border border-on-tertiary-container/20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="bg-surface rounded-full p-2 shadow-lg border border-outline-variant/20">
              <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                location_on
              </span>
            </div>
          </div>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-surface/90 text-primary text-[9px] uppercase tracking-widest px-2.5 py-1.5 border border-on-tertiary-container/40">
            <span className="material-symbols-outlined text-xs" aria-hidden="true">directions</span>
            Cómo llegar
          </span>
        </div>
      )

    default:
      return null
  }
}
