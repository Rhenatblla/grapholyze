// lib/camera/config.js
// ---------------------------------------------------------------------------
// Konfigurasi default Assisted Camera (semua ambang batas deteksi).
// Satu tempat untuk menyetel sensitivitas cahaya, blur, dan posisi.
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIG = {
  procW: 240, // lebar canvas analisis (downscaled)
  roi: 0.8, // ukuran kotak panduan sebagai fraksi sisi terpendek frame
  aspect: 1.4142, // rasio aspek kotak panduan (A4 portrait)
  light: { min: 70, max: 205, uniformityMax: 55, gridCells: 4 }, // luminance optimal + deteksi bayangan (sebaran kecerahan antar-sel)
  blurMin: 1600, // variansi Laplacian minimum agar tajam (naik = wajib lebih tajam). Buram TIDAK boleh lolos.
  skewMaxDeg: 3, // kemiringan kertas maksimum (derajat) - toleransi 3 derajat sesuai rencana uji
  fillMin: 0.2, // luas kertas / luas kotak panduan, minimum -> di bawah ini MAJU
  fillMax: 2.0, // ... maksimum -> di atas ini MUNDUR (dilonggarkan, biar tidak gampang "terlalu dekat")
  minAreaFrac: 0.04, // luas minimum kertas terhadap seluruh frame
  solidityMin: 0.5, // luas kertas / luas quad (memastikan bentuk kertas utuh)
  edgeMarginFrac: 0.03, // jarak minimum sudut kertas dari tepi frame
  searchMarginFrac: 0.28, // batasi segmentasi ke sekitar kotak panduan (anti bocor ke latar terang)
  centerTol: 0.16, // hanya untuk info, tidak menentukan "optimal"
  motionMax: 9, // rata-rata selisih antar-frame maksimum sebelum dianggap goyang

  // Algoritma kemiringan via Sobel + histogram orientasi tepi (umpan balik "luruskan").
  rotation: {
    maxAngleDeg: 3, // toleransi kemiringan sebelum memicu peringatan (3 derajat). Rentang DETEKSI histogram tetap +-45 derajat, jadi kemiringan besar tetap terbaca lalu ditandai luruskan.
    angleStepDeg: 1, // resolusi pencarian sudut
    edgeMagnitudeThreshold: 80, // ambang magnitude Sobel agar dianggap tepi
    downsample: 150, // batas ukuran area analisis (striding) agar tetap real-time
  },

  smoothingFrames: 5, // jumlah pembacaan sudut yang dihaluskan (moving average / EMA)
};
