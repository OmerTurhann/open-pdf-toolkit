import React, { useState } from 'react'

export default function PageGrid({ pages, onReorder, onRotate, onDelete, onAddText, onToggleSelect, selected }) {
  const [dragIndex, setDragIndex] = useState(null)
  const [textTarget, setTextTarget] = useState(null)
  const [textValue, setTextValue] = useState('')

  function handleDragStart(index) {
    setDragIndex(index)
  }

  function handleDragOver(e, index) {
    e.preventDefault()
  }

  function handleDrop(index) {
    if (dragIndex === null || dragIndex === index) return
    onReorder(dragIndex, index)
    setDragIndex(null)
  }

  function submitText() {
    if (textValue.trim()) {
      onAddText(textTarget, textValue.trim())
    }
    setTextTarget(null)
    setTextValue('')
  }

  if (pages.length === 0) {
    return (
      <div className="border-2 border-dashed border-ink/15 rounded-xl py-24 text-center text-ink/40 font-body">
        Henüz sayfa yok. Yukarıdan bir veya birden fazla PDF yükle.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {pages.map((p, i) => (
        <div
          key={p.id}
          draggable
          onDragStart={() => handleDragStart(i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDrop={() => handleDrop(i)}
          className={`group relative bg-white rounded-lg border transition-shadow cursor-grab active:cursor-grabbing
            ${selected.has(p.id) ? 'border-accent ring-2 ring-accent/30' : 'border-ink/10 hover:shadow-md'}`}
        >
          <button
            onClick={() => onToggleSelect(p.id)}
            className="absolute top-2 left-2 w-5 h-5 rounded border border-ink/30 bg-white/90 flex items-center justify-center text-[10px] z-10"
            title="Seç"
          >
            {selected.has(p.id) ? '✓' : ''}
          </button>

          <div className="overflow-hidden rounded-t-lg bg-ink/5 flex items-center justify-center" style={{ aspectRatio: '3/4' }}>
            <img
              src={p.thumbDataUrl}
              alt={`Sayfa ${i + 1}`}
              style={{ transform: `rotate(${p.rotation || 0}deg)` }}
              className="max-w-full max-h-full object-contain transition-transform"
            />
          </div>

          <div className="px-2 py-1.5 text-xs font-mono text-ink/50 flex items-center justify-between">
            <span>#{i + 1}</span>
            <span className="truncate max-w-[70px]" title={p.sourceName}>{p.sourceName}</span>
          </div>

          <div className="absolute inset-x-0 bottom-8 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-ink/70 py-1">
            <button onClick={() => onRotate(p.id)} className="text-white text-xs px-1.5 py-0.5 hover:bg-white/20 rounded" title="90° döndür">⟳</button>
            <button onClick={() => setTextTarget(p.id)} className="text-white text-xs px-1.5 py-0.5 hover:bg-white/20 rounded" title="Metin ekle">T+</button>
            <button onClick={() => onDelete(p.id)} className="text-white text-xs px-1.5 py-0.5 hover:bg-white/20 rounded" title="Sayfayı sil">✕</button>
          </div>

          {textTarget === p.id && (
            <div className="absolute inset-0 bg-white/95 rounded-lg flex flex-col items-center justify-center gap-2 p-3 z-20">
              <input
                autoFocus
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitText()}
                placeholder="Eklenecek metin"
                className="w-full text-xs border border-ink/20 rounded px-2 py-1"
              />
              <div className="flex gap-2">
                <button onClick={submitText} className="text-xs bg-accent text-white px-2 py-1 rounded">Ekle</button>
                <button onClick={() => setTextTarget(null)} className="text-xs text-ink/50 px-2 py-1">İptal</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
