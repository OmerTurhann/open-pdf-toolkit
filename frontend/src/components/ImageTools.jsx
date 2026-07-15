import React, { useState } from 'react'
import JSZip from 'jszip'
import { DropZone, PrimaryButton, StatusLine } from './ToolShell.jsx'
import { imagesToPdf, pdfToJpegs, readFileAsArrayBuffer, pdfToBlob, downloadBlob } from '../utils/pdfUtils.js'

export function ImagesToPdfTool() {
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  async function run() {
    setStatus('working')
    setError('')
    try {
      const doc = await imagesToPdf(files)
      const blob = await pdfToBlob(doc)
      downloadBlob(blob, 'resimler.pdf')
      setStatus('done')
    } catch (err) {
      console.error(err)
      setError('Dönüştürme başarısız oldu. JPG veya PNG formatında olduklarından emin ol.')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      <DropZone
        accept="image/jpeg,image/png"
        multiple
        files={files.length ? files : null}
        onFiles={(fl) => { setFiles((p) => [...p, ...Array.from(fl)]); setStatus('idle') }}
        hint="JPG veya PNG — birden fazla seçebilirsin, sırayla sayfalara yerleşir"
      />
      <PrimaryButton disabled={files.length === 0 || status === 'working'} onClick={run}>
        {status === 'working' ? 'Dönüştürülüyor…' : "PDF'e çevir ve indir"}
      </PrimaryButton>
      <StatusLine status={status} error={error} />
    </div>
  )
}

export function PdfToImagesTool() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')

  async function run() {
    setStatus('working')
    setError('')
    try {
      const buffer = await readFileAsArrayBuffer(file)
      const images = await pdfToJpegs(buffer, 2, (cur, total) => setProgress(`${cur}/${total}`))
      const baseName = file.name.replace(/\.pdf$/i, '')

      if (images.length === 1) {
        // Tek sayfa: doğrudan JPG indir, ZIP'e gerek yok.
        const blob = dataUrlToBlob(images[0])
        downloadBlob(blob, `${baseName}.jpg`)
      } else {
        const zip = new JSZip()
        images.forEach((dataUrl, i) => {
          zip.file(`${baseName}-sayfa-${i + 1}.jpg`, dataUrl.split(',')[1], { base64: true })
        })
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        downloadBlob(zipBlob, `${baseName}-jpg.zip`)
      }
      setStatus('done')
    } catch (err) {
      console.error(err)
      setError('Dönüştürme başarısız oldu. Geçerli bir PDF olduğundan emin ol.')
      setStatus('error')
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="space-y-4">
      <DropZone accept="application/pdf" files={file ? [file] : null} onFiles={(fl) => { setFile(fl[0]); setStatus('idle') }} />
      <PrimaryButton disabled={!file || status === 'working'} onClick={run}>
        {status === 'working' ? `Dönüştürülüyor… ${progress || ''}` : "JPG'ye çevir ve indir"}
      </PrimaryButton>
      <StatusLine status={status} error={error} />
    </div>
  )
}

function dataUrlToBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(',')
  const mime = meta.match(/data:(.*?);/)[1]
  const bin = atob(base64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}
