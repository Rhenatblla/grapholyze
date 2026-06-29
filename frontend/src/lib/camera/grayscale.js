// lib/camera/grayscale.js
// ---------------------------------------------------------------------------
// Utilitas grayscale (dipakai bersama oleh deteksi cahaya, blur, dan posisi).
// ---------------------------------------------------------------------------

/** Konversi RGBA -> grayscale Float32 memakai luminance BT.601. */
export function toGrayscaleBT601(data, length) {
  const gray = new Float32Array(length);
  for (let i = 0, p = 0; p < length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return gray;
}
