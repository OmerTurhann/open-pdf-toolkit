import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

/**
 * Bir PDF dosyasını (File veya ArrayBuffer) pdf.js ile açar ve
 * her sayfa için bir thumbnail (dataURL) üretir.
 */
export async function renderThumbnails(arrayBuffer, scale = 0.35) {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) })
  const pdf = await loadingTask.promise
  const thumbs = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
    thumbs.push({
      dataUrl: canvas.toDataURL('image/png'),
      width: viewport.width,
      height: viewport.height
    })
  }

  return thumbs
}

/** Bir dosyayı ArrayBuffer olarak okur. */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Sayfa listesine göre yeni bir PDF oluşturur.
 * pages: [{ docIndex, pageIndex, rotation, annotations?: [{text, xPct, yPct, size, color}] }]
 * sourceDocs: her biri PDFDocument (pdf-lib) olan kaynak belgeler dizisi
 */
export async function buildPdfFromPages(sourceDocs, pages) {
  const outDoc = await PDFDocument.create()
  const font = await outDoc.embedFont(StandardFonts.Helvetica)

  // Kaynak belge başına kopyalanacak sayfa indekslerini grupla (performans için)
  const byDoc = new Map()
  pages.forEach((p, order) => {
    if (!byDoc.has(p.docIndex)) byDoc.set(p.docIndex, [])
    byDoc.get(p.docIndex).push({ ...p, order })
  })

  const copiedByKey = new Map()
  for (const [docIndex, list] of byDoc.entries()) {
    const src = sourceDocs[docIndex]
    const indices = list.map((p) => p.pageIndex)
    const copied = await outDoc.copyPages(src, indices)
    list.forEach((p, i) => {
      copiedByKey.set(`${docIndex}-${p.pageIndex}-${p.order}`, copied[i])
    })
  }

  // Orijinal sırayı koru
  pages.forEach((p, order) => {
    const page = copiedByKey.get(`${p.docIndex}-${p.pageIndex}-${order}`)
    if (p.rotation) {
      page.setRotation(degrees(p.rotation))
    }
    const { width, height } = page.getSize()
    ;(p.annotations || []).forEach((a) => {
      const size = a.size || 16
      const color = a.color || [0, 0, 0]
      page.drawText(a.text, {
        x: (a.xPct / 100) * width,
        y: height - (a.yPct / 100) * height - size,
        size,
        font,
        color: rgb(...color)
      })
    })
    outDoc.addPage(page)
  })

  return outDoc
}

/** PDFDocument'i indirilebilir bir Blob'a çevirir. */
export async function pdfToBlob(pdfDoc) {
  const bytes = await pdfDoc.save()
  return new Blob([bytes], { type: 'application/pdf' })
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Bir sayfaya metin ekler. Koordinatlar pdf-lib sayfa uzayında
 * (sol alt köşe orijin) verilmelidir.
 */
export async function addTextToPage(pdfDoc, pageIndex, text, x, y, opts = {}) {
  const page = pdfDoc.getPage(pageIndex)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const { size = 14, color = [0, 0, 0] } = opts
  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: rgb(...color)
  })
}

export { PDFDocument }

/** Birden fazla PDF dosyasını sırayla tek belgede birleştirir. */
export async function mergePdfFiles(files) {
  const outDoc = await PDFDocument.create()
  for (const file of files) {
    const buffer = await readFileAsArrayBuffer(file)
    const src = await PDFDocument.load(buffer)
    const copied = await outDoc.copyPages(src, src.getPageIndices())
    copied.forEach((p) => outDoc.addPage(p))
  }
  return outDoc
}

/** "1-3,5,7-9" gibi bir aralık ifadesini 0 tabanlı sayfa indekslerine çevirir. */
export function parsePageRanges(input, pageCount) {
  const indices = []
  for (const part of input.split(',')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const m = trimmed.match(/^(\d+)(?:\s*-\s*(\d+))?$/)
    if (!m) throw new Error(`Geçersiz aralık: "${trimmed}"`)
    const start = parseInt(m[1], 10)
    const end = m[2] ? parseInt(m[2], 10) : start
    if (start < 1 || end > pageCount || start > end) {
      throw new Error(`Aralık sayfa sayısının dışında: "${trimmed}" (belge ${pageCount} sayfa)`)
    }
    for (let i = start; i <= end; i++) indices.push(i - 1)
  }
  if (indices.length === 0) throw new Error('En az bir sayfa belirtmelisin.')
  return indices
}

/** Verilen indekslerdeki sayfalardan yeni bir PDF üretir. */
export async function extractPages(buffer, indices) {
  const src = await PDFDocument.load(buffer)
  const outDoc = await PDFDocument.create()
  const copied = await outDoc.copyPages(src, indices)
  copied.forEach((p) => outDoc.addPage(p))
  return outDoc
}

/** Tüm sayfaları verilen açıyla döndürür (mevcut açının üzerine ekler). */
export async function rotateAllPages(buffer, angle) {
  const doc = await PDFDocument.load(buffer)
  doc.getPages().forEach((page) => {
    const current = page.getRotation().angle
    page.setRotation(degrees((current + angle) % 360))
  })
  return doc
}

/** Resim dosyalarını (JPG/PNG) tek bir PDF'e dönüştürür — her resim bir sayfa. */
export async function imagesToPdf(files) {
  const outDoc = await PDFDocument.create()
  for (const file of files) {
    const buffer = await readFileAsArrayBuffer(file)
    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')
    const image = isPng ? await outDoc.embedPng(buffer) : await outDoc.embedJpg(buffer)
    const page = outDoc.addPage([image.width, image.height])
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
  }
  return outDoc
}

/**
 * PDF'in her sayfasını JPEG dataURL olarak render eder (yüksek çözünürlük).
 * onProgress(current, total) ilerleme bildirimi için çağrılır.
 */
export async function pdfToJpegs(buffer, scale = 2, onProgress) {
  const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) })
  const pdf = await loadingTask.promise
  const images = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    // JPEG'de şeffaflık olmadığı için beyaz zemin çiziyoruz.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport }).promise
    images.push(canvas.toDataURL('image/jpeg', 0.92))
    onProgress?.(i, pdf.numPages)
  }
  return images
}
