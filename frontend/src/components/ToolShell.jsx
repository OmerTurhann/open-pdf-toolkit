import React, { useRef } from 'react'

export function ToolShell({ tool, onBack, children }) {
  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="text-sm text-ink/50 hover:text-ink mb-4 flex items-center gap-1">
        ← Tüm araçlar
      </button>
      <div className="flex items-center gap-3 mb-1">
        <span className={`w-10 h-10 rounded-lg ${tool.color} text-white font-display font-semibold flex items-center justify-center`}>
          {tool.badge}
        </span>
        <h2 className="font-display text-2xl font-semibold text-ink">{tool.title}</h2>
      </div>
      <p className="text-sm text-ink/50 mb-6">{tool.desc}</p>
      {children}
    </div>
  )
}

export function DropZone({ accept, multiple = false, files, onFiles, hint }) {
  const inputRef = useRef(null)
  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files)
      }}
      className="border-2 border-dashed border-ink/15 rounded-xl py-12 text-center cursor-pointer hover:border-accent/50 transition-colors bg-white"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files)
          e.target.value = ''
        }}
      />
      {files && files.length > 0 ? (
        <div className="text-sm text-ink space-y-1">
          {files.map((f, i) => (
            <p key={i} className="truncate px-6">{f.name}</p>
          ))}
        </div>
      ) : (
        <>
          <p className="text-sm text-ink/60 font-medium">Dosya seçmek için tıkla veya sürükle-bırak</p>
          <p className="text-xs text-ink/35 mt-1">{hint || accept}</p>
        </>
      )}
    </div>
  )
}

export function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="w-full bg-accent hover:bg-accentDark text-white text-sm font-medium py-3 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  )
}

export function StatusLine({ status, error }) {
  if (status === 'error') return <p className="text-sm text-warn mt-3">{error}</p>
  if (status === 'done') return <p className="text-sm text-accent mt-3">İşlem tamamlandı, dosya indirildi.</p>
  return null
}
