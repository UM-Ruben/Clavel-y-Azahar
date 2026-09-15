import { useState } from 'react'
import { Link } from 'react-router-dom'
import { site } from '../config/site'
import Seo from '../components/Seo'
import { usePhotos, photosOr, useContent, useCollections } from '../lib/content'
import { collectionCategory } from '../lib/collections'
import { textDefaults } from '../lib/textDefaults'
import EmptyGallery from '../components/EmptyGallery'
import SmartImage from '../components/SmartImage'

const INITIAL_VISIBLE = 12

export default function Colecciones() {
  const { collections: collectionsDb } = useCollections()
  const intro = useContent('colecciones_intro', textDefaults.colecciones_intro)
  const collections = collectionsDb || []

  return (
    <div className="pt-32 pb-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
      <Seo
        title={`Colecciones de ramos, centros y plantas | ${site.name}`}
        description={`Ramos de temporada, centros de mesa y plantas exóticas hechos a mano en nuestra floristería de ${site.address.city}.`}
        path="/colecciones"
      />
      {/* Page header */}
      <div className="text-center mb-24">
        <h1 className="font-headline text-4xl leading-tight text-primary mb-6 md:font-display-lg md:text-display-lg">Nuestras Colecciones</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto whitespace-pre-line">
          {intro}
        </p>
        <div className="h-[0.5px] w-24 bg-on-tertiary-container mx-auto mt-12" />
      </div>

      {collections.length === 0 ? (
        <EmptyGallery message="Muy pronto verás aquí nuestras colecciones." />
      ) : (
        collections.map((collection) => <CollectionSection key={collection.id} collection={collection} />)
      )}
    </div>
  )
}

function CollectionSection({ collection }) {
  const [visible, setVisible] = useState(INITIAL_VISIBLE)
  const { photos: photosDb } = usePhotos(collectionCategory(collection.id))
  const photos = photosOr(photosDb)

  return (
    <section className="mb-section-gap last:mb-0">
      <h2 className="font-headline text-3xl leading-tight text-primary mb-4 flex min-w-0 items-center gap-4 md:font-headline-lg md:text-headline-lg">
        <span className="min-w-0 break-words">{collection.title}</span>
        <span className="h-[0.5px] flex-grow bg-outline-variant" />
      </h2>
      {collection.description && (
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mb-12 whitespace-pre-line">
          {collection.description}
        </p>
      )}
      {photos.length === 0 ? (
        <EmptyGallery message="Muy pronto verás aquí las fotos de este apartado." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-gutter gap-y-16">
          {photos.slice(0, visible).map((photo, index) => (
            <Link to="/contacto" key={photo.img || index} className="group cursor-pointer block">
              <div className="relative aspect-[4/5] overflow-hidden bg-surface-container-low">
                <SmartImage
                  alt={photo.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={photo.img}
                  width="800"
                  height="1000"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
      <ShowMore visible={visible} total={photos.length} onClick={() => setVisible((value) => value + INITIAL_VISIBLE)} />
    </section>
  )
}

function ShowMore({ visible, total, onClick }) {
  if (visible >= total) return null
  return (
    <div className="flex justify-center mt-12">
      <button type="button" onClick={onClick}
        className="min-h-11 px-7 py-3 border border-primary text-primary font-label-sm text-label-sm uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors">
        Ver más
      </button>
    </div>
  )
}
