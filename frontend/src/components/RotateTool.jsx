import React, { useState } from 'react'
import { DropZone, PrimaryButton, StatusLine } from './ToolShell.jsx'
import { readFileAsArrayBuffer, rotateAllPages, pdfToBlob, downloadBlob } from '../utils/pdfUtils.js'

export default function RotateTool() {
  const [file, setFile] = useState(null)
  const [angle, setAngle] = useState(90)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  async function run() {
    setStatus('working')
    setError('')
    try {
      const buffer = await readFileAsArrayBuffer(file)
      const doc = await rotateAllPages(buffer, angle)
      const blob = await pdfToBlob(doc)
      downloadBlob(blob, file.name.replace(/\.pdf$/i, '') + '-dondurulmus.pdf')
      setStatus('done')
    } catch (err) {
      console.error(err)
      setError('Döndürme başarısız oldu. Geçerli bir PDF olduğundan emin ol.')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      <DropZone accept="application/pdf" files={file ? [file] : null} onFiles={(fl) => { setFile(fl[0]); setStatus('idle') }} />

      <div className="bg-white border border-ink/10 rounded-xl p-4 flex gap-2">
        {[90, 180, 270].map((a) => (
          <button
            key={a}
            onClick={() => setAngle(a)}
            className={`flex-1 text-sm font-medium py-2 rounded-lg border transition-colors
              ${angle === a ? 'border-accent bg-accent/10 text-accent' : 'border-ink/15 text-ink/60 hover:bg-ink/5'}`}
          >
            {a}° sağa
          </button>
        ))}
      </div>

      <p className="text-xs text-ink/40">
        Not: Bu araç tüm sayfaları döndürür. Sayfaları tek tek döndürmek için "PDF Düzenle" aracını kullan.
      </p>

      <PrimaryButton disabled={!file || status === 'working'} onClick={run}>
        {status === 'working' ? 'Döndürülüyor…' : 'Döndür ve indir'}
      </PrimaryButton>
      <StatusLine status={status} error={error} />
    </div>
  )
}
