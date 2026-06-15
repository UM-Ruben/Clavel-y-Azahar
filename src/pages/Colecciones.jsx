import { Link } from 'react-router-dom'
import { site } from '../config/site'
import Seo from '../components/Seo'
import { usePhotos, photosOr, useContent } from '../lib/content'
import { textDefaults } from '../lib/textDefaults'

const temporadaCards = [
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACbSeeYzGDkfrUfB7gu07m9U972O6-fpCE-cYJysA86_a8EO65YrnNOz55v7N27tixPL-PLlUvDV5I_rxXdX0H4j3gfshq0r8lie6kN6cZRCaKMBtabnU94LU2Ex6Z9JgdNN-IN3kyoESnoGwdHHIXmK_GI3yQHVtbojfB_FNgucfzrWySP3chJpMF4LNNfxov0F-ohd-Nh1EEiBfH0XcsVgvbtJrS5qCPQJFvQCi3JcQp-NFpp18-EbxzrBiBR_aSQbkhVvlTmnE',
    alt: 'Ramo despertar de primavera',
    badge: 'De temporada',
    title: 'Despertar de Primavera',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBg_4jFVjcFjXBuq1xbwW4OKrFEvRpKCyIlokm9agzDi4Ul4CPZvsUurT17vsQX2X5B5cpJSmUz_nNKgo0IVXnMEdNwRcZr5yjOSuWAMu8Fq0-3GG50ysBlcx7zGpo7EYfP1kJ-m2kuCeBHVfp-9kUpX31y5qwrvzMw29uFr_7xAHjw4NiCPqiw70b6RfGtB8bCgU-lJYH0M6OdcSN6ocHSIfvU6ffRbamOQlE0_2H2jIrIoGH5vEWVRKAPSpTxKZZjTcsZrFBrIs8',
    alt: 'Arreglo de cosecha de otoño',
    badge: null,
    title: 'Cosecha de Otoño',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCImgVfwImLe4RG5w7fPyKRgPm0EZ_Zf64udv_Yt1RMPDzDfy61yfeTI3ont0smDsgmshbILdkfXfY79mPqvQjH4KeMQWdU0UKG_L5sJwRb13_gMmlMpAeblntBe0ZS_X-Ffv0_W41qOJGYQR5YK8zJXhJtv6SvkcdL-dxlZ03vs9xtIYHmiLUwjelYktbTPFkLlZgLUdQkVBGhzIW9H-cAzTV7IcSZ9QUmK2VQxw8dkcUZoCRDA0XJyOCPkhRC_5Hwp-lfefyoBI8',
    alt: 'Ramo de pradera silvestre',
    badge: null,
    title: 'Pradera Silvestre',
  },
]

const centerpieces = [
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlXj9Mdvo5xk44Wvd_dw8EM-4s9nznfzw6amdOQImioIrZFglVv1IvxbGxVDlBLoglXXZUSczbuH-lwojwDTW3y1-oBjMOUTih5bsdGepSyJqLYoNh9YGoF9Difl_FaCpa8jo8Pk4ru9sr0ZqZu4y_jYJUx5sG6PcDQJdpevQ4SVGuG198bEhtKs2OJDAnkZQ0A4g08ue30CHhMvZmWNLEoJy_CejRsHjDeTb4GgUtp2Sq7ds_IO6xvJGh0CdNk-JShinbvhdRpfQ',
    alt: 'Centro de mesa elegante para comedor',
    title: 'La Gran Finca',
    desc: 'Un arreglo bajo y lujoso perfecto para cenas íntimas, con hortensias y verdes colgantes.',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3xasbAxzSOqFLyBZaSJ4QapO5uTdcApi5U3m3283r62VGnGhlI6eJeJm6dEwd6oIUaeliAGoW3GtVdDKyZxSpCRWaubEl0ScH8b6IdlXtkvr21YqhKueFWz7LCpQLXG0spnnXH6wxsseQn7q0O3eOp9PGYjXu-RIkgJAhLP3bNtfm-OCwh13tOHQOBCfCgu09lzmDFQy1h-FJubZdGRyn6Js-qvzHummkcHJCdRDurNC2yrln2hVvWqAm2oQV1Puaq32q6l20lFE',
    alt: 'Centro de mesa minimalista moderno',
    title: 'Mínimo Escultórico',
    desc: 'Centrado en siluetas llamativas y espacio negativo, esta pieza arquitectónica llama la atención.',
  },
]

const exoticas = [
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzX65a1OLjCLV1PFtVyA0Yjmvdfu65s_YjrbO9tOsOQuq1q2utTxgb6aU6svVRiGootO2vy9zHy54drDhXDcqdcnhix2fJMNu06vlfUnYCUk91YjzC1xhVwIi-pphIrqBAzPIYq9-BCX2F2f2jON7mvM4m8_5csYRIPS7C1imnX-jOwctZqWTWyfr2z2eHvaZpnQofuPFnrMkv8BtfZg9rpMC7G1yZevPMDt4qWwqtZixpYla5l4xKR6CeziAcy2vOFOF1pRSdGVE',
    alt: 'Monstera Deliciosa',
    title: 'Monstera Albo',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAml0oRP4cNZpEtIqZWQ9baS7096VvjdjBNlPricMgiM6oYcN8dSoA0t1ezEcO4hU1uD7OSKgNqiXBbYT_t_wluWSc-qHR5w2bmz_0yD_ynWxfjJjpAQCpx3uz91_IIKrK7R7LgZ_r6wOaaM-PLlRoEH9R9CLV13itvsQWchCLVkwz634A40kPor1UzgMapdyz9zTooMKrMZ9r16EuWJ94tRdJLqKug2ukANiW9Q7_lhv-Rtc7MDD0sr8RgjtPcdQQqrsP1LbPfHCU',
    alt: 'Orquídea rara',
    title: 'Paphiopedilum',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlcKUymZcgULQy68Qq2LKDlR8MnhUtcdtRM-jn2CwboizIAwV4FNHG3uWv2ppw7QsnS9_tH4i0D6U7tsbQT7VEiMxsGoqmF04GlrNBIV__aOQZ_KTCUjE-Izh04dKv4CtWpuOPUKcCXLjW4T6c-X9wG7uCPlrtjrQ7voGvtI7Q1vfGG2VV2yqABltSX71al0BkXRvOAJN3ZjF9g0ObKUKMO4QvAY7k60CDfjlqtPRTcPqIOG--R9aZJ69l_M-dvBlbLZ3JQkbtGpE',
    alt: 'Anthurium Clarinervium',
    title: 'Anthurium Terciopelo',
  },
]

export default function Colecciones() {
  const { photos: temporadaDb } = usePhotos('colecciones_temporada')
  const { photos: centrosDb } = usePhotos('colecciones_centros')
  const { photos: exoticasDb } = usePhotos('colecciones_exoticas')
  const intro = useContent('colecciones_intro', textDefaults.colecciones_intro)

  const temporada = photosOr(temporadaDb, temporadaCards)
  const centros = photosOr(centrosDb, centerpieces)
  const plantas = photosOr(exoticasDb, exoticas)

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-gutter gap-y-16">
          {temporada.map((card, i) => (
            <Link to="/contacto" key={card.title || i} className="group cursor-pointer block">
              <div className="relative aspect-[4/5] overflow-hidden bg-surface-container-low mb-6">
                <img
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
      </section>

      {/* Centros de Mesa */}
      <section className="mb-section-gap">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-12 flex items-center gap-4">
          Centros de Mesa
          <span className="h-[0.5px] flex-grow bg-outline-variant" />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-gutter gap-y-16">
          {centros.map((c, i) => (
            <div
              key={c.title || i}
              className="group flex flex-col md:flex-row gap-8 items-center bg-surface-container-low p-8 rounded-DEFAULT border-[0.5px] border-outline-variant hover:shadow-[0_8px_30px_rgba(6,27,14,0.05)] transition-all duration-300"
            >
              <div className="relative w-full md:w-1/2 aspect-square overflow-hidden">
                <img
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
                <img
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
