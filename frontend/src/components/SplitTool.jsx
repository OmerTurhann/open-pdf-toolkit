import React, { useState } from 'react'
import JSZip from 'jszip'
import { DropZone, PrimaryButton, StatusLine } from './ToolShell.jsx'
import {
  readFileAsArrayBuffer,
  parsePageRanges,
  extractPages,
  pdfToBlob,
  downloadBlob,
  PDFDocument
} from '../utils/pdfUtils.js'

export default function SplitTool() {
  const [file, setFile] = useState(null)
  const [pageCount, setPageCount] = useState(0)
  const [mode, setMode] = useState('range') // 'range' | 'each'
  const [rangeInput, setRangeInput] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  async function handleFile(fileList) {
    const f = fileList[0]
    setFile(f)
    setStatus('idle')
    try {
      const buffer = await readFileAsArrayBuffer(f)
      const doc = await PDFDocument.load(buffer)
      setPageCount(doc.getPageCount())
    } catch {
      setError('Dosya okunamadı. Geçerli bir PDF olduğundan emin ol.')
      setStatus('error')
      setFile(null)
    }
  }

  async function run() {
    setStatus('working')
    setError('')
    try {
      const buffer = await readFileAsArrayBuffer(file)
      const baseName = file.name.replace(/\.pdf$/i, '')

      if (mode === 'range') {
        const indices = parsePageRanges(rangeInput, pageCount)
        const doc = await extractPages(buffer, indices)
        const blob = await pdfToBlob(doc)
        downloadBlob(blob, `${baseName}-secim.pdf`)
      } else {
        // Her sayfa ayrı PDF, tek ZIP olarak indirilir.
        const zip = new JSZip()
        for (let i = 0; i < pageCount; i++) {
          const doc = await extractPages(buffer, [i])
          const bytes = await doc.save()
          zip.file(`${baseName}-sayfa-${i + 1}.pdf`, bytes)
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        downloadBlob(zipBlob, `${baseName}-sayfalar.zip`)
      }
      setStatus('done')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Bölme işlemi başarısız oldu.')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      <DropZone accept="application/pdf" files={file ? [file] : null} onFiles={handleFile} />

      {file && pageCount > 0 && (
        <div className="bg-white border border-ink/10 rounded-xl p-4 space-y-3">
          <p className="text-xs text-ink/45">Belge {pageCount} sayfa.</p>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={mode === 'range'} onChange={() => setMode('range')} />
            Belirli sayfaları al
          </label>
          {mode === 'range' && (
            <input
              value={rangeInput}
              onChange={(e) => setRangeInput(e.target.value)}
              placeholder="Örn: 1-3, 5, 8-10"
              className="w-full border border-ink/15 rounded-lg px-3 py-2 text-sm"
            />
          )}

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={mode === 'each'} onChange={() => setMode('each')} />
            Her sayfayı ayrı PDF yap (ZIP olarak indir)
          </label>
        </div>
      )}

      <PrimaryButton
        disabled={!file || status === 'working' || (mode === 'range' && !rangeInput.trim())}
        onClick={run}
      >
        {status === 'working' ? 'Bölünüyor…' : 'Böl ve indir'}
      </PrimaryButton>
      <StatusLine status={status} error={error} />
    </div>
  )
}
