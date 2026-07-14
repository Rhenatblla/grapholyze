// lib/camera/position.js
// ---------------------------------------------------------------------------
// Deteksi POSISI kertas: KERTAS SAJA yang dikunci, latar (meja) dibuang.
//  - Ambang via OTSU DUA TINGKAT: (1) pisahkan gelap (nat/bayangan) dari
//    terang, lalu (2) di dalam kelompok terang pisahkan MEJA dari KERTAS.
//    Ini mengatasi meja kayu terang yang selama ini ikut ke-segmentasi.
//  - Komponen yang MENYENTUH pinggir jendela ditolak (itu meja yang meluas,
//    bukan dokumen yang berada utuh di dalam bingkai).
//  - Sudut kertas dicari secara TAHAN-OUTLIER (pangkas 2% massa terluar), jadi
//    piksel nyasar tidak bisa menyeret poligon keluar -> auto-crop presisi.
// Kemiringan dihitung dari TEPI KERTAS (di modul rotation), bukan kemiringan HP.
// ---------------------------------------------------------------------------

/** Otsu pada sebuah histogram (0..255). Mengembalikan ambang + rata-rata dua kelas. */
function otsuOnHist(hist, n) {
  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * hist[i];
  let wB = 0;
  let sumB = 0;
  let maxBetween = 0;
  let thr = 127;
  let meanLow = 0;
  let meanHigh = 0;
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (wB === 0) continue;
    const wF = n - wB;
    if (wF === 0) break;
    sumB += i * hist[i];
    const mB = sumB / wB;
    const mF = (sumAll - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > maxBetween) {
      maxBetween = between;
      thr = i;
      meanLow = mB;
      meanHigh = mF;
    }
  }
  return { thr, meanLow, meanHigh };
}

/** Threshold Otsu dari histogram grayscale (tetap diekspor untuk kompatibilitas). */
export function otsuThreshold(gray, length) {
  const hist = new Float64Array(256);
  for (let p = 0; p < length; p++) {
    let v = gray[p] | 0;
    if (v < 0) v = 0;
    else if (v > 255) v = 255;
    hist[v]++;
  }
  return otsuOnHist(hist, length).thr;
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
  const boxW = side / cfg.aspect;
  // Tinggi bingkai bisa diperpanjang ke bawah lewat boxHeightScale (default 1 = A4).
  let boxH = side * (cfg.boxHeightScale || 1);
  const maxH = ph * 0.94; // jangan sampai melewati tepi frame
  if (boxH > maxH) boxH = maxH;
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

  // Batasi analisis ke SEKITAR kotak panduan (kotak panduan diperlebar).
  const sMargin = cfg.searchMarginFrac != null ? cfg.searchMarginFrac : 0.28;
  const sx0 = Math.max(0, Math.floor(box.x - box.w * sMargin));
  const sy0 = Math.max(0, Math.floor(box.y - box.h * sMargin));
  const sx1 = Math.min(pw - 1, Math.ceil(box.x + box.w * (1 + sMargin)));
  const sy1 = Math.min(ph - 1, Math.ceil(box.y + box.h * (1 + sMargin)));

  // --- Histogram kecerahan DI DALAM jendela pencarian saja. ------------------
  const winHist = new Float64Array(256);
  let winN = 0;
  for (let y = sy0; y <= sy1; y++) {
    const row = y * pw;
    for (let x = sx0; x <= sx1; x++) {
      let v = gray[row + x] | 0;
      if (v < 0) v = 0;
      else if (v > 255) v = 255;
      winHist[v]++;
      winN++;
    }
  }

  // --- OTSU DUA TINGKAT ------------------------------------------------------
  // Tingkat 1: pisahkan GELAP (nat kayu / bayangan) dari TERANG (kayu + kertas).
  const l1 = otsuOnHist(winHist, winN);
  // Tingkat 2: di dalam yang TERANG, pisahkan MEJA (agak terang) dari KERTAS (paling terang).
  const brightHist = new Float64Array(256);
  let brightN = 0;
  for (let i = l1.thr + 1; i < 256; i++) {
    brightHist[i] = winHist[i];
    brightN += winHist[i];
  }
  const l2 = otsuOnHist(brightHist, brightN);

  // Persentil kecerahan (jaga agar badan kertas tidak ikut terbuang).
  const pct = (frac) => {
    const target = frac * winN;
    let acc = 0;
    for (let i = 0; i < 256; i++) {
      acc += winHist[i];
      if (acc >= target) return i;
    }
    return 255;
  };
  const p90 = pct(0.9);

  // Pilih ambang:
  //  - Bila kelompok terang MEMANG punya dua sub-mode terpisah jelas (meja vs
  //    kertas, selisih rata-rata > 22), pakai ambang tingkat-2 -> meja dibuang.
  //  - Bila tidak (mis. kertas di atas meja gelap: cuma satu mode terang),
  //    pakai ambang tingkat-1 biasa.
  let t = l1.thr;
  const brightBimodal = brightN > 0.05 * winN && l2.meanHigh - l2.meanLow > 22;
  if (brightBimodal) t = l2.thr;
  // Lantai ambang direndahkan: kertas yang agak gelap / kurang cahaya tetap
  // bisa ter-seed sehingga IKUT TERDETEKSI (penjaga tepi di bawah mencegah
  // latar terang ikut tersegmentasi). Feedback kecerahan diberikan terpisah.
  t = Math.max(t, l1.thr, 65);
  if (p90 - 6 > 110) t = Math.min(t, p90 - 6); // jangan sampai melebihi kertas itu sendiri

  // --- GERBANG PENJAGA: apakah ada dokumen yang BERDIRI SENDIRI di dalam bingkai? --
  // Dokumen sejati dikelilingi latar (meja) yang lebih gelap, sehingga pinggir
  // jendela pencarian TIDAK didominasi area terang. Bila pinggir jendela justru
  // mayoritas terang, itu berarti area terang = MEJA yang meluas ke tepi
  // (tidak ada dokumen) -> jangan pernah beri arah palsu, laporkan tidak terdeteksi.
  let borderTotal = 0;
  let borderBright = 0;
  for (let x = sx0; x <= sx1; x++) {
    if (gray[sy0 * pw + x] > t) borderBright++;
    if (gray[sy1 * pw + x] > t) borderBright++;
    borderTotal += 2;
  }
  for (let y = sy0; y <= sy1; y++) {
    if (gray[y * pw + sx0] > t) borderBright++;
    if (gray[y * pw + sx1] > t) borderBright++;
    borderTotal += 2;
  }
  if (borderTotal > 0 && borderBright / borderTotal > 0.5) {
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

  // HYSTERESIS (dua ambang, seperti Canny): seed hanya dari piksel SANGAT terang
  // (> t), lalu TUMBUHKAN komponen ke piksel yang lebih gelap (> tLow) selama
  // menyatu. Dengan begini bagian kertas yang KENA BAYANGAN tetap ikut sebagai
  // satu kertas utuh (bukan cuma bagian terangnya), sementara latar/meja yang
  // lebih gelap dari tLow tetap dibuang.
  // tLow = batas KERTAS-vs-LATAR (Otsu tingkat-1). Tumbuhkan komponen sampai
  // batas ini supaya SELURUH kertas ikut walau bagian atas gelap karena
  // bayangan (jangan pakai t-70 yang masih memotong bayangan kuat). Penjaga
  // tepi di atas sudah menolak kasus meja terang, jadi ini aman.
  let tLow = l1.thr;
  if (tLow > t - 8) tLow = t - 8;
  if (tLow < 1) tLow = 1;

  const visited = new Uint8Array(len);
  const stack = new Int32Array(len);
  const comp = new Int32Array(len); // indeks piksel komponen aktif (untuk sudut tahan-outlier)
  const fcx = box.x + box.w / 2;
  const fcy = box.y + box.h / 2;
  const marginX = box.w * 0.18;
  const marginY = box.h * 0.18;
  const minArea = cfg.minAreaFrac * len;
  const winPerim = 2 * (sx1 - sx0 + (sy1 - sy0));
  const borderReject = 0.3 * winPerim; // menyentuh pinggir jendela terlalu banyak = MEJA

  let best = null;

  for (let sy = sy0; sy <= sy1; sy++) {
    for (let sx = sx0; sx <= sx1; sx++) {
      const start = sy * pw + sx;
      if (visited[start] || gray[start] <= t) continue;
      // Flood fill (4-connectivity) komponen terang.
      let sp = 0;
      stack[sp++] = start;
      visited[start] = 1;
      let ci = 0;
      let area = 0;
      let sumX = 0;
      let sumY = 0;
      let borderHits = 0;

      while (sp > 0) {
        const idx = stack[--sp];
        comp[ci++] = idx;
        const x = idx % pw;
        const y = (idx / pw) | 0;
        area++;
        sumX += x;
        sumY += y;
        if (x === sx0 || x === sx1 || y === sy0 || y === sy1) borderHits++;
        if (x > sx0) {
          const n = idx - 1;
          if (!visited[n] && gray[n] > tLow) {
            visited[n] = 1;
            stack[sp++] = n;
          }
        }
        if (x < sx1) {
          const n = idx + 1;
          if (!visited[n] && gray[n] > tLow) {
            visited[n] = 1;
            stack[sp++] = n;
          }
        }
        if (y > sy0) {
          const n = idx - pw;
          if (!visited[n] && gray[n] > tLow) {
            visited[n] = 1;
            stack[sp++] = n;
          }
        }
        if (y < sy1) {
          const n = idx + pw;
          if (!visited[n] && gray[n] > tLow) {
            visited[n] = 1;
            stack[sp++] = n;
          }
        }
      }

      if (area < minArea) continue;
      // TOLAK komponen yang menyentuh pinggir jendela terlalu banyak (itu meja).
      if (borderHits > borderReject) continue;
      const cx = sumX / area;
      const cy = sumY / area;
      // hanya komponen yang titik tengahnya berada di dalam (sekitar) kotak panduan
      if (cx < box.x - marginX || cx > box.x + box.w + marginX) continue;
      if (cy < box.y - marginY || cy > box.y + box.h + marginY) continue;

      if (!best || area > best.area) {
        best = { area, cx, cy, pixels: comp.slice(0, ci) };
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

  // --- Sudut yang TAHAN-OUTLIER --------------------------------------------
  // Pangkas 2% massa terluar (histogram kolom & baris), lalu cari sudut HANYA di
  // dalam kotak terpangkas. Tetap pakai ekstrem x+y / x-y agar rotasi tertangani.
  const cpx = best.pixels;
  const cnt = cpx.length;
  const colCount = new Int32Array(pw);
  const rowCount = new Int32Array(ph);
  for (let i = 0; i < cnt; i++) {
    const idx = cpx[i];
    colCount[idx % pw]++;
    rowCount[(idx / pw) | 0]++;
  }
  const trim = 0.02;
  const lowBound = (counts, n) => {
    const target = trim * cnt;
    let acc = 0;
    for (let i = 0; i < n; i++) {
      acc += counts[i];
      if (acc >= target) return i;
    }
    return 0;
  };
  const highBound = (counts, n) => {
    const target = trim * cnt;
    let acc = 0;
    for (let i = n - 1; i >= 0; i--) {
      acc += counts[i];
      if (acc >= target) return i;
    }
    return n - 1;
  };
  const minXt = lowBound(colCount, pw);
  const maxXt = highBound(colCount, pw);
  const minYt = lowBound(rowCount, ph);
  const maxYt = highBound(rowCount, ph);

  let minSum = Infinity;
  let maxSum = -Infinity;
  let minDiff = Infinity;
  let maxDiff = -Infinity;
  let tl = null;
  let br = null;
  let tr = null;
  let bl = null;
  for (let i = 0; i < cnt; i++) {
    const idx = cpx[i];
    const x = idx % pw;
    const y = (idx / pw) | 0;
    if (x < minXt || x > maxXt || y < minYt || y > maxYt) continue;
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
  }

  const corners = { tl, tr, br, bl };
  const qArea = quadArea(corners);
  const solidity = qArea > 0 ? Math.min(1, best.area / qArea) : 0;

  const skew = normAngle((edgeAngle(corners.tl, corners.tr) + edgeAngle(corners.bl, corners.br)) / 2);
  const skewV = normAngle((vertAngle(corners.tl, corners.bl) + vertAngle(corners.tr, corners.br)) / 2);

  const edge = Math.max(2, Math.round(Math.min(pw, ph) * cfg.edgeMarginFrac));
  const inFrame = [corners.tl, corners.tr, corners.br, corners.bl].every((p) => p.x >= edge && p.x <= pw - 1 - edge && p.y >= edge && p.y <= ph - 1 - edge);
  const straight = Math.abs(skew) <= cfg.skewMaxDeg && Math.abs(skewV) <= cfg.skewMaxDeg;
  // Titik tengah dari sudut terpangkas (lebih stabil daripada centroid mentah).
  const bcx = (corners.tl.x + corners.tr.x + corners.br.x + corners.bl.x) / 4;
  const bcy = (corners.tl.y + corners.tr.y + corners.br.y + corners.bl.y) / 4;
  const centered = Math.abs(bcx - fcx) / box.w < cfg.centerTol && Math.abs(bcy - fcy) / box.h < cfg.centerTol;
  const fill = qArea / (box.w * box.h);
  const tooSmall = fill < cfg.fillMin; // kertas terlalu kecil di bingkai -> MAJU
  const tooBig = fill > cfg.fillMax; // terlalu besar / terlalu dekat -> MUNDUR
  const filled = !tooSmall && !tooBig;
  const solidOk = solidity >= cfg.solidityMin;

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
    centroid: { x: bcx, y: bcy },
  };
}
