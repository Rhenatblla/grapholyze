// lib/camera/light.js
// ---------------------------------------------------------------------------
// Deteksi CAHAYA — mean luminance ITU-R BT.601 di dalam kotak panduan.
// ---------------------------------------------------------------------------

/** Mean luminance (BT.601) di dalam sebuah box. */
export function meanLuminance(gray, pw, box) {
  let sum = 0;
  let n = 0;
  for (let y = box.y; y < box.y + box.h; y++) {
    const row = y * pw;
    for (let x = box.x; x < box.x + box.w; x++) {
      sum += gray[row + x];
      n++;
    }
  }
  return n ? sum / n : 0;
}

/**
 * Analisis cahaya pada sebuah box.
 * @returns { mean, ok } — ok bila mean berada di rentang cfg.light.
 */
export function analyzeLight(gray, pw, box, cfg) {
  const mean = meanLuminance(gray, pw, box);
  const ok = mean >= cfg.light.min && mean <= cfg.light.max;
  return { mean, ok };
}

/**
 * Sebaran kecerahan antar-sel (deteksi BAYANGAN / cahaya tidak merata).
 * Box dibagi grid x grid sel; tiap sel dirata-ratakan. Grid yang kasar membuat
 * detail tulisan ter-rata-rata, sehingga yang tersisa hanya gradien iluminasi
 * skala besar (mis. bayangan tangan). Dikembalikan selisih sel paling terang
 * dengan paling gelap (0..255) -> makin besar = makin tidak merata.
 */
export function illuminationRange(gray, pw, box, grid) {
  const g = grid && grid > 1 ? grid : 4;
  const cw = box.w / g;
  const ch = box.h / g;
  let min = Infinity;
  let max = -Infinity;
  for (let gy = 0; gy < g; gy++) {
    for (let gx = 0; gx < g; gx++) {
      const x0 = Math.floor(box.x + gx * cw);
      const y0 = Math.floor(box.y + gy * ch);
      const x1 = Math.floor(box.x + (gx + 1) * cw);
      const y1 = Math.floor(box.y + (gy + 1) * ch);
      let sum = 0;
      let n = 0;
      for (let y = y0; y < y1; y++) {
        const row = y * pw;
        for (let x = x0; x < x1; x++) {
          sum += gray[row + x];
          n++;
        }
      }
      if (!n) continue;
      const m = sum / n;
      if (m < min) min = m;
      if (m > max) max = m;
    }
  }
  if (min === Infinity) return 0;
  return max - min;
}
