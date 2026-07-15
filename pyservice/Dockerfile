FROM python:3.11-slim-bookworm

# LibreOffice: ofis -> PDF dönüşümleri
# ocrmypdf + tesseract: taranmış PDF'ler için OCR (İngilizce + Türkçe)
# poppler-utils: PDF işleme yardımcıları
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    libreoffice-impress \
    libreoffice-calc \
    ocrmypdf \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-tur \
    poppler-utils \
    fonts-liberation fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app

ENV PORT=5001
EXPOSE 5001

# gunicorn ile üretim WSGI sunucusu; LibreOffice/OCR uzun sürebildiğinden timeout yüksek.
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "--timeout", "300", "app.server:app"]
