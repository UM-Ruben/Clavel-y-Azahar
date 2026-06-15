import { Link } from 'react-router-dom'
import { site } from '../config/site'
import Seo from '../components/Seo'
import { usePhotos, photosOr, firstPhotoUrl, useContent } from '../lib/content'
import { textDefaults } from '../lib/textDefaults'

// Imagen por defecto del hero (se usa si la dueña no ha subido la suya).
const INICIO_HERO_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBxmqzgp6UVSs5hIeIgoyxFS95JgyoXkJQXhZ8-HGHDO8pez5wJ3M54i3iimZ9SnInVG6X4KM8lJAqLaGpZ5yr_x2JsJTGF96SL4xFabAh8HXoPKuzfWHhaCp5VXxMEIYKre15pXV-fmWR9VQSvnh5yVs3NDnmrvIGjZdnye6Di4bqIqzUMIvBKRk6b1VAV0Z29nCM_ieXsUPvPrK84TgKzqzYnQ18MP_3Rx8mIkDla6H47L_8xDsdj2OBU-GvvefTYpyCUykapzxw'

const featuredDefault = [
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB18YyoumB0QK2rljmESBI4cuzYbO2kKxxBNO7meh2WEGr8PohnBYjKTlxlExBBTe9X-pxA1d5k2Yq8sh36zjyXDcxihGmGFFpvOgozTg-L-DJ_h9pLBJ_INp6IGhjN9n3aFRlz7PfUR7xagrcclx70WH61m1InyZnBH9ZmSkNdGGir5h_B1KYcgm1Ejnhehop8koBNF48WeY8racWDoO1pney_6fkHgJRgPLblFYHAaN4VvMManCA-tHlwBgauTA79GgUreQfehdM',
    alt: 'Ramo de primavera',
    title: 'Susurro primaveral',
    desc: 'Composición ligera para interiores luminosos.',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBt3MhMhrI1393gNxjcE9WYwn0d-dQk1XQwKoYcadZNTczw0XotxZLmEvB5cAwj4cNjLJ048PhkGQ5hRAygcEw3wiSIqx-Czl6guyX0isk_e7iQb0nQ8xXTsLBrEw3j1eY0gEo7cyzNoLYfvBaQMn3HJpdR1w5INbUrxdGI3M4I3QpKeYJKu31J56cliHrzD-8EE-T5XZSZD5iZI1oVj4uL3fbpqa3uNMWd_puFuTuSHK0VZh0vmGYf_zbC5G1W8UAWrgLPpDWZwLw',
    alt: 'Arreglo silvestre',
    title: 'Elegancia natural',
    desc: 'Texturas profundas para rincones con carácter.',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzSWNZhcMb-GjGrFYQA8fw1fYi7aFRc_3djejIbUx1b5bq-eWvS0T7ZIjElNwXmW_EcWNaBNTHo8C0fSUcCP8s44i_h0cPbInUDE2ilrvktVtHV9Idu_Uvh31H5eTuiG__LrBBnT4RvjU29YXjMoCfKYGPsPST8As8ZDIdPZ1HckActC-EzPw82vWfTbBto8u-i7TCZdHUGwBvRHdxmvbCpKmhaD8KkKoSkvPD5CrZMdzgiETELLBFbXAnrT27XLNJplq_oVH4a_I',
    alt: 'Tulipanes blancos',
    title: 'Pureza en blanco',
    desc: 'Línea minimalista para estilos contemporáneos.',
  },
]

export default function Inicio() {
  const { photos: heroPhotos } = usePhotos('inicio_hero')
  const { photos: destacados } = usePhotos('inicio_destacados')
  const heroTitulo = useContent('inicio_hero_titulo', textDefaults.inicio_hero_titulo)
  const heroTexto = useContent('inicio_hero_texto', textDefaults.inicio_hero_texto)
  const featured = photosOr(destacados, featuredDefault)

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
            <div className="aspect-[4/5] md:aspect-auto md:h-[540px] overflow-hidden border border-on-tertiary-container/30 bg-surface-container-high relative">
              <img
                className="w-full h-full object-cover"
                alt={`Arreglo floral artesanal de ${site.name}`}
                src={firstPhotoUrl(heroPhotos, INICIO_HERO_IMG)}
                width="800"
                height="1000"
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
              <div className="absolute bottom-5 right-5 bg-surface/90 border border-on-tertiary-container px-5 py-3">
                <p className="text-xs uppercase tracking-widest text-primary">Colección viva</p>
                <p className="font-headline text-xl text-on-tertiary-container">Tonos crema y verde</p>
              </div>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {featured.map((item, i) => (
            <Link to="/colecciones" key={item.title || i} className="group cursor-pointer block">
              <div className="aspect-[4/5] overflow-hidden bg-surface-container-high mb-5">
                <img
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
