# Açık PDF Araç Seti

Açık kaynaklı, iLovePDF benzeri PDF ve ofis dosyası araç seti. Düzenleme araçları
tamamen tarayıcıda çalışır (dosyalar sunucuya gitmez); dönüştürme araçları açık
kaynaklı LibreOffice + Ghostscript + PyMuPDF tabanlı sunucular kullanır.

## Araçlar

| Araç | Nerede çalışır | Durum |
|---|---|---|
| PDF birleştirme / bölme / döndürme | Tarayıcı | ✅ |
| PDF düzenle (sırala, sil, çıkar, metin) | Tarayıcı | ✅ |
| JPG/PNG → PDF, PDF → JPG | Tarayıcı | ✅ |
| Word / PowerPoint / Excel / HTML → PDF | Node + LibreOffice | ✅ |
| PDF → Word (.docx) — tablo/layout korumalı | Python + pdf2docx | ✅ |
| PDF → PowerPoint (.pptx) | Python + PyMuPDF | ✅ |
| PDF OCR (taranmış belgeler) | Python + ocrmypdf/Tesseract | ✅ |
| PDF → PDF/A | Node + Ghostscript | ✅ |
| Word (.docx) birleştirme | Node | ✅ temel |
| PDF → Excel, PPTX birleştirme, ofis düzenleme | — | 🗺 yol haritası |

## Mimari

```
Tarayıcı (React)
    │
    ├─ Düzenleme araçları  →  tamamen tarayıcıda (pdf-lib, pdf.js)
    │
    └─ Dönüştürme  →  Node API (8787)
                         ├─ ofis → PDF        (LibreOffice)
                         ├─ PDF/A             (Ghostscript)
                         ├─ docx birleştirme  (docx-merger)
                         └─ PDF → Word/PPTX, OCR  →  Python servisi (5001)
                                                       (PyMuPDF, python-docx/pptx, ocrmypdf)
```

PDF → Word/PowerPoint dönüşümü, OpenMF projesindeki kanıtlanmış PyMuPDF +
python-docx/python-pptx yaklaşımına dayanır (LibreOffice'in PDF import filtresi
container ortamlarında güvenilir olmadığı için).

## Proje yapısı

```
open-pdf-toolkit/
├── frontend/          React + Vite (arayüz + tarayıcı-içi araçlar)
│   └── src-tauri/     Masaüstü sarıcı (Tauri)
├── backend/           Node API (LibreOffice, Ghostscript, docx birleştirme, Python proxy)
├── pyservice/         Python dönüştürme servisi (PDF→Word/PPTX, OCR)
└── docker-compose.yml
```

## Hızlı başlangıç

```bash
docker compose up --build
```

- Arayüz: http://localhost:8080
- Node API: http://localhost:8787
- Python servisi: iç ağda (doğrudan erişime kapalı)

İlk derleme birkaç dakika sürebilir (LibreOffice, Tesseract, Ghostscript indirilir).

## Dağıtım: Hazır imajlarla çalıştırma (GHCR)

Kod derlemeden, GitHub Container Registry'den (GHCR) hazır imajları çekerek çalıştırabilirsin.

### Kullanıcılar için (imajları çek ve çalıştır)

```bash
# OWNER = imajların yayınlandığı GitHub kullanıcı/organizasyon adı
OWNER=github-kullanici-adi docker compose -f docker-compose.pull.yml up -d
```

Sonra http://localhost:8080 adresine git. İmajlar herkese açıksa `docker login` gerekmez.

### Bakımcılar için (imajları yayınlama)

İmajlar `main` dalına her push'ta **GitHub Actions ile otomatik** yayınlanır
(bkz. `.github/workflows/publish.yml`). Elle yayınlamak istersen:

```bash
# 1. GHCR'ye giriş (GitHub Personal Access Token gerekir, write:packages yetkili)
echo $GITHUB_TOKEN | docker login ghcr.io -u github-kullanici-adi --password-stdin

# 2. docker-compose.yml içindeki OWNER'ı kendi kullanıcı adınla değiştir, sonra:
docker compose build
docker compose push
```


## Geliştirme modu

```bash
# Frontend
cd frontend && npm install && cp .env.example .env && npm run dev

# Node backend (LibreOffice + Ghostscript kurulu olmalı)
cd backend && npm install && npm start

# Python servisi (LibreOffice + ocrmypdf + tesseract kurulu olmalı)
cd pyservice && pip install -r requirements.txt && PORT=5001 python -m app.server
```

## Masaüstü uygulaması (Tauri)

```bash
cd frontend
npx tauri dev
npx tauri build
```

## API uçları (Node backend)

- `POST /convert` — `file` (ofis/HTML) → PDF
- `POST /pdf-convert` — `file` (PDF), `format` (`docx`|`pptx`), `ocr` (`true`|`false`) → Python servisine proxy
- `POST /pdfa` — `file` (PDF) → PDF/A-2b
- `POST /merge-docx` — `files[]` (2-20 .docx) → tek .docx
- `GET /health`

## Yol haritası

- [x] PDF → Word (pdf2docx, tablo/sütun korumalı) + PowerPoint (PyMuPDF)
- [x] Taranmış PDF'ler için OCR (İngilizce + Türkçe)
- [ ] PDF → Excel (tablo tanıma)
- [ ] PDF sıkıştırma
- [ ] PPTX birleştirme
- [ ] Word/PPTX çevrimiçi düzenleme (Collabora Online)
- [ ] Sürükle-bırak ile serbest metin/imza konumlandırma
- [ ] Herkese açık örnek sunucu

## Teşekkür

PDF → Word/PowerPoint ve OCR mantığı [OpenMF](https://github.com/) projesindeki
yaklaşımdan uyarlanmıştır.

## Katkı ve lisans

PR'ler açık. MIT — bkz. [LICENSE](./LICENSE)
