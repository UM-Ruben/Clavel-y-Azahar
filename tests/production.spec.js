import { test, expect } from '@playwright/test'

const pages = ['/', '/colecciones', '/servicios', '/eventos', '/contacto']

test.beforeEach(async ({ page }) => {
  await page.route('https://test.supabase.co/**', (route) => route.fulfill({ json: [] }))
})

test('la página 404 conserva el diseño y ofrece una salida clara', async ({ page }) => {
  const response = await page.goto('/404.html')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle('Página no encontrada | Clavel y Azahar')
  await expect(page.getByRole('heading', { name: 'Esta página no ha florecido' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Volver al inicio', exact: true })).toHaveAttribute('href', '/')
  await expect(page.getByRole('link', { name: 'Ir a contacto' })).toHaveAttribute('href', '/contacto')
})

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`la compilación publicada no duplica ni desborda el contenido a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')

    for (const path of pages) {
      if (path !== '/') {
        await page.locator(`nav a[href="${path}"]:visible`).first().click()
        await expect(page).toHaveURL(new RegExp(`${path}$`))
      }
      await expect(page.locator('#root > *')).toHaveCount(1)
      await expect(page.locator('main')).toHaveCount(1)
      await expect(page.locator('footer')).toHaveCount(1)

      const layout = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        elementsOutside: [...document.querySelectorAll('main h1, nav a')]
          .map((element) => ({ text: element.textContent?.trim(), rect: element.getBoundingClientRect() }))
          .filter(({ rect }) => rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1))
          .map(({ text }) => text),
      }))

      expect(layout.pageWidth, `${path} amplía el ancho de ${width}px`).toBe(layout.viewport)
      expect(layout.elementsOutside, `${path} tiene elementos fuera de pantalla a ${width}px`).toEqual([])
    }
  })
}
