// Pestaña «Galería»: zonas de imagen fijas de la web (cabeceras, destacados…).
// Los apartados de "Nuestras Colecciones" —cuya cantidad, título y descripción
// elige la dueña— se gestionan aparte, en la pestaña «Colecciones» (ver
// CollectionsAdmin.jsx), aunque ambas pestañas comparten el mismo editor de
// fotos (PhotoZoneEditor).
import { useMemo, useState } from 'react'
import { GALLERY_SECTIONS } from '../../config/gallery'
import PhotoZoneEditor from '../components/PhotoZoneEditor'

export default function GalleryAdmin() {
  const groups = useMemo(() => {
    const grouped = new Map()
    for (const section of GALLERY_SECTIONS) {
      if (!grouped.has(section.group)) grouped.set(section.group, [])
      grouped.get(section.group).push(section)
    }
    return [...grouped.entries()]
  }, [])
  const [active, setActive] = useState(GALLERY_SECTIONS[0].key)
  const section = GALLERY_SECTIONS.find((item) => item.key === active)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[224px_1fr] gap-6">
      <aside className="lg:border-r lg:border-outline-variant lg:pr-4">
        <nav className="flex lg:flex-col gap-3 lg:gap-5 overflow-x-auto lg:overflow-visible pb-2" aria-label="Zonas de imágenes">
          {groups.map(([group, sections]) => (
            <div key={group} className="shrink-0 min-w-44 lg:min-w-0">
              <p className="font-label-sm text-label-sm text-on-tertiary-container uppercase tracking-wider mb-2">{group}</p>
              <div className="flex flex-col gap-1">
                {sections.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActive(item.key)}
                    aria-current={active === item.key ? 'page' : undefined}
                    className={`min-h-11 text-left px-3 py-2 rounded-lg font-body-md text-sm leading-snug transition-colors ${
                      active === item.key ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <PhotoZoneEditor key={active} section={section} />
    </div>
  )
}
