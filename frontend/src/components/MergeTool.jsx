import React, { useState } from 'react'
import { DropZone, PrimaryButton, StatusLine } from './ToolShell.jsx'
import { mergePdfFiles, pdfToBlob, downloadBlob } from '../utils/pdfUtils.js'

export default function MergeTool() {
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  function addFiles(fileList) {
    setFiles((prev) => [...prev, ...Array.from(fileList)])
    setStatus('idle')
  }

  function move(index, dir) {
    setFiles((prev) => {
      const copy = [...prev]
      const target = index + dir
      if (target < 0 || target >= copy.length) return copy
      ;[copy[index], copy[target]] = [copy[target], copy[index]]
      return copy
    })
  }

  function remove(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function merge() {
    setStatus('working')
    setError('')
    try {
      const doc = await mergePdfFiles(files)
      const blob = await pdfToBlob(doc)
      downloadBlob(blob, 'birlestirilmis.pdf')
      setStatus('done')
    } catch (err) {
      console.error(err)
      setError('Birleştirme başarısız oldu. Dosyaların geçerli PDF olduğundan emin ol.')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      <DropZone accept="application/pdf" multiple onFiles={addFiles} hint="Birden fazla PDF seçebilirsin" />

      {files.length > 0 && (
        <ul className="bg-white border border-ink/10 rounded-xl divide-y divide-ink/5">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 px-4 py-2.5 text-sm">
              <span className="font-mono text-xs text-ink/35 w-5">{i + 1}</span>
              <span className="flex-1 truncate">{f.name}</span>
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-ink/40 hover:text-ink disabled:opacity-20 px-1">↑</button>
              <button onClick={() => move(i, 1)} disabled={i === files.length - 1} className="text-ink/40 hover:text-ink disabled:opacity-20 px-1">↓</button>
              <button onClick={() => remove(i)} className="text-warn/70 hover:text-warn px-1">✕</button>
            </li>
          ))}
        </ul>
      )}

      <PrimaryButton disabled={files.length < 2 || status === 'working'} onClick={merge}>
        {status === 'working' ? 'Birleştiriliyor…' : `${files.length || ''} dosyayı birleştir ve indir`}
      </PrimaryButton>
      <StatusLine status={status} error={error} />
    </div>
  )
}
