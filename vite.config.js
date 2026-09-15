import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineConfig({
  plugins: [react()],
  ssgOptions: {
    // No hay loaders de servidor: el bloque inline de hidratación que añade
    // React Router no aporta datos y obligaría a relajar la CSP en producción.
    onPageRendered: (_route, html) => html
      .replace(/<script>window\.__staticRouterHydrationData[\s\S]*?<\/script>/, ''),
    onFinished: async (directory) => {
      // vite-react-ssg añade después un pequeño script inline con el nombre de
      // su manifiesto. Lo convertimos en un archivo del propio dominio para no
      // tener que permitir JavaScript inline en la CSP.
      const files = (await readdir(directory)).filter((file) => file.endsWith('.html'))
      let runtimeScript = ''
      for (const file of files) {
        const path = join(directory, file)
        const html = await readFile(path, 'utf8')
        const match = html.match(/<script>(window\.__VITE_REACT_SSG_HASH__[\s\S]*?)<\/script>/)
        if (match && !runtimeScript) runtimeScript = match[1]
        const secured = html.replace(
          /<script>window\.__VITE_REACT_SSG_HASH__[\s\S]*?<\/script>/,
          '<script src="/ssg-runtime.js"></script>'
        )
        if (secured !== html) await writeFile(path, secured)
      }
      if (runtimeScript) await writeFile(join(directory, 'ssg-runtime.js'), `${runtimeScript}\n`)
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
