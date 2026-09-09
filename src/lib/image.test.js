import { describe, expect, it } from 'vitest'
import { detectImageKind, prepareImage, ImageValidationError } from './image'

function bytes(values, type = '') { return new Blob([new Uint8Array(values)], { type }) }

describe('validación binaria de imágenes', () => {
  it.each([
    ['jpeg', [0xff, 0xd8, 0xff, 0xe0]],
    ['png', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    ['webp', [...Buffer.from('RIFF0000WEBP')]],
    ['heic', [...Buffer.from('0000ftypheic')]],
  ])('reconoce %s por su firma', async (kind, signature) => {
    expect(await detectImageKind(bytes(signature))).toBe(kind)
  })

  it('rechaza un archivo que solo finge ser una imagen por nombre o MIME', async () => {
    const fake = new File(['contenido que no es una foto'], 'flor.jpg', { type: 'image/jpeg' })
    await expect(prepareImage(fake)).rejects.toMatchObject({
      name: 'ImageValidationError',
      code: 'UNSUPPORTED_FORMAT',
    })
  })

  it('expone errores de validación reconocibles por la interfaz', () => {
    expect(new ImageValidationError('Error', 'TEST')).toMatchObject({ code: 'TEST' })
  })
})
