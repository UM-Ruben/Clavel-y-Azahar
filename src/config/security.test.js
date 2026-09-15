import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())

describe('configuración de producción', () => {
  it('no conserva la ruta ni los recursos de demostración', () => {
    expect(existsSync(resolve(root, 'public/demo'))).toBe(false)
    expect(readFileSync(resolve(root, 'src/App.jsx'), 'utf8')).not.toContain("path: '/demo'")
    expect(readFileSync(resolve(root, 'src/lib/textDefaults.js'), 'utf8')).not.toContain('/demo/')
  })

  it('autoriza en la CSP únicamente el JSON-LD inline conocido', () => {
    const index = readFileSync(resolve(root, 'index.html'), 'utf8')
    const jsonLd = index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]
    expect(jsonLd).toBeTruthy()
    const hash = createHash('sha256').update(jsonLd).digest('base64')
    const directive = `'sha256-${hash}'`

    expect(readFileSync(resolve(root, 'vercel.json'), 'utf8')).toContain(directive)
    expect(readFileSync(resolve(root, 'public/_headers'), 'utf8')).toContain(directive)
  })
})
