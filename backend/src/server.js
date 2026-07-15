import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import FormData from 'form-data'

const execFileAsync = promisify(execFile)

// PDF -> docx/pptx ve OCR işleri Python mikro-servisine yönlendirilir
// (kanıtlanmış PyMuPDF + python-docx/pptx yaklaşımı).
const PYSERVICE_URL = process.env.PYSERVICE_URL || 'http://localhost:5001'

const app = express()
app.use(cors())

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 } // dosya başına 200MB
})

// LibreOffice ile güvenilir çalışan yön: ofis/HTML -> PDF.
const ALLOWED_INPUT_EXT = new Set(['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.html', '.htm', '.odt', '.odp', '.ods'])

app.get('/health', (_req, res) => res.json({ ok: true }))

// ---- Ofis / HTML -> PDF (LibreOffice) ----
app.post('/convert', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send('Dosya eksik.')

  const originalExt = path.extname(req.file.originalname).toLowerCase()
  if (!ALLOWED_INPUT_EXT.has(originalExt)) {
    return res.status(400).send(`Desteklenmeyen dosya türü: ${originalExt}`)
  }

  const workDir = path.join(os.tmpdir(), `convert-${crypto.randomUUID()}`)
  const inputPath = path.join(workDir, `input${originalExt}`)

  try {
    await fs.mkdir(workDir, { recursive: true })
    await fs.writeFile(inputPath, req.file.buffer)

    // Her isteğe izole LibreOffice profili: profil kilidi sorunlarını önler.
    const profileDir = path.join(workDir, 'profile')
    await fs.mkdir(profileDir, { recursive: true })

    const args = [
      '--headless', '--norestore',
      `-env:UserInstallation=file://${profileDir}`,
      '--convert-to', 'pdf', '--outdir', workDir, inputPath
    ]

    await execFileAsync('soffice', args, { timeout: 120_000 })

    const outputPath = path.join(workDir, 'input.pdf')
    const outputBuffer = await fs.readFile(outputPath)

    const baseName = path.basename(req.file.originalname, originalExt)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(baseName)}.pdf"`)
    res.setHeader('Content-Type', 'application/pdf')
    res.send(outputBuffer)
  } catch (err) {
    logError('convert', err)
    res.status(500).send('Dönüştürme başarısız oldu. Dosya bozuk olabilir veya format desteklenmiyor olabilir.')
  } finally {
    fs.rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
})

// ---- PDF -> Word / PowerPoint / OCR (Python servisine proxy) ----
// frontend tek bir backend adresiyle konuşsun diye Node, isteği Python'a iletir.
app.post('/pdf-convert', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send('Dosya eksik.')

  const targetFormat = (req.body.format || '').toLowerCase()
  const useOcr = String(req.body.ocr || 'false')
  if (!['docx', 'pptx'].includes(targetFormat)) {
    return res.status(400).send('Geçersiz hedef format.')
  }

  try {
    const form = new FormData()
    form.append('file', req.file.buffer, { filename: req.file.originalname })
    form.append('format', targetFormat)
    form.append('ocr', useOcr)

    // form-data'nın kendi submit mekanizması, stream'i ve Content-Length'i
    // doğru şekilde yönetir (native fetch ile form-data paketi uyumsuz).
    const { statusCode, body } = await submitForm(form, `${PYSERVICE_URL}/convert`)

    if (statusCode < 200 || statusCode >= 300) {
      let msg = 'Dönüştürme başarısız oldu.'
      try { msg = JSON.parse(body.toString('utf8')).error || msg } catch {}
      return res.status(statusCode).send(msg)
    }

    const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname))
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(baseName)}.${targetFormat}"`)
    res.setHeader('Content-Type', mimeFor(targetFormat))
    res.send(body)
  } catch (err) {
    logError('pdf-convert', err)
    res.status(502).send('Dönüştürme servisine ulaşılamadı. Python servisinin çalıştığından emin ol.')
  }
})

// form-data'yı hedef URL'e POST eder, yanıtı tam olarak buffer olarak toplar.
function submitForm(form, urlString) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlString)
    const options = {
      host: u.hostname,
      port: u.port || 80,
      path: u.pathname,
      method: 'POST'
    }
    form.submit(options, (err, resStream) => {
      if (err) return reject(err)
      const chunks = []
      resStream.on('data', (c) => chunks.push(c))
      resStream.on('end', () => resolve({
        statusCode: resStream.statusCode,
        body: Buffer.concat(chunks)
      }))
      resStream.on('error', reject)
    })
  })
}

// ---- PDF -> PDF/A (Ghostscript) ----
app.post('/pdfa', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send('Dosya eksik.')

  const workDir = path.join(os.tmpdir(), `pdfa-${crypto.randomUUID()}`)
  const inputPath = path.join(workDir, 'input.pdf')
  const outputPath = path.join(workDir, 'output.pdf')

  try {
    await fs.mkdir(workDir, { recursive: true })
    await fs.writeFile(inputPath, req.file.buffer)

    await execFileAsync('gs', [
      '-dPDFA=2', '-dBATCH', '-dNOPAUSE', '-dNOOUTERSAVE',
      '-sColorConversionStrategy=UseDeviceIndependentColor',
      '-sDEVICE=pdfwrite', '-dPDFACompatibilityPolicy=1',
      `-sOutputFile=${outputPath}`, inputPath
    ], { timeout: 120_000 })

    const outputBuffer = await fs.readFile(outputPath)
    const baseName = path.basename(req.file.originalname, '.pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(baseName)}-pdfa.pdf"`)
    res.setHeader('Content-Type', 'application/pdf')
    res.send(outputBuffer)
  } catch (err) {
    logError('pdfa', err)
    res.status(500).send('PDF/A dönüşümü başarısız oldu.')
  } finally {
    fs.rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
})

// ---- Word (docx) birleştirme (Python servisine proxy - docxcompose) ----
app.post('/merge-docx', upload.array('files', 50), async (req, res) => {
  if (!req.files || req.files.length < 2) {
    return res.status(400).send('En az iki .docx dosyası gerekli.')
  }
  try {
    const form = new FormData()
    for (const f of req.files) {
      form.append('files', f.buffer, { filename: f.originalname })
    }

    const { statusCode, body } = await submitForm(form, `${PYSERVICE_URL}/merge-docx`)

    if (statusCode < 200 || statusCode >= 300) {
      let msg = 'Word birleştirme başarısız oldu.'
      try { msg = JSON.parse(body.toString('utf8')).error || msg } catch {}
      return res.status(statusCode).send(msg)
    }

    res.setHeader('Content-Disposition', 'attachment; filename="birlestirilmis.docx"')
    res.setHeader('Content-Type', mimeFor('docx'))
    res.send(body)
  } catch (err) {
    logError('merge-docx', err)
    res.status(502).send('Birleştirme servisine ulaşılamadı. Python servisinin çalıştığından emin ol.')
  }
})

function logError(scope, err) {
  console.error(`[${scope}] hata:`, err.message)
  if (err.stdout) console.error(`[${scope}] stdout:`, String(err.stdout).slice(0, 2000))
  if (err.stderr) console.error(`[${scope}] stderr:`, String(err.stderr).slice(0, 2000))
}

function mimeFor(ext) {
  switch (ext) {
    case 'pdf': return 'application/pdf'
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    default: return 'application/octet-stream'
  }
}

const PORT = process.env.PORT || 8787
app.listen(PORT, () => console.log(`Backend hazır: http://localhost:${PORT}`))
