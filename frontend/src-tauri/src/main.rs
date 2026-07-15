// Açık PDF Araç Seti - masaüstü giriş noktası.
// PDF düzenleme mantığı zaten React/JS tarafında (WebView içinde) çalışıyor;
// bu dosya sadece pencereyi açan ince bir kabuk.

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("Tauri uygulaması başlatılırken hata oluştu");
}
