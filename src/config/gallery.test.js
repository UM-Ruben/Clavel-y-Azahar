import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { GALLERY_SECTIONS, canAddPhoto, getGallerySection } from './gallery'

describe('configuración de la galería', () => {
  it('usa claves únicas y proporciones válidas', () => {
    const keys = GALLERY_SECTIONS.map((section) => section.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const section of GALLERY_SECTIONS) {
      expect(section.aspect).toBeGreaterThan(0)
      expect(section.output.width / section.output.height).toBeCloseTo(section.aspect, 4)
    }
  })

  it('limita a tres los destacados y a una las zonas individuales', () => {
    const featured = getGallerySection('inicio_destacados')
    expect(canAddPhoto(featured, 2)).toBe(true)
    expect(canAddPhoto(featured, 3)).toBe(false)
    for (const section of GALLERY_SECTIONS.filter((item) => item.single)) {
      expect(section.maxItems).toBe(1)
      expect(canAddPhoto(section, 1)).toBe(false)
    }
  })

  it('ya no fija los apartados de Colecciones aquí (son dinámicos, ver src/lib/collections.js)', () => {
    expect(GALLERY_SECTIONS.some((section) => section.group === 'Colecciones')).toBe(false)
  })

  it('mantiene las mismas zonas y límites en la validación de Supabase', () => {
    const sql = readFileSync(resolve(process.cwd(), 'supabase/migrations/202609090001_secure_media_manager.sql'), 'utf8')
    for (const section of GALLERY_SECTIONS) expect(sql).toContain(`when '${section.key}' then`)
    expect(sql).toContain("when 'inicio_destacados' then 3")
    expect(sql).not.toContain('for all to authenticated using (true)')
    expect(sql).toContain('public.is_admin()')
  })
})
