import React, { useState } from 'react'
import { TOOLS } from './tools.js'
import HomeGrid from './components/HomeGrid.jsx'
import { ToolShell } from './components/ToolShell.jsx'
import PdfEditor from './components/PdfEditor.jsx'
import MergeTool from './components/MergeTool.jsx'
import SplitTool from './components/SplitTool.jsx'
import RotateTool from './components/RotateTool.jsx'
import ConvertTool from './components/ConvertTool.jsx'
import { ImagesToPdfTool, PdfToImagesTool } from './components/ImageTools.jsx'

// Backend gerektiren araçların konfigürasyonları
const CONVERT_CONFIGS = {
  'word-to-pdf': {
    endpoint: '/convert', conversion: 'to-pdf', accept: '.doc,.docx', targetExt: 'pdf',
    buttonLabel: "PDF'e çevir ve indir", hint: '.doc veya .docx'
  },
  'ppt-to-pdf': {
    endpoint: '/convert', conversion: 'to-pdf', accept: '.ppt,.pptx', targetExt: 'pdf',
    buttonLabel: "PDF'e çevir ve indir", hint: '.ppt veya .pptx'
  },
  'excel-to-pdf': {
    endpoint: '/convert', conversion: 'to-pdf', accept: '.xls,.xlsx', targetExt: 'pdf',
    buttonLabel: "PDF'e çevir ve indir", hint: '.xls veya .xlsx',
    note: 'Geniş tablolar birden fazla sayfaya bölünebilir.'
  },
  'html-to-pdf': {
    endpoint: '/convert', conversion: 'to-pdf', accept: '.html,.htm', targetExt: 'pdf',
    buttonLabel: "PDF'e çevir ve indir", hint: '.html veya .htm',
    note: 'Harici CSS/JS yüklenmez; kendi içinde bütün (self-contained) HTML dosyaları en iyi sonucu verir.'
  },
  'pdf-to-word': {
    endpoint: '/pdf-convert', format: 'docx', accept: '.pdf', targetExt: 'docx',
    buttonLabel: "Word'e çevir ve indir", hint: '.pdf', ocrOption: true,
    note: 'Metin tabanlı PDF\'lerde iyi çalışır. Taranmış (görüntü) PDF\'ler için aşağıdaki OCR seçeneğini işaretle. Karmaşık sayfa düzenleri birebir korunamayabilir.'
  },
  'pdf-to-ppt': {
    endpoint: '/pdf-convert', format: 'pptx', accept: '.pdf', targetExt: 'pptx',
    buttonLabel: "PowerPoint'e çevir ve indir", hint: '.pdf', ocrOption: true,
    note: 'Her PDF sayfası bir slayta dönüştürülür (metin + görüntüler). Taranmış PDF\'ler için OCR seçeneğini işaretle.'
  },
  'pdf-to-pdfa': {
    endpoint: '/pdfa', conversion: 'pdfa', accept: '.pdf', targetExt: 'pdf',
    buttonLabel: "PDF/A'ya çevir ve indir", hint: '.pdf',
    note: 'PDF/A-2b standardına dönüştürülür (uzun süreli arşivleme).'
  },
  'merge-docx': {
    endpoint: '/merge-docx', multiple: true, accept: '.docx', targetExt: 'docx',
    buttonLabel: 'Birleştir ve indir', hint: 'En az iki .docx dosyası seç',
    note: 'Temel birleştirme: belgeler art arda eklenir. Farklı stiller kullanan belgelerde biçimlendirme farklılıkları olabilir.'
  }
}

export default function App() {
  const [activeToolId, setActiveToolId] = useState(null)
  const activeTool = TOOLS.find((t) => t.id === activeToolId)

  function renderTool() {
    switch (activeToolId) {
      case 'edit': return <PdfEditor />
      case 'merge': return <MergeTool />
      case 'split': return <SplitTool />
      case 'rotate': return <RotateTool />
      case 'jpg-to-pdf': return <ImagesToPdfTool />
      case 'pdf-to-jpg': return <PdfToImagesTool />
      default:
        if (CONVERT_CONFIGS[activeToolId]) {
          return <ConvertTool config={CONVERT_CONFIGS[activeToolId]} />
        }
        return null
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-white/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => setActiveToolId(null)} className="text-left">
            <h1 className="font-display text-xl font-semibold text-ink">Açık PDF Araç Seti</h1>
            <p className="text-xs text-ink/45 font-mono">açık kaynak · gizlilik odaklı · ücretsiz</p>
          </button>
          {activeTool && (
            <span className="text-sm text-ink/40 hidden sm:block">{activeTool.title}</span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTool ? (
          activeToolId === 'edit' ? (
            <div>
              <button onClick={() => setActiveToolId(null)} className="text-sm text-ink/50 hover:text-ink mb-4">
                ← Tüm araçlar
              </button>
              <PdfEditor />
            </div>
          ) : (
            <ToolShell tool={activeTool} onBack={() => setActiveToolId(null)}>
              {renderTool()}
            </ToolShell>
          )
        ) : (
          <HomeGrid onOpenTool={setActiveToolId} />
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-10 text-center text-xs text-ink/35">
        MIT lisansı ile açık kaynak · Düzenleme araçları tamamen tarayıcında çalışır, dosyaların sunucuya gitmez.
        Dönüştürme araçları açık kaynaklı LibreOffice/Ghostscript sunucusu kullanır.
      </footer>
    </div>
  )
}
