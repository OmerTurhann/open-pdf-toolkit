// Tüm araçların merkezi kaydı. Her araç bir kartla ana sayfada listelenir.
// status: 'ready' çalışıyor, 'soon' henüz yol haritasında (kart soluk görünür).

export const CATEGORIES = [
  { id: 'organize', label: 'Düzenle ve organize et' },
  { id: 'to-pdf', label: "PDF'e dönüştür" },
  { id: 'from-pdf', label: "PDF'den dönüştür" },
  { id: 'office', label: 'Ofis araçları' }
]

export const TOOLS = [
  // --- Düzenle ve organize et (tarayıcıda, sunucusuz) ---
  { id: 'merge', category: 'organize', status: 'ready', badge: 'M', color: 'bg-violet-500', title: 'PDF Birleştirme', desc: 'Birden fazla PDF dosyasını tek dosyada birleştir.' },
  { id: 'split', category: 'organize', status: 'ready', badge: 'B', color: 'bg-violet-500', title: 'PDF Bölme', desc: 'Sayfa aralığı seç veya her sayfayı ayrı PDF yap.' },
  { id: 'rotate', category: 'organize', status: 'ready', badge: 'D', color: 'bg-violet-500', title: "PDF'i Döndürme", desc: 'Tüm sayfaları 90°, 180° veya 270° döndür.' },
  { id: 'edit', category: 'organize', status: 'ready', badge: 'E', color: 'bg-violet-600', title: 'PDF Düzenle', desc: 'Sayfa sil, çıkar, sırala, döndür, metin ekle — hepsi bir arada.' },

  // --- PDF'e dönüştür ---
  { id: 'jpg-to-pdf', category: 'to-pdf', status: 'ready', badge: 'J', color: 'bg-amber-500', title: 'JPG → PDF', desc: 'Resimleri (JPG/PNG) tek PDF dosyasına çevir. Tarayıcıda çalışır.' },
  { id: 'word-to-pdf', category: 'to-pdf', status: 'ready', badge: 'W', color: 'bg-blue-600', title: 'Word → PDF', desc: '.docx ve .doc dosyalarını PDF yap.' },
  { id: 'ppt-to-pdf', category: 'to-pdf', status: 'ready', badge: 'P', color: 'bg-orange-600', title: 'PowerPoint → PDF', desc: '.pptx ve .ppt sunumlarını PDF yap.' },
  { id: 'excel-to-pdf', category: 'to-pdf', status: 'ready', badge: 'X', color: 'bg-green-600', title: 'Excel → PDF', desc: '.xlsx ve .xls tablolarını PDF yap.' },
  { id: 'html-to-pdf', category: 'to-pdf', status: 'ready', badge: 'H', color: 'bg-sky-600', title: 'HTML → PDF', desc: '.html dosyalarını PDF belgesine çevir.' },

  // --- PDF'den dönüştür ---
  { id: 'pdf-to-jpg', category: 'from-pdf', status: 'ready', badge: 'J', color: 'bg-amber-600', title: 'PDF → JPG', desc: 'Her sayfayı yüksek çözünürlüklü JPG olarak indir (ZIP). Tarayıcıda çalışır.' },
  { id: 'pdf-to-word', category: 'from-pdf', status: 'ready', badge: 'W', color: 'bg-blue-500', title: 'PDF → Word', desc: 'PDF içeriğini düzenlenebilir .docx dosyasına aktar.' },
  { id: 'pdf-to-pdfa', category: 'from-pdf', status: 'ready', badge: 'A', color: 'bg-slate-600', title: "PDF → PDF/A", desc: 'Uzun süreli arşivleme standardına (PDF/A) dönüştür.' },
  { id: 'pdf-to-ppt', category: 'from-pdf', status: 'ready', badge: 'P', color: 'bg-orange-600', title: 'PDF → PowerPoint', desc: 'PDF içeriğini düzenlenebilir .pptx sunumuna aktar.' },
  { id: 'pdf-to-excel', category: 'from-pdf', status: 'soon', badge: 'X', color: 'bg-green-400', title: 'PDF → Excel', desc: 'Tablo tanıma gerektirir — yol haritasında.' },

  // --- Ofis araçları ---
  { id: 'merge-docx', category: 'office', status: 'ready', badge: 'W', color: 'bg-blue-700', title: 'Word Birleştirme', desc: 'Birden fazla .docx dosyasını tek belgede birleştir (temel düzey).' },
  { id: 'merge-pptx', category: 'office', status: 'soon', badge: 'P', color: 'bg-orange-400', title: 'PowerPoint Birleştirme', desc: 'Yol haritasında.' },
  { id: 'edit-office', category: 'office', status: 'soon', badge: 'E', color: 'bg-slate-400', title: 'Word/PPTX Düzenleme', desc: 'Collabora Online entegrasyonu ile planlanıyor.' }
]
