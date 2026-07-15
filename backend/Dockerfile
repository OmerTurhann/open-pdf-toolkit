FROM node:20-bookworm-slim

# LibreOffice: ofis formatı dönüşümleri; Ghostscript: PDF/A dönüşümü.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    libreoffice-impress \
    libreoffice-calc \
    libreoffice-draw \
    ghostscript \
    fonts-liberation fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src

ENV PORT=8787
EXPOSE 8787

CMD ["node", "src/server.js"]
