"""
PDF/ofis dönüştürme mikro-servisi (Flask).
OpenMF projesindeki server.py temel alınarak uyarlanmıştır.
"""
import os
import shutil
import tempfile

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

from app.converter import (
    convert,
    UnsupportedConversionError,
    ConversionError,
    LibreOfficeNotFoundError,
)

app = Flask(__name__)
CORS(app)

MAX_CONTENT_LENGTH = 200 * 1024 * 1024  # 200MB
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/convert', methods=['POST'])
def convert_file():
    if 'file' not in request.files:
        return jsonify({'error': 'Dosya sağlanmadı.'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'Dosya seçilmedi.'}), 400

    target_format = request.form.get('format', '').strip().lower().lstrip('.')
    if not target_format:
        return jsonify({'error': 'Hedef format belirtilmedi.'}), 400

    use_ocr = request.form.get('ocr', 'false').lower() in ('true', '1', 'yes')

    ext = os.path.splitext(file.filename)[1].lower().lstrip('.')
    if not ext:
        return jsonify({'error': 'Girdi dosya formatı belirlenemedi.'}), 400

    tmpdir = tempfile.mkdtemp(prefix='pdf_convert_')
    input_path = os.path.join(tmpdir, f"input.{ext}")
    file.save(input_path)

    try:
        output_path = convert(
            input_path=input_path,
            target_format=target_format,
            output_dir=tmpdir,
            pre_ocr=use_ocr,
        )
        download_name = f"{os.path.splitext(file.filename)[0]}.{target_format}"
        return send_file(output_path, as_attachment=True, download_name=download_name)
    except UnsupportedConversionError as e:
        return jsonify({'error': str(e)}), 400
    except LibreOfficeNotFoundError as e:
        return jsonify({'error': str(e)}), 500
    except ConversionError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'Beklenmeyen hata: {e}'}), 500
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


@app.route('/merge-docx', methods=['POST'])
def merge_docx_endpoint():
    files = request.files.getlist('files')
    if not files or len(files) < 2:
        return jsonify({'error': 'En az iki .docx dosyası gerekli.'}), 400

    tmpdir = tempfile.mkdtemp(prefix='docx_merge_')
    try:
        input_paths = []
        for i, f in enumerate(files):
            if not f.filename.lower().endswith('.docx'):
                return jsonify({'error': f'Yalnızca .docx desteklenir: {f.filename}'}), 400
            p = os.path.join(tmpdir, f'input_{i:03d}.docx')
            f.save(p)
            input_paths.append(p)

        from app.converter import merge_docx
        output_path = merge_docx(input_paths, tmpdir)
        return send_file(output_path, as_attachment=True, download_name='birlestirilmis.docx')
    except Exception as e:
        return jsonify({'error': f'Birleştirme başarısız: {e}'}), 500
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
