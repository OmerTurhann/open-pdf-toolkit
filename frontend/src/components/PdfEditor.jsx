import React, { useState } from 'react'
import Toolbar from './Toolbar.jsx'
import PageGrid from './PageGrid.jsx'
import {
  PDFDocument,
  readFileAsArrayBuffer,
  renderThumbnails,
  buildPdfFromPages,
  pdfToBlob,
  downloadBlob
} from '../utils/pdfUtils.js'

let idCounter = 0
const nextId = () => `p${++idCounter}`

export default function PdfEditor() {
  const [sourceDocs, setSourceDocs] = useState([])
  const [pages, setPages] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [isBusy, setIsBusy] = useState(false)

  async function handleFilesSelected(fileList) {
    const files = Array.from(fileList)
    if (files.length === 0) return
    setIsBusy(true)
    try {
      const newDocs = [...sourceDocs]
      const newPages = [...pages]

      for (const file of files) {
        const buffer = await readFileAsArrayBuffer(file)
        const pdfLibDoc = await PDFDocument.load(buffer)
        const thumbs = await renderThumbnails(buffer)
        const docIndex = newDocs.length
        newDocs.push(pdfLibDoc)

        thumbs.forEach((t, pageIndex) => {
          newPages.push({
            id: nextId(),
            docIndex,
            pageIndex,
            rotation: 0,
            thumbDataUrl: t.dataUrl,
            sourceName: file.name,
            annotations: []
          })
        })
      }

      setSourceDocs(newDocs)
      setPages(newPages)
    } catch (err) {
      console.error(err)
      alert('Bir veya birden fazla dosya yüklenemedi. Dosyanın geçerli bir PDF olduğundan emin ol.')
    } finally {
      setIsBusy(false)
    }
  }

  function reorderPages(fromIndex, toIndex) {
    setPages((prev) => {
      const copy = [...prev]
      const [moved] = copy.splice(fromIndex, 1)
      copy.splice(toIndex, 0, moved)
      return copy
    })
  }

  function rotatePage(pageId) {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, rotation: ((p.rotation || 0) + 90) % 360 } : p))
    )
  }

  function deletePage(pageId) {
    setPages((prev) => prev.filter((p) => p.id !== pageId))
    setSelected((prev) => {
      const copy = new Set(prev)
      copy.delete(pageId)
      return copy
    })
  }

  function deleteSelected() {
    setPages((prev) => prev.filter((p) => !selected.has(p.id)))
    setSelected(new Set())
  }

  function toggleSelect(pageId) {
    setSelected((prev) => {
      const copy = new Set(prev)
      copy.has(pageId) ? copy.delete(pageId) : copy.add(pageId)
      return copy
    })
  }

  function addTextToPage(pageId, text) {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId
          ? { ...p, annotations: [...p.annotations, { text, xPct: 10, yPct: 10, size: 18 }] }
          : p
      )
    )
  }

  async function downloadAll() {
    if (pages.length === 0) return
    setIsBusy(true)
    try {
      const outDoc = await buildPdfFromPages(sourceDocs, pages)
      const blob = await pdfToBlob(outDoc)
      downloadBlob(blob, 'duzenlenmis.pdf')
    } catch (err) {
      console.error(err)
      alert('PDF oluşturulurken bir hata oluştu.')
    } finally {
      setIsBusy(false)
    }
  }

  async function extractSelected() {
    const chosen = pages.filter((p) => selected.has(p.id))
    if (chosen.length === 0) return
    setIsBusy(true)
    try {
      const outDoc = await buildPdfFromPages(sourceDocs, chosen)
      const blob = await pdfToBlob(outDoc)
      downloadBlob(blob, 'secilen-sayfalar.pdf')
    } catch (err) {
      console.error(err)
      alert('PDF oluşturulurken bir hata oluştu.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <Toolbar
        onFilesSelected={handleFilesSelected}
        onDownloadAll={downloadAll}
        onExtractSelected={extractSelected}
        onDeleteSelected={deleteSelected}
        hasPages={pages.length > 0}
        hasSelection={selected.size > 0}
        isBusy={isBusy}
      />
      <PageGrid
        pages={pages}
        onReorder={reorderPages}
        onRotate={rotatePage}
        onDelete={deletePage}
        onAddText={addTextToPage}
        onToggleSelect={toggleSelect}
        selected={selected}
      />
    </div>
  )
}
