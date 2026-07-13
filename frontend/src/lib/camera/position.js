// lib/camera/position.js
// ---------------------------------------------------------------------------
// Deteksi POSISI kertas: segmentasi Otsu (ambang adaptif) + connected component
// + ekstrem sudut. Kemiringan dihitung dari TEPI KERTAS (bukan garis layar),
// jadi tidak tergantung kemiringan HP.
// ---------------------------------------------------------------------------

import { meanLuminance } from "./light";

/** Threshold Otsu dari histogram grayscale (0..255). */
export function otsuThreshold(gray, length) {
  const hist = new Float64Array(256);
  for (let p = 0; p < length; p++) {
    let v = gray[p] | 0;
    if (v < 0) v = 0;
    else if (v > 255) v = 255;
    hist[v]++;
  }
  const total = length;
  let sumAll = 0;
  for (let t = 0; t < 256; t++) sumAll += t * hist[t];
  let wB = 0;
  let sumB = 0;
  let maxBetween = 0;
  let thr = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sumAll - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > maxBetween) {
      maxBetween = between;
      thr = t;
    }
  }
  return thr;
}

function normAngle(deg) {
  let a = deg;
  while (a > 45) a -= 90;
  while (a < -45) a += 90;
  return a;
}

function edgeAngle(a, b) {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

function vertAngle(top, bottom) {
  // deviasi dari sumbu vertikal
  return (Math.atan2(bottom.x - top.x, bottom.y - top.y) * 180) / Math.PI;
}

function quadArea(c) {
  const pts = [c.tl, c.tr, c.br, c.bl];
  let area = 0;
  for (let i = 0; i < 4; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % 4];
    area += p.x * q.y - q.x * p.y;
  }
  return Math.abs(area) / 2;
}

/** Kotak pembatas (bbox) dari 4 sudut kertas, sedikit menyusut ke dalam. */
export function bboxFromCorners(c, pw, ph) {
  const xs = [c.tl.x, c.tr.x, c.br.x, c.bl.x];
  const ys = [c.tl.y, c.tr.y, c.br.y, c.bl.y];
  let minX = Math.min.apply(null, xs);
  let maxX = Math.max.apply(null, xs);
  let minY = Math.min.apply(null, ys);
  let maxY = Math.max.apply(null, ys);
  const padX = (maxX - minX) * 0.08;
  const padY = (maxY - minY) * 0.08;
  minX = Math.max(1, Math.round(minX + padX));
  maxX = Math.min(pw - 1, Math.round(maxX - padX));
  minY = Math.max(1, Math.round(minY + padY));
  maxY = Math.min(ph - 1, Math.round(maxY - padY));
  const w = Math.max(4, maxX - minX);
  const h = Math.max(4, maxY - minY);
  return { x: minX, y: minY, w, h };
}

/** Hitung kotak panduan terpusat untuk dimensi proc tertentu. */
export function computeTargetBox(pw, ph, cfg) {
  const side = Math.min(pw, ph) * cfg.roi;
  const boxH = side;
  const boxW = side / cfg.aspect;
  return {
    x: Math.round((pw - boxW) / 2),
    y: Math.round((ph - boxH) / 2),
    w: Math.round(boxW),
    h: Math.round(boxH),
  };
}

/**
 * Deteksi kertas sebagai quadrilateral (4 sudut).
 * Mengembalikan status posisi + sudut-sudut kertas dalam koordinat proc.
 */
export function detectPaperQuad(gray, pw, ph, box, cfg) {
  const len = pw * ph;
  let t = otsuThreshold(gray, len);
  // Ambang adaptif: naikkan relatif terhadap kecerahan di dalam kotak panduan,
  // supaya latar yang sama-sama terang (mis. meja kayu) tidak ikut tersegmentasi
  // bersama kertas (penyebab hasil scan "bocor" ke latar & miring).
  const boxMean = meanLuminance(gray, pw, box);
  t = Math.max(t, 110, Math.round(boxMean * 0.82));

  // Batasi segmentasi ke SEKITAR kotak panduan (kotak panduan diperlebar).
  // Mencegah area latar terang (mis. meja kena sinar) ikut tergabung lalu
  // menarik sudut kertas ke tepi frame -> salah dikira "terpotong".
  const sMargin = cfg.searchMarginFrac != null ? cfg.searchMarginFrac : 0.28;
  const sx0 = Math.max(0, Math.floor(box.x - box.w * sMargin));
  const sy0 = Math.max(0, Math.floor(box.y - box.h * sMargin));
  const sx1 = Math.min(pw - 1, Math.ceil(box.x + box.w * (1 + sMargin)));
  const sy1 = Math.min(ph - 1, Math.ceil(box.y + box.h * (1 + sMargin)));

  const visited = new Uint8Array(len);
  const stack = new Int32Array(len);
  const fcx = box.x + box.w / 2;
  const fcy = box.y + box.h / 2;
  const marginX = box.w * 0.18;
  const marginY = box.h * 0.18;
  const minArea = cfg.minAreaFrac * len;

  let best = null;

  for (let sy = sy0; sy <= sy1; sy++) {
    for (let sx = sx0; sx <= sx1; sx++) {
      const start = sy * pw + sx;
      if (visited[start] || gray[start] <= t) continue;
      // Flood fill (4-connectivity) komponen terang.
      let sp = 0;
      stack[sp++] = start;
      visited[start] = 1;
      let area = 0;
      let sumX = 0;
      let sumY = 0;
      let minSum = Infinity;
      let maxSum = -Infinity;
      let minDiff = Infinity;
      let maxDiff = -Infinity;
      let tl = null;
      let br = null;
      let tr = null;
      let bl = null;

      while (sp > 0) {
        const idx = stack[--sp];
        const x = idx % pw;
        const y = (idx / pw) | 0;
        area++;
        sumX += x;
        sumY += y;
        const s = x + y;
        const d = x - y;
        if (s < minSum) {
          minSum = s;
          tl = { x, y };
        }
        if (s > maxSum) {
          maxSum = s;
          br = { x, y };
        }
        if (d > maxDiff) {
          maxDiff = d;
          tr = { x, y };
        }
        if (d < minDiff) {
          minDiff = d;
          bl = { x, y };
        }
        if (x > sx0) {
          const n = idx - 1;
          if (!visited[n] && gray[n] > t) {
            visited[n] = 1;
            stack[sp++] = n;
          }
        }
        if (x < sx1) {
          const n = idx + 1;
          if (!visited[n] && gray[n] > t) {
            visited[n] = 1;
            stack[sp++] = n;
          }
        }
        if (y > sy0) {
          const n = idx - pw;
          if (!visited[n] && gray[n] > t) {
            visited[n] = 1;
            stack[sp++] = n;
          }
        }
        if (y < sy1) {
          const n = idx + pw;
          if (!visited[n] && gray[n] > t) {
            visited[n] = 1;
            stack[sp++] = n;
          }
        }
      }

      if (area < minArea) continue;
      const cx = sumX / area;
      const cy = sumY / area;
      // hanya komponen yang titik tengahnya berada di dalam (sekitar) kotak panduan
      if (cx < box.x - marginX || cx > box.x + box.w + marginX) continue;
      if (cy < box.y - marginY || cy > box.y + box.h + marginY) continue;

      if (!best || area > best.area) {
        best = { area, cx, cy, corners: { tl, tr, br, bl } };
      }
    }
  }

  if (!best) {
    return {
      ok: false,
      found: false,
      inFrame: false,
      centered: false,
      filled: false,
      tooSmall: false,
      tooBig: false,
      straight: false,
      skew: null,
      solidity: null,
      corners: null,
      centroid: null,
    };
  }

  const corners = best.corners;
  const qArea = quadArea(corners);
  const solidity = qArea > 0 ? Math.min(1, best.area / qArea) : 0;

  const skew = normAngle((edgeAngle(corners.tl, corners.tr) + edgeAngle(corners.bl, corners.br)) / 2);
  const skewV = normAngle((vertAngle(corners.tl, corners.bl) + vertAngle(corners.tr, corners.br)) / 2);

  const edge = Math.max(2, Math.round(Math.min(pw, ph) * cfg.edgeMarginFrac));
  const inFrame = [corners.tl, corners.tr, corners.br, corners.bl].every((p) => p.x >= edge && p.x <= pw - 1 - edge && p.y >= edge && p.y <= ph - 1 - edge);
  const straight = Math.abs(skew) <= cfg.skewMaxDeg && Math.abs(skewV) <= cfg.skewMaxDeg;
  const centered = Math.abs(best.cx - fcx) / box.w < cfg.centerTol && Math.abs(best.cy - fcy) / box.h < cfg.centerTol;
  const fill = qArea / (box.w * box.h);
  const tooSmall = fill < cfg.fillMin; // kertas terlalu kecil di bingkai -> MAJU
  // terlalu besar/terlalu dekat ATAU ada sudut keluar bingkai (terpotong) -> MUNDUR
  const tooBig = fill > cfg.fillMax;
  const filled = !tooSmall && !tooBig;
  const solidOk = solidity >= cfg.solidityMin;

  // "centered" & "inFrame" tidak lagi syarat terpisah -> lebih mudah diarahkan
  const ok = filled && straight && solidOk;
  return {
    ok,
    found: true,
    inFrame,
    centered,
    filled,
    tooSmall,
    tooBig,
    straight,
    skew,
    solidity,
    corners,
    centroid: { x: best.cx, y: best.cy },
  };
}
