import { Link } from 'react-router-dom'
import { site } from '../config/site'
import Seo from '../components/Seo'
import { usePhotos, photosOr, firstPhotoUrl, firstPhotoAlt, useContent } from '../lib/content'
import { textDefaults } from '../lib/textDefaults'
import EmptyGallery from '../components/EmptyGallery'
import SmartImage from '../components/SmartImage'
import { getGallerySection } from '../config/gallery'

const HERO_ASPECT = getGallerySection('inicio_hero').aspect
const FEATURED_ASPECT = getGallerySection('inicio_destacados').aspect

export default function Inicio() {
  const { photos: heroPhotos, loading: heroLoading } = usePhotos('inicio_hero')
  const { photos: destacados } = usePhotos('inicio_destacados')
  const heroTitulo = useContent('inicio_hero_titulo', textDefaults.inicio_hero_titulo)
  const heroTexto = useContent('inicio_hero_texto', textDefaults.inicio_hero_texto)
  const heroImg = firstPhotoUrl(heroPhotos)
  const heroAlt = firstPhotoAlt(heroPhotos, `Arreglo floral artesanal de ${site.name}`)
  const featured = photosOr(destacados)

  return (
    <div className="pt-32">
      <Seo
        title={`Floristería en ${site.address.district}, ${site.address.city} | ${site.name}`}
        description={`Floristería boutique en ${site.address.district}, ${site.address.city}. Ramos de temporada, centros de mesa, plantas y flores para bodas y eventos.`}
        path="/"
      />
      {/* Hero */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-section-gap">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-start">
          {/* Text */}
          <div className="md:col-span-5 space-y-8 md:pt-4">
            <p className="font-label-sm text-label-sm text-on-tertiary-container uppercase tracking-[0.15em]">
              Floristería artesanal · {site.address.district}, {site.address.city}
            </p>
            <h1 className="font-headline text-5xl md:text-7xl text-primary leading-tight">
              {renderMultiline(heroTitulo)}
            </h1>
            <p className="text-lg text-on-surface-variant max-w-md whitespace-pre-line">{heroTexto}</p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/colecciones"
                className="bg-primary text-on-primary px-8 py-4 uppercase tracking-widest text-xs font-semibold hover:bg-surface-tint transition-colors duration-300"
              >
                Ver colecciones
              </Link>
              <Link
                to="/contacto"
                className="border border-on-tertiary-container text-primary px-8 py-4 uppercase tracking-widest text-xs font-semibold hover:bg-surface-container-high transition-colors duration-300"
              >
                Visítanos
              </Link>
            </div>
          </div>

          {/* Hero image */}
          <div className="md:col-span-7">
            <div style={{ aspectRatio: String(HERO_ASPECT) }} className="aspect-[4/5] overflow-hidden border border-on-tertiary-container/30 bg-surface-container-high relative">
              <SmartImage
                className="w-full h-full object-cover"
                alt={heroAlt}
                src={heroImg}
                pending={heroLoading}
                width="800"
                height="1000"
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
              {heroImg && (
                <div className="absolute bottom-5 right-5 bg-surface/90 border border-on-tertiary-container px-5 py-3">
                  <p className="text-xs uppercase tracking-widest text-primary">Colección viva</p>
                  <p className="font-headline text-xl text-on-tertiary-container">Tonos crema y verde</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto pb-section-gap">
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-headline text-4xl text-primary max-w-lg">
            Destacados del escaparate
          </h2>
          <Link
            to="/colecciones"
            className="hidden md:block text-xs uppercase tracking-widest border-b border-on-tertiary-container text-primary hover:text-on-tertiary-container transition-colors"
          >
            Ver catálogo visual
          </Link>
        </div>

        {featured.length === 0 ? (
          <EmptyGallery message="Muy pronto verás aquí los destacados del escaparate." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {featured.map((item, i) => (
              <Link to="/colecciones" key={item.title || i} className="group cursor-pointer block">
                <div style={{ aspectRatio: String(FEATURED_ASPECT) }} className="aspect-[4/5] overflow-hidden bg-surface-container-high mb-5">
                  <SmartImage
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    alt={item.alt}
                    src={item.img}
                    width="800"
                    height="1000"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <h3 className="font-headline text-3xl text-primary">{item.title}</h3>
                {item.desc && <p className="text-on-surface-variant mt-2">{item.desc}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// Convierte saltos de línea (\n) en <br/> para títulos de varias líneas.
function renderMultiline(text) {
  return String(text).split('\n').map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </span>
  ))
}
