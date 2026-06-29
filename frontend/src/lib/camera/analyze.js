// lib/camera/analyze.js
// ---------------------------------------------------------------------------
// Orkestrator: menggabungkan deteksi cahaya + blur + posisi menjadi satu hasil
// analisis per-frame, plus pesan panduan untuk pengguna.
// ---------------------------------------------------------------------------

import { DEFAULT_CONFIG } from "./config";
import { toGrayscaleBT601 } from "./grayscale";
import { analyzeLight, illuminationRange } from "./light";
import { analyzeBlur } from "./blur";
import { computeTargetBox, detectPaperQuad, bboxFromCorners } from "./position";
import { measureRotation, classifyRotation } from "./rotation";

/** Bangun pesan panduan dari hasil deteksi (posisi -> cahaya -> ketajaman). */
export function buildMessage(pos, light, blur, cfg) {
  if (!pos.found) return "Letakkan kertas di dalam bingkai";
  if (pos.tooSmall) return "Maju / dekatkan kamera — kertas terlalu kecil";
  if (pos.tooBig) return pos.inFrame ? "Mundur sedikit — kertas terlalu dekat" : "Mundur sedikit — kertas terpotong bingkai";
  if (pos.solidity != null && pos.solidity < cfg.solidityMin) return "Pastikan seluruh kertas terlihat & rata";
  if (!pos.straight) return "Luruskan kertas (masih miring)";
  if (light.brightnessOk === false) return light.mean < cfg.light.min ? "Kurang cahaya — tambah pencahayaan" : "Terlalu terang / silau";
  if (light.shadow) return "Ada bayangan di kertas — ratakan pencahayaan";
  if (!blur.ok) return "Gambar buram — tahan kamera lebih stabil";
  return "Sempurna! Tahan posisi & ambil gambar";
}

/** Analisis satu frame ImageData (berukuran proc). */
export function analyzeFrame(imageData, cfg = DEFAULT_CONFIG, state) {
  const pw = imageData.width;
  const ph = imageData.height;
  const gray = toGrayscaleBT601(imageData.data, pw * ph);
  const targetBox = computeTargetBox(pw, ph, cfg);

  // 1) Cahaya
  const light = analyzeLight(gray, pw, targetBox, cfg);

  // 2) Posisi (4 sudut kertas)
  const position = detectPaperQuad(gray, pw, ph, targetBox, cfg);

  // 3) Ketajaman — diukur PADA AREA KERTAS (lebih relevan untuk OCR tulisan).
  //    Jika kertas belum terdeteksi, jatuh kembali ke kotak panduan.
  const blurBox = position.corners ? bboxFromCorners(position.corners, pw, ph) : targetBox;
  const blur = analyzeBlur(gray, pw, blurBox, cfg);

  // 3b) Bayangan / cahaya tidak merata DI KERTAS: sebaran kecerahan antar-sel
  //     (grid kasar) pada area kertas. Bayangan tangan -> sebagian sel jauh
  //     lebih gelap -> sebaran besar -> dianggap belum optimal walau mean OK.
  const lightBox = position.corners ? blurBox : targetBox;
  const lightRange = illuminationRange(gray, pw, lightBox, cfg.light.gridCells);
  light.brightnessOk = light.ok; // hasil cek rata-rata kecerahan lingkungan
  light.range = lightRange;
  light.shadow = lightRange > cfg.light.uniformityMax;
  light.ok = light.brightnessOk && !light.shadow;

  // 4) Kemiringan via Sobel + Hough pada area kertas (umpan balik "luruskan").
  //    Sudut dihaluskan (EMA / moving average) memakai 'state' bila tersedia,
  //    supaya tidak lompat-lompat akibat getaran tangan alami.
  const rotMeasure = measureRotation(gray, pw, ph, blurBox, cfg, position.corners);
  let angle = rotMeasure.angle;
  if (state && rotMeasure.found) {
    const frames = cfg.smoothingFrames && cfg.smoothingFrames > 1 ? cfg.smoothingFrames : 1;
    const alpha = 2 / (frames + 1); // konversi jumlah-frame -> faktor EMA
    state.angleEma = state.angleEma == null ? angle : state.angleEma * (1 - alpha) + angle * alpha;
    angle = state.angleEma;
  }
  const rotation = classifyRotation(angle, rotMeasure.found, cfg);

  // Umpan balik kemiringan kini bersumber dari Sobel + Hough (bukan sudut quad).
  // Deteksi 4 sudut tetap dipertahankan untuk auto-crop saat capture.
  if (rotMeasure.found) {
    position.straight = rotation.ok;
    position.skew = angle;
    const solidOk = position.solidity != null && position.solidity >= cfg.solidityMin;
    position.ok = position.filled && position.straight && solidOk;
  }

  const allOK = position.ok && light.ok && blur.ok;
  const message = buildMessage(position, light, blur, cfg);

  return {
    targetBox,
    proc: { w: pw, h: ph },
    position,
    light,
    blur,
    rotation,
    allOK,
    message,
  };
}

/** Hitung dimensi proc-canvas menjaga aspek video. */
export function computeProcSize(videoW, videoH, procW) {
  const w = procW;
  const h = Math.round((procW * videoH) / videoW);
  return { w, h };
}
