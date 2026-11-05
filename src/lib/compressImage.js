// Reduce una foto antes de subirla: máximo `maxSide` px por lado y WebP (o JPEG si el navegador no hace WebP).
// Una foto de cel de ~3.5 MB queda en ~150–250 KB sin que se note en pantalla.
export async function compressImage(blob, { maxSide = 1400, quality = 0.82 } = {}) {
  const bitmap = await createImageBitmap(blob)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  const toBlob = (type) => new Promise((resolve) => canvas.toBlob(resolve, type, quality))
  let out = await toBlob('image/webp')
  if (!out || out.type !== 'image/webp') out = await toBlob('image/jpeg')
  const ext = out.type === 'image/webp' ? 'webp' : 'jpg'
  return { blob: out, ext, type: out.type }
}

// Intenta comprimir; si el formato no se puede leer (p. ej. HEIC en Chrome), regresa el archivo original.
export async function compressOrOriginal(file, opts) {
  try {
    const r = await compressImage(file, opts)
    if (r.blob.size < file.size) return r
  } catch (e) {
    console.warn('No se pudo comprimir, se sube original:', e)
  }
  return { blob: file, ext: file.name?.split('.').pop() || 'jpg', type: file.type }
}
