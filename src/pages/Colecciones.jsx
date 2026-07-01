import { Link } from 'react-router-dom'
import { site } from '../config/site'
import Seo from '../components/Seo'
import { usePhotos, photosOr, useContent } from '../lib/content'
import { textDefaults } from '../lib/textDefaults'
import { useDemoMode } from '../lib/demoMode'
import EmptyGallery from '../components/EmptyGallery'
import SmartImage from '../components/SmartImage'

// Imágenes de ejemplo autoalojadas en /public/demo (ver nota en Inicio.jsx:
// antes enlazaban a previsualizaciones internas de Google poco fiables).
const temporadaCards = [
  {
    img: '/demo/colecciones-temporada-despertar-primavera.jpg',
    alt: 'Ramo despertar de primavera',
    badge: 'De temporada',
    title: 'Despertar de Primavera',
  },
  {
    img: '/demo/colecciones-temporada-cosecha-otono.jpg',
    alt: 'Arreglo de cosecha de otoño',
    badge: null,
    title: 'Cosecha de Otoño',
  },
  {
    img: '/demo/colecciones-temporada-pradera-silvestre.jpg',
    alt: 'Ramo de pradera silvestre',
    badge: null,
    title: 'Pradera Silvestre',
  },
]

const centerpieces = [
  {
    img: '/demo/colecciones-centro-gran-finca.jpg',
    alt: 'Centro de mesa elegante para comedor',
    title: 'La Gran Finca',
    desc: 'Un arreglo bajo y lujoso perfecto para cenas íntimas, con hortensias y verdes colgantes.',
  },
  {
    img: '/demo/colecciones-centro-minimo-escultorico.jpg',
    alt: 'Centro de mesa minimalista moderno',
    title: 'Mínimo Escultórico',
    desc: 'Centrado en siluetas llamativas y espacio negativo, esta pieza arquitectónica llama la atención.',
  },
]

const exoticas = [
  {
    img: '/demo/colecciones-exotica-monstera-albo.jpg',
    alt: 'Monstera Deliciosa',
    title: 'Monstera Albo',
  },
  {
    img: '/demo/colecciones-exotica-paphiopedilum.jpg',
    alt: 'Orquídea rara',
    title: 'Paphiopedilum',
  },
  {
    img: '/demo/colecciones-exotica-anthurium-terciopelo.jpg',
    alt: 'Anthurium Clarinervium',
    title: 'Anthurium Terciopelo',
  },
]

export default function Colecciones() {
  const demoMode = useDemoMode()
  const { photos: temporadaDb } = usePhotos('colecciones_temporada')
  const { photos: centrosDb } = usePhotos('colecciones_centros')
  const { photos: exoticasDb } = usePhotos('colecciones_exoticas')
  const intro = useContent('colecciones_intro', textDefaults.colecciones_intro)

  const temporada = photosOr(temporadaDb, temporadaCards, demoMode)
  const centros = photosOr(centrosDb, centerpieces, demoMode)
  const plantas = photosOr(exoticasDb, exoticas, demoMode)

  return (
    <div className="pt-32 pb-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
      <Seo
        title={`Colecciones de ramos, centros y plantas | ${site.name}`}
        description={`Ramos de temporada, centros de mesa y plantas exóticas hechos a mano en nuestra floristería de ${site.address.city}.`}
        path="/colecciones"
      />
      {/* Page header */}
      <div className="text-center mb-24">
        <h1 className="font-display-lg text-display-lg text-primary mb-6">Nuestras Colecciones</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto whitespace-pre-line">
          {intro}
        </p>
        <div className="h-[0.5px] w-24 bg-on-tertiary-container mx-auto mt-12" />
      </div>

      {/* Ramos de Temporada */}
      <section className="mb-section-gap">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-12 flex items-center gap-4">
          Ramos de Temporada
          <span className="h-[0.5px] flex-grow bg-outline-variant" />
        </h2>
        {temporada.length === 0 ? (
          <EmptyGallery message="Muy pronto verás aquí los ramos de temporada." />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-gutter gap-y-16">
          {temporada.map((card, i) => (
            <Link to="/contacto" key={card.title || i} className="group cursor-pointer block">
              <div className="relative aspect-[4/5] overflow-hidden bg-surface-container-low mb-6">
                <SmartImage
                  alt={card.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={card.img}
                  width="800"
                  height="1000"
                  loading="lazy"
                  decoding="async"
                />
                {card.badge && (
                  <div className="absolute top-4 right-4 bg-[#fecbcb] text-[#061b0e] font-label-sm text-label-sm px-4 py-2 rounded-xl">
                    {card.badge}
                  </div>
                )}
              </div>
              <div className="text-center">
                <h3 className="font-headline-md text-[24px] leading-[32px] text-primary mb-2">
                  {card.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
        )}
      </section>

      {/* Centros de Mesa */}
      <section className="mb-section-gap">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-12 flex items-center gap-4">
          Centros de Mesa
          <span className="h-[0.5px] flex-grow bg-outline-variant" />
        </h2>
        {centros.length === 0 ? (
          <EmptyGallery message="Muy pronto verás aquí los centros de mesa." />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-gutter gap-y-16">
          {centros.map((c, i) => (
            <div
              key={c.title || i}
              className="group flex flex-col md:flex-row gap-8 items-center bg-surface-container-low p-8 rounded-DEFAULT border-[0.5px] border-outline-variant hover:shadow-[0_8px_30px_rgba(6,27,14,0.05)] transition-all duration-300"
            >
              <div className="relative w-full md:w-1/2 aspect-square overflow-hidden">
                <SmartImage
                  alt={c.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={c.img}
                  width="800"
                  height="800"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="w-full md:w-1/2 text-left">
                <h3 className="font-headline-md text-headline-md text-primary mb-4">{c.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-6 line-clamp-3">
                  {c.desc}
                </p>
                <Link
                  to="/contacto"
                  className="inline-block bg-primary text-on-primary font-label-sm text-label-sm px-6 py-3 uppercase tracking-widest hover:bg-surface-tint transition-colors"
                >
                  Consultar
                </Link>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>

      {/* Plantas Exóticas */}
      <section>
        <h2 className="font-headline-lg text-headline-lg text-primary mb-12 flex items-center gap-4">
          Plantas Exóticas
          <span className="h-[0.5px] flex-grow bg-outline-variant" />
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-gutter gap-y-12">
          {plantas.map((p, i) => (
            <Link to="/contacto" key={p.title || i} className="group cursor-pointer text-center block">
              <div className="relative aspect-square overflow-hidden rounded-full border border-outline-variant mb-6 mx-auto w-4/5">
                <SmartImage
                  alt={p.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src={p.img}
                  width="400"
                  height="400"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h3 className="font-body-lg text-body-lg text-primary font-semibold mb-1">{p.title}</h3>
            </Link>
          ))}

          {/* View all */}
          <Link to="/contacto" className="group cursor-pointer text-center block">
            <div className="relative aspect-square overflow-hidden rounded-full border border-outline-variant mb-6 mx-auto w-4/5 flex items-center justify-center bg-surface-container">
              <span className="material-symbols-outlined text-4xl text-outline-variant" aria-hidden="true">
                arrow_forward
              </span>
            </div>
            <h3 className="font-body-lg text-body-lg text-primary font-semibold mb-1">
              Ver todas las plantas
            </h3>
            <p className="font-body-md text-body-md text-surface-tint">Consúltanos</p>
          </Link>
        </div>
      </section>
    </div>
  )
}
