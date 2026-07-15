import React, { useState } from 'react'
import { DropZone, PrimaryButton, StatusLine } from './ToolShell.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787'

/**
 * Backend'e istek atan genel dönüştürme aracı.
 * config: { endpoint, conversion, accept, targetExt, buttonLabel, multiple?, note? }
 */
export default function ConvertTool({ config }) {
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [useOcr, setUseOcr] = useState(false)

  async function run() {
    setStatus('working')
    setError('')
    try {
      const form = new FormData()
      if (config.multiple) {
        files.forEach((f) => form.append('files', f))
      } else {
        form.append('file', files[0])
        if (config.conversion) form.append('conversion', config.conversion)
        if (config.format) form.append('format', config.format)
        if (config.ocrOption) form.append('ocr', String(useOcr))
      }

      const res = await fetch(`${API_BASE}${config.endpoint}`, { method: 'POST', body: form })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Sunucu hatası (${res.status})`)
      }

      const blob = await res.blob()
      const base = files[0].name.replace(/\.[^.]+$/, '')
      const name = config.multiple ? `birlestirilmis.${config.targetExt}` : `${base}.${config.targetExt}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setStatus('done')
    } catch (err) {
      console.error(err)
      setError((err.message || 'Dönüştürme başarısız oldu.') + ' — dönüştürme sunucusunun çalıştığından emin ol.')
      setStatus('error')
    }
  }

  const ready = config.multiple ? files.length >= 2 : files.length === 1

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink/40 bg-ink/4 border border-ink/8 rounded-lg px-3 py-2">
        Bu işlem dönüştürme sunucusu gerektirir — dosyan geçici olarak işlenir ve hemen silinir.
      </p>
      <DropZone
        accept={config.accept}
        multiple={!!config.multiple}
        files={files.length ? files : null}
        onFiles={(fl) => {
          setFiles(config.multiple ? (p) => [...p, ...Array.from(fl)] : [fl[0]])
          setStatus('idle')
        }}
        hint={config.hint}
      />
      {config.note && <p className="text-xs text-ink/40">{config.note}</p>}
      {config.ocrOption && (
        <label className="flex items-start gap-2 text-sm cursor-pointer bg-white border border-ink/10 rounded-lg px-3 py-2.5">
          <input type="checkbox" checked={useOcr} onChange={(e) => setUseOcr(e.target.checked)} className="mt-0.5" />
          <span>
            <span className="font-medium text-ink">Taranmış belge (OCR uygula)</span>
            <span className="block text-xs text-ink/45 mt-0.5">
              PDF taranmış/fotoğraf tabanlıysa işaretle — metin optik tanımayla çıkarılır (İngilizce + Türkçe). Biraz daha uzun sürer.
            </span>
          </span>
        </label>
      )}
      <PrimaryButton disabled={!ready || status === 'working'} onClick={run}>
        {status === 'working' ? 'Dönüştürülüyor…' : config.buttonLabel}
      </PrimaryButton>
      <StatusLine status={status} error={error} />
    </div>
  )
}
