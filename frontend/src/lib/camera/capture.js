// lib/camera/capture.js
// ---------------------------------------------------------------------------
// Utilitas saat CAPTURE: homografi (perspective transform) + sharpen.
// (Komponen sekarang memakai deskew berbasis rotasi, namun helper homografi
//  tetap disediakan bila suatu saat dibutuhkan.)
// ---------------------------------------------------------------------------

/** Selesaikan sistem linear n x n (Gaussian elimination + partial pivoting). */
function solveLinear(A, b, n) {
  for (let col = 0; col < n; col++) {
    let piv = col;
    let max = Math.abs(A[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(A[r][col]);
      if (v > max) {
        max = v;
        piv = r;
      }
    }
    if (piv !== col) {
      const tmp = A[piv];
      A[piv] = A[col];
      A[col] = tmp;
      const tb = b[piv];
      b[piv] = b[col];
      b[col] = tb;
    }
    const pivVal = A[col][col] || 1e-9;
    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] / pivVal;
      if (f === 0) continue;
      for (let c = col; c < n; c++) A[r][c] -= f * A[col][c];
      b[r] -= f * b[col];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let c = r + 1; c < n; c++) s -= A[r][c] * x[c];
    x[r] = s / (A[r][r] || 1e-9);
  }
  return x;
}

/**
 * Hitung homografi (8 koefisien) yang memetakan from[i] -> to[i].
 * from & to: array of {x,y} panjang 4.
 */
export function getPerspectiveTransform(from, to) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = from[i];
    const { x: X, y: Y } = to[i];
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X]);
    b.push(X);
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y]);
    b.push(Y);
  }
  return solveLinear(A, b, 8); // [a,b,c,d,e,f,g,h]
}

/** Terapkan homografi ke titik (x,y). */
export function applyTransform(h, x, y) {
  const denom = h[6] * x + h[7] * y + 1;
  return {
    x: (h[0] * x + h[1] * y + h[2]) / denom,
    y: (h[3] * x + h[4] * y + h[5]) / denom,
  };
}

/** Unsharp/sharpen sederhana (in-place) untuk mempertajam hasil scan. */
export function sharpenImageData(data, w, h, amount) {
  const src = new Uint8ClampedArray(data);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      for (let k = 0; k < 3; k++) {
        const c = i + k;
        const lap = 4 * src[c] - src[c - 4] - src[c + 4] - src[c - w * 4] - src[c + w * 4];
        data[c] = src[c] + amount * lap;
      }
    }
  }
}
