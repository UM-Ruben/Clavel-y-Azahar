import { test, expect } from '@playwright/test'

const TEST_IMAGE = '/logo-orginal2.png'
const TEST_COLLECTION_ID = 'd1c89737-8b0f-467e-ac44-72e79c423339'

async function mockPublishedContent(page) {
  await page.route('https://test.supabase.co/rest/v1/**', async (route) => {
    const url = decodeURIComponent(route.request().url())
    if (url.includes('collections?')) {
      return route.fulfill({ json: [{ id: TEST_COLLECTION_ID, title: 'Ramos de Temporada', description: 'Ramos de cada estación.', sort_order: 0, published: true }] })
    }
    if (url.includes('photos?')) {
      const match = url.match(/category=eq\.([^&]+)/)
      const category = match?.[1] || 'foto'
      return route.fulfill({ json: [{ id: `photo-${category}`, category, image_url: TEST_IMAGE, alt: `Foto ${category}`, sort_order: 0, published: true }] })
    }
    if (url.includes('content?') && url.includes('servicios_suscripciones')) {
      return route.fulfill({ json: [{ value: [
        { img: TEST_IMAGE, title: 'Esencial', freq: 'SEMANAL', desc: 'Flores frescas.', featured: false },
        { img: TEST_IMAGE, title: 'Clásico', freq: 'QUINCENAL', desc: 'Arreglo floral.', featured: true },
        { img: TEST_IMAGE, title: 'Gran Estilo', freq: 'MENSUAL', desc: 'Composición floral.', featured: false },
      ] }] })
    }
    if (url.includes('events?')) {
      return route.fulfill({ json: [{ id: 'event-1', title: 'Taller floral', start_date: '2099-05-01', image_url: TEST_IMAGE, published: true }] })
    }
    return route.fulfill({ json: [] })
  })
}

test('las galerías crecen sin desbordar ni solaparse', async ({ page }) => {
  await mockPublishedContent(page)
  await page.goto('/colecciones')
  await expect(page.getByRole('heading', { name: 'Nuestras Colecciones' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)

  const sections = page.locator('main section')
  const count = await sections.count()
  for (let index = 1; index < count; index += 1) {
    const previous = await sections.nth(index - 1).boundingBox()
    const current = await sections.nth(index).boundingBox()
    if (previous && current) expect(current.y).toBeGreaterThanOrEqual(previous.y + previous.height - 1)
  }
})

test('la imagen principal reserva su espacio en móvil y escritorio', async ({ page }) => {
  await mockPublishedContent(page)
  await page.goto('/')
  const hero = page.locator('main section').first().locator('.aspect-\\[4\\/5\\]').first()
  await expect(hero).toBeVisible()
  const box = await hero.boundingBox()
  expect(box.height / box.width).toBeCloseTo(1.25, 1)
})

test('el texto del servicio queda debajo de la imagen en móvil', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Regla específica de móvil')
  await mockPublishedContent(page)
  await page.goto('/servicios')
  const heroImage = page.locator('main section').first().locator('.aspect-\\[16\\/9\\]').first()
  const title = page.getByRole('heading', { level: 1, name: /Experiencias botánicas/i })
  await expect(heroImage).toBeVisible()
  await expect(title).toBeVisible()
  const imageBox = await heroImage.boundingBox()
  const titleBox = await title.boundingBox()
  expect(titleBox.y).toBeGreaterThanOrEqual(imageBox.y + imageBox.height - 1)
})

test('las colecciones muestran doce fotos y amplían la cuadrícula al pedirlo', async ({ page }) => {
  await page.route('https://test.supabase.co/rest/v1/**', async (route) => {
    const url = decodeURIComponent(route.request().url())
    if (url.includes('collections?')) {
      const collections = [
        { id: 'temporada-1', title: 'Ramos de Temporada', description: 'Ramos de cada estación.', sort_order: 0, published: true },
      ]
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(collections) })
    }
    if (url.includes('photos?') && url.includes('category=eq.coleccion_temporada-1')) {
      const photos = Array.from({ length: 13 }, (_, index) => ({
        id: `photo-${index}`,
        category: 'coleccion_temporada-1',
        image_url: TEST_IMAGE,
        alt: `Ramo de prueba ${index + 1}`,
        sort_order: index,
        published: true,
      }))
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(photos) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  })
  await page.goto('/colecciones')
  const season = page.getByRole('heading', { name: 'Ramos de Temporada' }).locator('..')
  const more = season.getByRole('button', { name: 'Ver más' })
  await expect(more).toBeVisible()
  await expect(season.getByRole('link', { name: /Ramo de prueba/ })).toHaveCount(12)
  await more.click()
  await expect(season.getByRole('link', { name: /Ramo de prueba/ })).toHaveCount(13)
  await expect(more).toBeHidden()
})

test('todas las páginas mantienen imágenes separadas en móvil, tableta y escritorio', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Matriz de tamaños ejecutada una sola vez')
  await mockPublishedContent(page)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/', '/colecciones', '/servicios', '/contacto', '/eventos']) {
      await page.goto(path)
      await expect(page.locator('main')).toBeVisible()
      await expect(page.locator('main img').first()).toBeAttached()
      await expect.poll(() => page.evaluate(async () => {
        const images = [...document.querySelectorAll('main img')]
        for (const img of images) img.loading = 'eager'
        await Promise.all(images.map((img) => img.decode().catch(() => {})))
        return images.length > 0 && images.every((img) => img.complete && img.naturalWidth > 0)
      })).toBe(true)
      const issues = await page.evaluate(() => {
        const issues = []
        if (document.documentElement.scrollWidth > innerWidth) issues.push('desbordamiento horizontal')
        const boxes = [...document.querySelectorAll('main img')].map((img) => ({ alt: img.alt, rect: img.getBoundingClientRect(), loaded: img.complete && img.naturalWidth > 0 })).filter(({ rect }) => rect.width && rect.height)
        for (let i = 0; i < boxes.length; i++) {
          if (!boxes[i].loaded) issues.push(`imagen sin cargar: ${boxes[i].alt}`)
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i].rect, b = boxes[j].rect
            if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) issues.push(`solapamiento: ${boxes[i].alt} / ${boxes[j].alt}`)
          }
        }
        return issues
      })
      expect(issues, `${path} a ${width}px`).toEqual([])
      if (width === 375 || width === 1440) await page.screenshot({ path: testInfo.outputPath(`${path.replaceAll('/', '-') || 'inicio'}-${width}.png`), fullPage: true })
    }
  }
  expect(errors).toEqual([])
})
