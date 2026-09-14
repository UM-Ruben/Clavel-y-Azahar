import { test, expect } from '@playwright/test'

const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'owner@example.test' }
const session = { access_token: 'test-token', refresh_token: 'test-refresh', expires_at: 4102444800, expires_in: 3600, token_type: 'bearer', user }

async function authenticated(page, owner = true) {
  await page.addInitScript((session) => localStorage.setItem('sb-test-auth-token', JSON.stringify(session)), session)
  await page.route('https://test.supabase.co/**', async (route) => {
    const url = route.request().url()
    const body = url.includes('/auth/v1/user') ? user
      : url.includes('/rpc/is_admin') || url.includes('/rpc/claim_initial_admin') ? owner : []
    await route.fulfill({ json: body })
  })
}

test('el panel abre el formulario sin sesión', async ({ page }) => {
  await page.goto('/admin')
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled()
})

test('una sesión válida abre la galería y permite elegir todas las zonas', async ({ page }) => {
  await authenticated(page)
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Imagen principal', exact: true })).toBeVisible()
  for (const zone of ['Destacados del escaparate', 'Imagen de cabecera', 'Foto de Bodas y Eventos', 'Foto de Talleres', 'Foto de la tienda']) {
    await page.getByRole('button', { name: zone, exact: true }).click()
    await expect(page.getByRole('heading', { name: zone, exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('un usuario distinto no accede a la galería', async ({ page }) => {
  await authenticated(page, false)
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Cuenta sin acceso' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Elegir foto' })).toHaveCount(0)
})

test('una migración pendiente se explica en vez de bloquear el acceso', async ({ page }) => {
  await authenticated(page)
  await page.route('**/rest/v1/rpc/is_admin', (route) => route.fulfill({ status: 404, json: { code: 'PGRST202', message: 'missing function' } }))
  await page.goto('/admin')
  await expect(page.getByRole('alert')).toContainText('Falta actualizar el panel en Supabase')
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible()
})

test('una comprobación que no responde termina y permite reintentar', async ({ page }) => {
  await authenticated(page)
  let blocked = true
  await page.route('**/rest/v1/rpc/is_admin', async (route) => {
    if (blocked) await new Promise((resolve) => setTimeout(resolve, 12000))
    await route.fulfill({ json: true }).catch(() => {})
  })
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'No se pudo abrir el panel' })).toBeVisible({ timeout: 15000 })
  blocked = false
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByRole('heading', { name: 'Imagen principal', exact: true })).toBeVisible()
})

test('una foto real se recorta y un fallo al publicar conserva la foto anterior', async ({ page }) => {
  await authenticated(page)
  const original = { id: 'photo-1', category: 'inicio_hero', image_url: '/demo/colecciones-temporada-pradera-silvestre.jpg', revision: 1, published: true, status: 'published' }
  await page.route('**/rest/v1/photos?**', (route) => route.fulfill({ json: [original] }))
  let uploads = 0
  await page.route('**/storage/v1/object/media-staging/**', (route) => {
    uploads++
    return route.fulfill({ json: { Key: 'test' } })
  })
  await page.route('**/functions/v1/publish-photo', (route) => route.fulfill({ status: 500, json: { error: 'Storage unavailable' } }))
  await page.goto('/admin')
  await expect(page.getByAltText('Vista previa de la foto publicada')).toBeVisible()
  await page.locator('input[type=file]').setInputFiles('public/demo/colecciones-temporada-pradera-silvestre.jpg')
  await expect(page.getByRole('slider', { name: 'Acercar o alejar la foto' })).toBeVisible()
  await page.getByRole('button', { name: 'Publicar', exact: true }).click()
  await page.getByRole('button', { name: 'Publicar foto', exact: true }).click()
  await expect(page.getByText('Foto publicada correctamente.', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Publicar', exact: true })).toBeEnabled({ timeout: 15000 })
  expect(uploads).toBeGreaterThanOrEqual(2)
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByAltText('Vista previa de la foto publicada')).toHaveAttribute('src', original.image_url)
})

test('publicar JPEG espera al servidor y actualiza la fotografía', async ({ page }) => {
  await authenticated(page)
  let publishBody
  let finishPublish
  const published = { id: 'photo-new', category: 'inicio_hero', image_url: '/demo/colecciones-temporada-pradera-silvestre.jpg', revision: 1, published: true, status: 'published' }
  await page.route('**/storage/v1/object/media-staging/**', (route) => route.fulfill({ json: { Key: 'test' } }))
  await page.route('**/functions/v1/publish-photo', async (route) => {
    publishBody = route.request().postDataJSON()
    await new Promise((resolve) => { finishPublish = resolve })
    await route.fulfill({ json: { photo: published } })
  })
  await page.goto('/admin')
  await expect(page.getByRole('button', { name: 'Elegir foto' })).toBeVisible()
  await page.locator('input[type=file]').setInputFiles('public/demo/colecciones-temporada-pradera-silvestre.jpg')
  await expect(page.getByRole('slider')).toBeVisible()
  await page.getByRole('button', { name: 'Publicar', exact: true }).click()
  await expect.poll(() => !!publishBody).toBe(true)
  await expect(page.getByRole('button', { name: 'Publicando…', exact: true })).toBeDisabled()
  await expect(page.getByText('Foto publicada correctamente.', { exact: true })).toHaveCount(0)
  expect(publishBody.zone).toBe('inicio_hero')
  expect(publishBody.crop.width / publishBody.crop.height).toBeCloseTo(4 / 5, 2)
  finishPublish()
  await expect(page.getByText('Foto publicada correctamente.', { exact: true })).toBeVisible()
  await expect(page.getByAltText('Vista previa de la foto publicada')).toHaveAttribute('src', published.image_url)
})

test('la vista previa sigue el recorte y el zoom antes de publicar', async ({ page }) => {
  await authenticated(page)
  await page.goto('/admin')
  await expect(page.getByRole('button', { name: 'Elegir foto' })).toBeVisible()
  await page.locator('input[type=file]').setInputFiles('public/demo/colecciones-temporada-pradera-silvestre.jpg')

  const livePreview = page.locator('[data-live-crop="true"]')
  await expect(livePreview).toBeVisible()
  const initialWidth = await livePreview.evaluate((image) => image.style.width)

  await page.getByRole('slider', { name: 'Acercar o alejar la foto' }).fill('2')
  await expect.poll(() => livePreview.evaluate((image) => image.style.width)).not.toBe(initialWidth)

  const cropper = page.locator('.reactEasyCrop_Container')
  const box = await cropper.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2, { steps: 5 })
  await page.mouse.up()
  await expect.poll(() => livePreview.evaluate((image) => image.style.left)).not.toBe('0%')
})

test('el historial muestra la versión actual y se refresca al reemplazarla', async ({ page }) => {
  await authenticated(page)
  const original = {
    id: 'photo-history', category: 'inicio_hero',
    image_url: '/demo/inicio-hero-flores-crema.jpg', revision: 1,
    published: true, status: 'published',
  }
  const updated = {
    ...original, image_url: '/demo/colecciones-temporada-pradera-silvestre.jpg', revision: 2,
  }
  let historyRequests = 0
  await page.route('**/rest/v1/photos?**', (route) => route.fulfill({ json: [original] }))
  await page.route('**/rest/v1/photo_revisions?**', (route) => {
    historyRequests += 1
    return route.fulfill({ json: historyRequests === 1 ? [] : [{
      id: 'revision-1', photo_id: original.id, category: original.category,
      source_revision: 1, image_url: original.image_url, history_path: null,
      title: null, expires_at: '2099-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z',
    }] })
  })
  await page.route('**/storage/v1/object/media-staging/**', (route) => route.fulfill({ json: { Key: 'test' } }))
  await page.route('**/functions/v1/publish-photo', (route) => route.fulfill({ json: { photo: updated } }))

  await page.goto('/admin')
  await expect(page.getByRole('button', { name: 'Historial y papelera (1)' })).toBeVisible()
  await page.locator('input[type=file]').setInputFiles('public/demo/colecciones-temporada-pradera-silvestre.jpg')
  await page.getByRole('button', { name: 'Publicar', exact: true }).click()
  await page.getByRole('button', { name: 'Publicar foto', exact: true }).click()

  await expect(page.getByRole('button', { name: 'Historial y papelera (2)' })).toBeVisible()
  await page.getByRole('button', { name: 'Historial y papelera (2)' }).click()
  await expect(page.getByText('1 actuales · 1 anteriores')).toBeVisible()
  await expect(page.getByText('Versión visible actualmente')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Restaurar' })).toBeVisible()
})
