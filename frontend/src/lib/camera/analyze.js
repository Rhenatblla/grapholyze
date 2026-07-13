// lib/camera/analyze.js
// ---------------------------------------------------------------------------
// Orkestrator: menggabungkan deteksi cahaya + blur + posisi menjadi satu hasil
// analisis per-frame, plus pesan panduan untuk pengguna.
// ---------------------------------------------------------------------------

import { DEFAULT_CONFIG } from './config'
import { toGrayscaleBT601 } from './grayscale'
import { analyzeLight, illuminationRange } from './light'
import { analyzeBlur } from './blur'
import { computeTargetBox, detectPaperQuad, bboxFromCorners } from './position'
import { measureRotation, classifyRotation } from './rotation'

/** Bangun pesan panduan real-time (prioritas: deteksi -> jarak -> posisi -> kemiringan -> cahaya -> fokus). */
export function buildMessage(pos, light, blur, cfg) {
  // 1) Dokumen belum terdeteksi / belum utuh
  if (!pos.found || (pos.solidity != null && pos.solidity < cfg.solidityMin))
    return 'Dokumen belum terdeteksi — Arahkan kamera ke seluruh halaman.'

  // 2) Jarak kamera
  if (pos.tooSmall) return 'Dokumen terlalu jauh — Dekatkan kamera.'
  if (pos.tooBig) return 'Dokumen terlalu dekat — Jauhkan kamera.'

  // 3) Posisi terhadap tengah bingkai (pilih penyimpangan terbesar).
  //    Konvensi INTUITIF (diminta pengguna): sebut arah BERLAWANAN dengan letak
  //    kertas -> kertas di bawah pusat = "naikkan kamera", kertas di kanan =
  //    "geser ke kiri", dst. Pesan hanya berisi AKSI agar mudah dipahami.
  if (!pos.centered && pos.offsetX != null && pos.offsetY != null) {
    if (Math.abs(pos.offsetX) >= Math.abs(pos.offsetY)) {
      return pos.offsetX > 0
        ? 'Arahkan kamera sedikit ke kiri.'
        : 'Arahkan kamera sedikit ke kanan.'
    }
    return pos.offsetY > 0
      ? 'Arahkan kamera sedikit ke atas.'
      : 'Arahkan kamera sedikit ke bawah.'
  }

  // 4) Kemiringan (dengan arah bila sudut diketahui)
  if (!pos.straight) {
    if (pos.skew != null && Math.abs(pos.skew) > cfg.skewMaxDeg) {
      // Konvensi arah: skew > 0 -> putar ke kanan. Bila saat uji terasa terbalik,
      // cukup tukar string 'kanan' <-> 'kiri' pada dua baris di bawah ini.
      return pos.skew > 0
        ? 'Dokumen miring — Putar ponsel sedikit ke kanan.'
        : 'Dokumen miring — Putar ponsel sedikit ke kiri.'
    }
    return 'Dokumen masih miring — Luruskan dengan bingkai panduan.'
  }

  // 5) Pencahayaan
  if (light.brightnessOk === false)
    return light.mean < cfg.light.min
      ? 'Pencahayaan kurang — Tambahkan cahaya pada dokumen.'
      : 'Terlalu terang — Kurangi cahaya dan hindari pantulan.'
  if (light.shadow) return 'Pencahayaan belum merata — Hindari bayangan pada dokumen.'

  // 6) Fokus / ketajaman
  if (!blur.ok) return 'Gambar belum tajam — Stabilkan kamera dan tunggu hingga fokus.'

  // 7) Semua kondisi sesuai
  return 'Siap dianalisis — Pertahankan posisi lalu tekan Capture.'
}

/** Analisis satu frame ImageData (berukuran proc). */
export function analyzeFrame(imageData, cfg = DEFAULT_CONFIG, state) {
  const pw = imageData.width
  const ph = imageData.height
  const gray = toGrayscaleBT601(imageData.data, pw * ph)
  const targetBox = computeTargetBox(pw, ph, cfg)

  // 1) Cahaya
  const light = analyzeLight(gray, pw, targetBox, cfg)

  // 2) Posisi (4 sudut kertas)
  const position = detectPaperQuad(gray, pw, ph, targetBox, cfg)

  // 3) Ketajaman — diukur PADA AREA KERTAS (lebih relevan untuk OCR tulisan).
  //    Jika kertas belum terdeteksi, jatuh kembali ke kotak panduan.
  const blurBox = position.corners ? bboxFromCorners(position.corners, pw, ph) : targetBox
  const blur = analyzeBlur(gray, pw, blurBox, cfg)

  // 3b) Bayangan / cahaya tidak merata DI KERTAS: sebaran kecerahan antar-sel
  //     (grid kasar) pada area kertas. Bayangan tangan -> sebagian sel jauh
  //     lebih gelap -> sebaran besar -> dianggap belum optimal walau mean OK.
  const lightBox = position.corners ? blurBox : targetBox
  const lightRange = illuminationRange(gray, pw, lightBox, cfg.light.gridCells)
  light.brightnessOk = light.ok // hasil cek rata-rata kecerahan lingkungan
  light.range = lightRange
  light.shadow = lightRange > cfg.light.uniformityMax
  light.ok = light.brightnessOk && !light.shadow

  // 4) Kemiringan via Sobel + Hough pada area kertas (umpan balik "luruskan").
  //    Sudut dihaluskan (EMA / moving average) memakai 'state' bila tersedia,
  //    supaya tidak lompat-lompat akibat getaran tangan alami.
  const rotMeasure = measureRotation(gray, pw, ph, blurBox, cfg, position.corners)
  let angle = rotMeasure.angle
  if (state && rotMeasure.found) {
    const frames = cfg.smoothingFrames && cfg.smoothingFrames > 1 ? cfg.smoothingFrames : 1
    const alpha = 2 / (frames + 1) // konversi jumlah-frame -> faktor EMA
    state.angleEma = state.angleEma == null ? angle : state.angleEma * (1 - alpha) + angle * alpha
    angle = state.angleEma
  }
  const rotation = classifyRotation(angle, rotMeasure.found, cfg)

  // Umpan balik kemiringan kini bersumber dari Sobel + Hough (bukan sudut quad).
  // Deteksi 4 sudut tetap dipertahankan untuk auto-crop saat capture.
  if (rotMeasure.found) {
    position.straight = rotation.ok
    position.skew = angle
    const solidOk = position.solidity != null && position.solidity >= cfg.solidityMin
    position.ok = position.filled && position.straight && solidOk
  }

  // Arah posisi kertas terhadap pusat kotak panduan -> feedback kiri/kanan/atas/bawah.
  if (position.found && position.centroid) {
    const cx = targetBox.x + targetBox.w / 2
    const cy = targetBox.y + targetBox.h / 2
    position.offsetX = (position.centroid.x - cx) / targetBox.w // + = kertas condong ke KANAN
    position.offsetY = (position.centroid.y - cy) / targetBox.h // + = kertas condong ke BAWAH
    // "centered" kini ikut menentukan kesiapan (spesifikasi: posisi harus sesuai).
    position.ok = position.ok && position.centered
  }

  const allOK = position.ok && light.ok && blur.ok
  const message = buildMessage(position, light, blur, cfg)

  return {
    targetBox,
    proc: { w: pw, h: ph },
    position,
    light,
    blur,
    rotation,
    allOK,
    message,
  }
}

/** Hitung dimensi proc-canvas menjaga aspek video. */
export function computeProcSize(videoW, videoH, procW) {
  const w = procW
  const h = Math.round((procW * videoH) / videoW)
  return { w, h }
}