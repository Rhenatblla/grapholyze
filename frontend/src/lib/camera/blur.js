// lib/camera/blur.js
// ---------------------------------------------------------------------------
// Deteksi KETAJAMAN (variance of Laplacian) + deteksi GOYANG (selisih antar-frame).
// ---------------------------------------------------------------------------

/** Variansi Laplacian (ukuran ketajaman) di dalam sebuah box. */
export function laplacianVariance(gray, pw, box) {
  let sum = 0;
  let sum2 = 0;
  let n = 0;
  for (let y = box.y + 1; y < box.y + box.h - 1; y++) {
    for (let x = box.x + 1; x < box.x + box.w - 1; x++) {
      const c = gray[y * pw + x];
      const lap = gray[(y - 1) * pw + x] + gray[(y + 1) * pw + x] + gray[y * pw + (x - 1)] + gray[y * pw + (x + 1)] - 4 * c;
      sum += lap;
      sum2 += lap * lap;
      n++;
    }
  }
  if (!n) return 0;
  return sum2 / n - Math.pow(sum / n, 2);
}

/**
 * Rata-rata selisih antar-frame (deteksi gerakan/goyang) di dalam box, skala 0..255.
 * Pergeseran kecerahan global (auto-exposure) dihilangkan dulu (DC offset), sehingga
 * HP yang DIAM tidak salah terdeteksi goyang saat kamera menyesuaikan terang.
 */
export function frameDiffScore(prev, curr, pw, box) {
  let signed = 0;
  let n = 0;
  for (let y = box.y; y < box.y + box.h; y++) {
    const row = y * pw;
    for (let x = box.x; x < box.x + box.w; x++) {
      const i = (row + x) * 4 + 1; // kanal hijau sebagai proxy luminance
      signed += curr[i] - prev[i];
      n++;
    }
  }
  if (!n) return 0;
  const dc = signed / n; // pergeseran kecerahan global rata-rata
  let sum = 0;
  for (let y = box.y; y < box.y + box.h; y++) {
    const row = y * pw;
    for (let x = box.x; x < box.x + box.w; x++) {
      const i = (row + x) * 4 + 1;
      let d = curr[i] - prev[i] - dc;
      if (d < 0) d = -d;
      sum += d;
    }
  }
  return sum / n;
}

/**
 * Analisis ketajaman pada sebuah box.
 * @returns { variance, ok, score } — score 0..1 untuk meter fokus.
 */
export function analyzeBlur(gray, pw, box, cfg) {
  const variance = laplacianVariance(gray, pw, box);
  const ok = variance >= cfg.blurMin;
  // 1 = sangat tajam, ~0.67 = tepat di ambang.
  const score = Math.max(0, Math.min(1, variance / (cfg.blurMin * 1.5)));
  return { variance, ok, score };
}
