// lib/camera/analyze.js
// ---------------------------------------------------------------------------
// Orkestrator HIBRIDA (gaya iPhone Notes).
//  - Tiap frame mencoba mendeteksi TEPI kertas (4 sudut) via position.js.
//    * Bila latar cukup kontras & tepi kertas jelas -> MODE QUAD: hasil akan
//      di-crop + diluruskan otomatis (perspective warp) saat capture, jadi
//      preview = KERTAS SAJA dan selalu lurus. Kemiringan TIDAK memblokir
//      kesiapan karena auto-deskew.
//    * Bila deteksi tepi gagal (mis. meja kayu terang -> tepi tak terlihat)
//      -> FALLBACK MODE BINGKAI TETAP: pengguna memaskan dokumen ke bingkai,
//      hasil dipotong tegak lurus ke bingkai, kemiringan dicek via profil
//      proyeksi tinta.
//  - Kamera tetap memandu: dokumen terdeteksi/mengisi bingkai + cahaya
//    (BT.601) + ketajaman (Laplacian) + lurus.
// ---------------------------------------------------------------------------

import { DEFAULT_CONFIG } from "./config";
import { toGrayscaleBT601 } from "./grayscale";
import { analyzeLight, illuminationRange } from "./light";
import { analyzeBlur } from "./blur";
import { computeTargetBox, detectPaperQuad, bboxFromCorners } from "./position";
import { measureSkew, classifyRotation } from "./rotation";

/**
 * Statistik isi bingkai (dipakai pada FALLBACK mode bingkai tetap):
 *  - brightFrac: seberapa besar bagian bingkai yang "terang" (kertas menutupi bingkai)
 *  - inkFrac: seberapa banyak goresan gelap (memastikan benar-benar ADA tulisan,
 *    bukan meja kosong yang kebetulan terang)
 */
function analyzeContent(gray, pw, box) {
  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.floor(box.x + box.w);
  const y1 = Math.floor(box.y + box.h);
  const hist = new Float64Array(256);
  let n = 0;
  for (let y = y0; y < y1; y++) {
    const row = y * pw;
    for (let x = x0; x < x1; x++) {
      let v = gray[row + x] | 0;
      if (v < 0) v = 0;
      else if (v > 255) v = 255;
      hist[v]++;
      n++;
    }
  }
  if (n === 0)
    return {
      brightFrac: 0,
      inkFrac: 0,
      inkSpanX: 0,
      inkSpanY: 0,
      paperLevel: 255,
    };

  // paperLevel = persentil ke-80 kecerahan bingkai (mewakili latar terang/kertas).
  let acc = 0;
  let paperLevel = 255;
  const t80 = 0.8 * n;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc >= t80) {
      paperLevel = i;
      break;
    }
  }
  const brightThr = Math.max(0, paperLevel - 25); // sedekat ini dengan latar = dianggap kertas
  const inkThr = Math.max(0, paperLevel - 50); // jauh lebih gelap dari kertas = tulisan
  let bright = 0;
  let ink = 0;
  let minIx = x1;
  let maxIx = x0;
  let minIy = y1;
  let maxIy = y0;
  for (let y = y0; y < y1; y++) {
    const row = y * pw;
    for (let x = x0; x < x1; x++) {
      const v = gray[row + x] | 0;
      if (v >= brightThr) bright++;
      if (v <= inkThr) {
        ink++;
        if (x < minIx) minIx = x;
        if (x > maxIx) maxIx = x;
        if (y < minIy) minIy = y;
        if (y > maxIy) maxIy = y;
      }
    }
  }
  // Sebaran tulisan: dokumen yang MEMENUHI bingkai punya tulisan tersebar luas;
  // kertas kecil / gerombolan noda hanya menempati sebagian kecil -> ditolak.
  const inkSpanX = ink > 0 ? (maxIx - minIx) / box.w : 0;
  const inkSpanY = ink > 0 ? (maxIy - minIy) / box.h : 0;
  return {
    brightFrac: bright / n,
    inkFrac: ink / n,
    inkSpanX,
    inkSpanY,
    paperLevel,
  };
}

/**
 * Arah geser kamera berdasarkan POSISI kertas di dalam frame.
 * Aturan: feedback menunjuk ke arah kertas berada -> pengguna menggeser kamera
 * ke sana sehingga kertas kembali ke tengah.
 *   - kertas condong ke KIRI  frame -> "geser ke kiri"
 *   - kertas condong ke KANAN frame -> "geser ke kanan"
 *   - kertas condong ke ATAS  frame -> "geser ke atas"
 *   - kertas condong ke BAWAH frame -> "geser ke bawah"
 * Hanya SATU arah (sumbu dominan) yang diberikan agar instruksi jelas & tegas.
 */
function computePosition(centroid, box, cfg) {
  if (!centroid) return { dx: 0, dy: 0, offCenter: false, hint: null };
  const fcx = box.x + box.w / 2;
  const fcy = box.y + box.h / 2;
  const dx = (centroid.x - fcx) / box.w;
  const dy = (centroid.y - fcy) / box.h;
  const tol = cfg.centerTol;
  let hint = null;
  if (Math.abs(dx) > tol || Math.abs(dy) > tol) {
    if (Math.abs(dx) >= Math.abs(dy)) hint = dx < 0 ? "kiri" : "kanan";
    else hint = dy < 0 ? "atas" : "bawah";
  }
  return { dx, dy, offCenter: hint != null, hint };
}

/**
 * Bangun pesan panduan. Prioritas (paling penting dulu; SATU instruksi jelas):
 *   1) belum ada kertas   -> arahkan ke kertas/dokumen
 *   2) kemiringan         -> luruskan kamera / sejajarkan dengan bingkai
 *   3) posisi             -> geser kiri/kanan/atas/bawah
 *   4) cahaya             -> kurang / berlebih
 *   5) bayangan           -> hindari bayangan
 *   6) fokus              -> belum tajam
 *   7) siap
 */
export function buildMessage(doc, light, blur, cfg) {
  // 1) Belum ada kertas/dokumen -> jangan beri arah palsu.
  if (!doc.documentPresent) return "Arahkan kamera ke kertas atau dokumen.";

  // 2) Kemiringan -> minta luruskan lebih dulu. Paling terlihat oleh mata,
  //    dan meluruskan biasanya sekalian membetulkan framing. Berlaku juga di
  //    mode tepi (quad): walau capture meluruskan otomatis, kertas yang
  //    terlalu miring susah dibaca & hasil warp kurang rapi.
  if (!doc.straight) return "Luruskan kamera agar dokumen sejajar dengan bingkai.";

  // 3) Posisi kertas -> geser kamera ke arah kertas berada.
  if (doc.position && doc.position.hint) {
    if (doc.position.hint === "kiri") return "Geser kamera sedikit ke kiri.";
    if (doc.position.hint === "kanan") return "Geser kamera sedikit ke kanan.";
    if (doc.position.hint === "atas") return "Geser kamera sedikit ke atas.";
    return "Geser kamera sedikit ke bawah.";
  }

  // 4) Pencahayaan global (terlalu gelap / terlalu terang).
  if (light.brightnessOk === false) return light.mean < cfg.light.min ? "Pencahayaan kurang — tambahkan cahaya pada dokumen." : "Terlalu terang — kurangi cahaya dan hindari pantulan.";

  // 5) Bayangan (cahaya tidak merata) menutupi sebagian dokumen.
  if (doc.shadow) return "Ada bayangan pada dokumen — hindari bayangan tangan atau badan.";

  // 6) Fokus / ketajaman.
  if (!blur.ok) return "Gambar belum tajam — stabilkan kamera dan tunggu hingga fokus.";

  // 7) Semua kondisi sesuai.
  return "Siap dianalisis — pertahankan posisi lalu tekan tombol.";
}

/** Analisis satu frame ImageData (berukuran proc). */
export function analyzeFrame(imageData, cfg = DEFAULT_CONFIG, state) {
  const pw = imageData.width;
  const ph = imageData.height;
  const gray = toGrayscaleBT601(imageData.data, pw * ph);
  const targetBox = computeTargetBox(pw, ph, cfg);

  // Coba deteksi TEPI kertas (gaya iPhone). Bila tepi jelas -> MODE QUAD.
  const quad = detectPaperQuad(gray, pw, ph, targetBox, cfg);
  const useQuad = quad.found && !!quad.corners && quad.solidity >= cfg.solidityMin && !quad.tooSmall && !quad.tooBig;

  // Kotak pengukuran cahaya & ketajaman: isi kertas (bbox quad) bila terdeteksi,
  // selain itu bingkai tetap.
  const measureBox = useQuad ? bboxFromCorners(quad.corners, pw, ph) : targetBox;

  // 1) Cahaya (rata-rata BT.601 + kemerataan / bayangan). Bayangan hanya INFO,
  //    TIDAK memblokir kesiapan.
  const light = analyzeLight(gray, pw, measureBox, cfg);
  const lightRange = illuminationRange(gray, pw, measureBox, cfg.light.gridCells);
  light.brightnessOk = light.ok;
  light.range = lightRange;
  const shadowMax = cfg.light.shadowMax != null ? cfg.light.shadowMax : cfg.light.uniformityMax;
  light.shadow = lightRange > shadowMax;
  light.ok = light.brightnessOk;

  // 2) Ketajaman (relevan untuk OCR tulisan tangan).
  const blur = analyzeBlur(gray, pw, measureBox, cfg);

  let mode;
  let documentPresent;
  let straight;
  let skew;
  let corners = null;
  let rotation;
  let content = null;
  let position = { dx: 0, dy: 0, offCenter: false, hint: null };

  if (useQuad) {
    // MODE QUAD (gaya iPhone): dokumen dikenali dari tepinya; saat capture
    // di-crop + diluruskan (perspective warp) -> kemiringan TIDAK memblokir.
    mode = "quad";
    documentPresent = true;
    corners = quad.corners;
    skew = quad.skew;
    // Kemiringan TETAP diberi feedback: walau capture meluruskan otomatis
    // (perspective warp), kertas yang terlalu miring (mis. >8°) susah dibaca
    // dan hasil warp-nya kurang rapi. Jadi minta user meluruskan dulu.
    const quadSkewMax = cfg.quadSkewMaxDeg != null ? cfg.quadSkewMaxDeg : 8;
    straight = Math.abs(quad.skew || 0) <= quadSkewMax;
    rotation = { angle: quad.skew || 0, found: true, ok: straight };
    // Panduan arah: dari titik tengah kertas terhadap tengah bingkai.
    position = computePosition(quad.centroid, targetBox, cfg);
  } else {
    // FALLBACK MODE BINGKAI TETAP: dokumen berisi tulisan harus memenuhi bingkai,
    // kemiringan dicek via profil proyeksi tinta.
    mode = "frame";
    content = analyzeContent(gray, pw, targetBox);
    documentPresent = content.brightFrac >= cfg.frameBrightMin && content.inkFrac >= cfg.frameInkMin && content.inkSpanX >= cfg.frameInkSpanMin && content.inkSpanY >= cfg.frameInkSpanMin;

    const rot = measureSkew(gray, pw, ph, targetBox, content.paperLevel, cfg);
    let angle = rot.angle;
    if (state && rot.found) {
      const frames = cfg.smoothingFrames && cfg.smoothingFrames > 1 ? cfg.smoothingFrames : 1;
      const alpha = 2 / (frames + 1);
      state.angleEma = state.angleEma == null ? angle : state.angleEma * (1 - alpha) + angle * alpha;
      angle = state.angleEma;
    }
    rotation = classifyRotation(angle, rot.found, cfg);
    skew = rot.found ? angle : null;
    // Bila sudut tidak terukur, jangan menghalangi -> anggap lurus.
    straight = rot.found ? rotation.ok : true;
  }

  const doc = {
    documentPresent,
    straight,
    skew,
    position,
    shadow: light.shadow,
  };
  // Siap HANYA bila: ada kertas + di tengah + tanpa bayangan + lurus + cahaya + tajam.
  const allOK = documentPresent && !position.offCenter && !light.shadow && straight && light.ok && blur.ok;
  const message = buildMessage(doc, light, blur, cfg);

  return {
    targetBox,
    proc: { w: pw, h: ph },
    mode,
    corners,
    documentPresent,
    position,
    brightFrac: content ? content.brightFrac : null,
    inkFrac: content ? content.inkFrac : null,
    inkSpanX: content ? content.inkSpanX : null,
    inkSpanY: content ? content.inkSpanY : null,
    skew,
    straight,
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
