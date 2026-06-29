// lib/camera/rotation.js
// ---------------------------------------------------------------------------
// Deteksi KEMIRINGAN dokumen via operator Sobel + HISTOGRAM ORIENTASI TEPI.
// Dipakai sebagai UMPAN BALIK "luruskan" + sudut untuk deskew saat capture.
//
// Mengapa histogram orientasi (bukan 1 garis Hough terkuat)?
//   Mengambil hanya 1 garis dominan gampang "nyangkut" ke satu goresan tulisan
//   atau deretan lubang ring -> sudut meleset (mis. lapor 0 derajat padahal
//   kertas miring). Histogram MENGAKUMULASI arah SEMUA tepi (berbobot kekuatan
//   gradien), jadi garis-garis buku + baseline tulisan + tepi kertas yang
//   sejajar saling memperkuat -> estimasi kemiringan jauh lebih stabil.
//
// Langkah:
//   (1) operator Sobel (Gx, Gy) -> arah & kekuatan gradien tiap piksel,
//   (2) arah tepi dilipat tiap 90 derajat ke [-45,45) (dua arah tepi tegak
//       lurus pada kertas/garis tulisan saling memperkuat puncak yang sama),
//   (3) hanya piksel di DALAM quad kertas yang dihitung (abaikan meja/latar),
//   (4) puncak histogram + interpolasi parabolik = sudut kemiringan.
// Deteksi 4 sudut (position.js) tetap dipertahankan untuk auto-crop saat capture.
// ---------------------------------------------------------------------------

// Nilai default bila cfg.rotation tidak diisi (mis. config lama).
const ROT_DEFAULT = {
  maxAngleDeg: 12,
  angleStepDeg: 1,
  edgeMagnitudeThreshold: 80,
  downsample: 150,
};

// Bungkus sudut ke rentang [-45, 45] (kemiringan relatif sumbu terdekat).
function normalizeAngle(deg) {
  let a = deg;
  while (a > 45) a -= 90;
  while (a < -45) a += 90;
  return a;
}

// Uji titik di dalam quad cembung (urutan tl, tr, br, bl). Dipakai untuk
// MENGABAIKAN piksel di luar kertas (mis. tepi meja, serat kayu, bayangan).
function pointInQuad(px, py, c) {
  const pts = [c.tl, c.tr, c.br, c.bl];
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const cr = (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x);
    if (cr !== 0) {
      const s = cr > 0 ? 1 : -1;
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
  }
  return true;
}

// (1)..(4) Estimasi sudut kemiringan dominan dari tepi-tepi DI DALAM kertas.
// 'box' = bbox area analisis (proc coords). 'corners' (opsional) = 4 sudut
// kertas; bila diberikan, hanya piksel di dalam quad yang dihitung.
export function measureRotation(gray, pw, ph, box, cfg, corners) {
  const rc = (cfg && cfg.rotation) || ROT_DEFAULT;

  // batasi area analisis ke bagian dalam box (perlu tetangga untuk Sobel)
  const x0 = Math.max(1, box.x);
  const y0 = Math.max(1, box.y);
  const x1 = Math.min(pw - 2, box.x + box.w - 1);
  const y1 = Math.min(ph - 2, box.y + box.h - 1);
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  if (bw < 4 || bh < 4) return { angle: 0, found: false, strength: 0 };

  // 'stride' = downsample ringan: lewati piksel agar tetap real-time.
  const maxSide = Math.max(bw, bh);
  const stride = Math.max(1, Math.ceil(maxSide / rc.downsample));
  const thr = rc.edgeMagnitudeThreshold;

  const step = rc.angleStepDeg > 0 ? rc.angleStepDeg : 1;
  const bins = Math.max(1, Math.round(90 / step));
  const hist = new Float64Array(bins);

  const useQuad = corners && corners.tl && corners.tr && corners.br && corners.bl;

  let total = 0;
  for (let y = y0; y <= y1; y += stride) {
    for (let x = x0; x <= x1; x += stride) {
      if (useQuad && !pointInQuad(x, y, corners)) continue;
      const i = y * pw + x;
      const gx = -gray[i - pw - 1] + gray[i - pw + 1] - 2 * gray[i - 1] + 2 * gray[i + 1] - gray[i + pw - 1] + gray[i + pw + 1];
      const gy = -gray[i - pw - 1] - 2 * gray[i - pw] - gray[i - pw + 1] + gray[i + pw - 1] + 2 * gray[i + pw] + gray[i + pw + 1];
      const mag = Math.sqrt(gx * gx + gy * gy);
      if (mag < thr) continue;

      // Arah gradien -> orientasi tepi. Dilipat tiap 90 derajat ke [-45,45)
      // supaya dua arah tepi tegak lurus (mis. tepi kertas vs garis tulisan)
      // jatuh ke puncak orientasi yang sama dan saling memperkuat.
      let a = (Math.atan2(gy, gx) * 180) / Math.PI;
      a = a % 90;
      if (a < 0) a += 90;
      if (a >= 45) a -= 90;
      let bin = Math.floor((a + 45) / step);
      if (bin < 0) bin = 0;
      else if (bin >= bins) bin = bins - 1;
      hist[bin] += mag;
      total += mag;
    }
  }

  if (total <= 0) return { angle: 0, found: false, strength: 0 };

  // (4) puncak histogram
  let bestBin = 0;
  let bestVal = 0;
  for (let b = 0; b < bins; b++) {
    if (hist[b] > bestVal) {
      bestVal = hist[b];
      bestBin = b;
    }
  }

  // interpolasi parabolik (presisi sub-derajat) dari tetangga puncak (sirkular).
  const bm = hist[(bestBin - 1 + bins) % bins];
  const bp = hist[(bestBin + 1) % bins];
  const denom = bm - 2 * bestVal + bp;
  const offset = denom !== 0 ? (0.5 * (bm - bp)) / denom : 0;
  const angle = normalizeAngle(-45 + (bestBin + 0.5 + offset) * step);

  // 'strength' = seberapa menonjol puncak dibanding rata-rata (orientasi dominan).
  const avg = total / bins;
  const strength = avg > 0 ? bestVal / avg : 0;
  const found = strength > 2.5;
  return { angle, found, strength };
}

// Klasifikasi sudut terhadap toleransi maxAngleDeg.
export function classifyRotation(angle, found, cfg) {
  const rc = (cfg && cfg.rotation) || ROT_DEFAULT;
  const ok = !found || Math.abs(angle) <= rc.maxAngleDeg;
  return { angle, found, ok };
}

// Convenience: ukur + klasifikasi sekaligus.
export function analyzeRotation(gray, pw, ph, box, cfg, corners) {
  const m = measureRotation(gray, pw, ph, box, cfg, corners);
  return classifyRotation(m.angle, m.found, cfg);
}
