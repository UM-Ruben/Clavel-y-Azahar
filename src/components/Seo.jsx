import { Head } from 'vite-react-ssg'
import { site } from '../config/site'

// Inserta title + meta description + canonical + Open Graph únicos por ruta.
// Las etiquetas globales (favicon, fuentes, og:image, twitter:card, JSON-LD)
// viven en index.html.
export default function Seo({ title, description, path = '/' }) {
  const url = `${site.domain}${path}`

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
    </Head>
  )
}
