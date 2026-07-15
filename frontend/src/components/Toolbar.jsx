import React, { useRef } from 'react'

export default function Toolbar({ onFilesSelected, onDownloadAll, onExtractSelected, onDeleteSelected, hasPages, hasSelection, isBusy }) {
  const inputRef = useRef(null)

  return (
    <div className="flex flex-wrap items-center gap-2 bg-white border border-ink/10 rounded-xl px-4 py-3 sticky top-4 z-30 shadow-sm">
      <button
        onClick={() => inputRef.current?.click()}
        className="bg-accent hover:bg-accentDark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        + PDF ekle
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          onFilesSelected(e.target.files)
          e.target.value = ''
        }}
      />

      <div className="w-px h-6 bg-ink/10 mx-1" />

      <button
        disabled={!hasSelection}
        onClick={onExtractSelected}
        className="text-sm font-medium px-3 py-2 rounded-lg border border-ink/15 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink/5 transition-colors"
      >
        Seçilenleri ayrı PDF olarak indir
      </button>

      <button
        disabled={!hasSelection}
        onClick={onDeleteSelected}
        className="text-sm font-medium px-3 py-2 rounded-lg border border-ink/15 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink/5 transition-colors"
      >
        Seçilenleri sil
      </button>

      <div className="flex-1" />

      <button
        disabled={!hasPages || isBusy}
        onClick={onDownloadAll}
        className="bg-ink text-paper text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink/85 transition-colors"
      >
        {isBusy ? 'Hazırlanıyor…' : 'PDF olarak indir'}
      </button>
    </div>
  )
}
