"use client";

// components/AssistedCamera.jsx
// ---------------------------------------------------------------------------
// Komponen kamera berpemandu untuk Grapholyze (JavaScript murni).
// - Akses kamera (getUserMedia, facingMode environment, resolusi tinggi)
// - Loop analisis: posisi 4-sudut kertas, cahaya (BT.601), blur (Laplacian)
// - Overlay poligon mengikuti BENTUK kertas, dengan smoothing (anti-jitter)
// - Tombol capture hanya muncul saat optimal & BENAR-BENAR diam
// - Saat capture: auto-crop + luruskan + pertajam kertas saja (seperti scan)
// - onCapture(dataUrl, blob) dipanggil saat gambar diambil
//
// Props:
//   onCapture       (dataUrl, blob) => void
//   config          objek override DetectionConfig
//   stableFrames    number (default 4)
//   intervalMs      number (default 130)
//   captureQuality  number 0..1 (default 0.98)
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeFrame, applyTransform, computeProcSize, DEFAULT_CONFIG, frameDiffScore, getPerspectiveTransform, sharpenImageData } from "../lib/cameraDetection";
import styles from "./AssistedCamera.module.css";

const MAX_OUT_DIM = 2400; // batas dimensi hasil crop (jaga ketajaman)

export default function AssistedCamera({ onCapture, config, stableFrames = 3, intervalMs = 130, captureQuality = 0.98 }) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const procRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const lastRunRef = useRef(0);
  const stableRef = useRef(0);
  const frozenRef = useRef(false);
  const lastResultRef = useRef(null);
  const smoothCornersRef = useRef(null);
  const prevFrameRef = useRef(null);
  const motionEmaRef = useRef(0);
  const rotStateRef = useRef({}); // state EMA untuk smoothing sudut kemiringan

  const [status, setStatus] = useState({ kind: "idle" });
  const [result, setResult] = useState(null);
  const [canCapture, setCanCapture] = useState(false);
  const [captured, setCaptured] = useState(null);

  // ---------------- Camera lifecycle ----------------
  const stopCamera = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) streamRef.current.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }, []);

  // ---------------- Overlay drawing ----------------
  const drawOverlay = useCallback((res) => {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay) return;
    const rect = video.getBoundingClientRect();
    overlay.width = rect.width;
    overlay.height = rect.height;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    const pw = res.proc.w;
    const ph = res.proc.h;
    const sx = overlay.width / pw;
    const sy = overlay.height / ph;
    const pos = res.position;
    const col = res.allOK ? "#16a34a" : pos.found ? "#d97706" : "#dc2626";

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const corners = pos.found && pos.corners ? pos.corners : null;

    if (corners) {
      // BOUNDING BOX MENGIKUTI BENTUK KERTAS (poligon dari 4 sudut hasil deteksi).
      // Inilah fungsi sebenarnya: memandu user MELURUSKAN kertas. Kalau kertas
      // miring, poligonnya ikut miring (bukan kotak statis yang menyesatkan).
      const q = {
        tl: { x: corners.tl.x * sx, y: corners.tl.y * sy },
        tr: { x: corners.tr.x * sx, y: corners.tr.y * sy },
        br: { x: corners.br.x * sx, y: corners.br.y * sy },
        bl: { x: corners.bl.x * sx, y: corners.bl.y * sy },
      };

      // Gelapkan SEMUA area di luar poligon kertas (fokus penuh ke kertas).
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.rect(0, 0, overlay.width, overlay.height);
      ctx.moveTo(q.tl.x, q.tl.y);
      ctx.lineTo(q.bl.x, q.bl.y);
      ctx.lineTo(q.br.x, q.br.y);
      ctx.lineTo(q.tr.x, q.tr.y);
      ctx.closePath();
      ctx.fill("evenodd");

      // Garis poligon mengikuti tepi kertas; warna ikut status.
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(q.tl.x, q.tl.y);
      ctx.lineTo(q.tr.x, q.tr.y);
      ctx.lineTo(q.br.x, q.br.y);
      ctx.lineTo(q.bl.x, q.bl.y);
      ctx.closePath();
      ctx.stroke();

      // Titik di tiap sudut (aksen + bantu user lihat sudut terdeteksi).
      ctx.fillStyle = col;
      for (const p of [q.tl, q.tr, q.br, q.bl]) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Kertas belum terdeteksi: kotak panduan statis putus-putus = "taruh di sini".
      const b = res.targetBox;
      const bx = b.x * sx;
      const by = b.y * sy;
      const bw = b.w * sx;
      const bh = b.h * sy;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.rect(0, 0, overlay.width, overlay.height);
      ctx.rect(bx, by, bw, bh);
      ctx.fill("evenodd");
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.setLineDash([]);
    }
  }, []);

  // ---------------- Analysis loop ----------------
  const loop = useCallback(
    (ts) => {
      rafRef.current = requestAnimationFrame(loop);
      if (frozenRef.current) return;
      if (ts - lastRunRef.current < intervalMs) return;
      lastRunRef.current = ts;

      const video = videoRef.current;
      const proc = procRef.current;
      if (!video || !proc || video.readyState < 2) return;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;

      const size = computeProcSize(vw, vh, cfg.procW);
      proc.width = size.w;
      proc.height = size.h;
      const pctx = proc.getContext("2d", { willReadFrequently: true });
      if (!pctx) return;
      pctx.drawImage(video, 0, 0, size.w, size.h);
      const imageData = pctx.getImageData(0, 0, size.w, size.h);

      const res = analyzeFrame(imageData, cfg, rotStateRef.current);

      // Deteksi goyang (motion blur): selisih antar-frame di kotak panduan,
      // dihaluskan (EMA) agar derau/getaran sesaat saat HP DIAM tidak salah deteksi.
      let motion = 0;
      const prevFrame = prevFrameRef.current;
      if (prevFrame && prevFrame.length === imageData.data.length) {
        motion = frameDiffScore(prevFrame, imageData.data, size.w, res.targetBox);
      }
      prevFrameRef.current = new Uint8ClampedArray(imageData.data);
      const motionEma = motionEmaRef.current * 0.6 + motion * 0.4;
      motionEmaRef.current = motionEma;
      // Tandai goyang HANYA jika: ada kertas + gerakan besar berkelanjutan + kertas
      // memang jadi kurang tajam (variansi turun). Jadi HP diam/kertas tajam tidak
      // akan ditandai goyang.
      const shaking = prevFrame != null && res.position.found && motionEma > cfg.motionMax && res.blur.variance < cfg.blurMin * 1.25;
      res.motion = motionEma;
      res.shaking = shaking;
      if (shaking) {
        res.blur = { ...res.blur, ok: false, score: Math.min(res.blur.score, 0.2) };
        res.allOK = false;
        res.message = "Kamera goyang — kertas buram, tahan stabil";
      }

      // Smoothing sudut (anti-jitter) + deteksi "diam"
      const pos = res.position;
      let moving = true;
      if (pos.found && pos.corners) {
        const smoothed = smoothQuad(smoothCornersRef.current, pos.corners, 0.4);
        // ambang "diam" dilonggarkan supaya tombol tidak susah muncul karena getaran kecil
        moving = maxCornerDelta(smoothCornersRef.current, smoothed) > Math.max(3, size.w * 0.022);
        smoothCornersRef.current = smoothed;
        res.position.corners = smoothed; // pakai sudut halus untuk overlay + capture
      } else {
        smoothCornersRef.current = null;
      }

      lastResultRef.current = res;
      setResult(res);
      drawOverlay(res);

      // Histeresis tombol capture: butuh beberapa frame "mantap" untuk AKTIF, dan
      // baru NONAKTIF setelah beberapa frame buruk berturut-turut. Mencegah tombol
      // berkedip hilang-muncul saat indikator sudah hijau.
      const steady = res.allOK && !moving;
      if (steady) stableRef.current = Math.min(stableFrames + 4, stableRef.current + 1);
      else stableRef.current = Math.max(0, stableRef.current - 1);
      setCanCapture(stableRef.current >= stableFrames);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intervalMs, stableFrames, drawOverlay],
  );

  const startCamera = useCallback(async () => {
    setStatus({ kind: "starting" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{ focusMode: "continuous" }],
        },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setStatus({ kind: "running" });
      lastRunRef.current = 0;
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setStatus({
        kind: "error",
        message: "Tidak bisa mengakses kamera: " + message + ". Pastikan halaman via HTTPS/localhost dan izin kamera diberikan.",
      });
    }
  }, [loop]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ---------------- Capture (auto-crop / scan) ----------------
  const doCapture = useCallback(() => {
    const video = videoRef.current;
    const res = lastResultRef.current;
    if (!video) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    const full = document.createElement("canvas");
    full.width = vw;
    full.height = vh;
    const fctx = full.getContext("2d");
    if (!fctx) return;
    fctx.drawImage(video, 0, 0, vw, vh);

    let outCanvas = full;

    const corners = res && res.position && res.position.corners;
    if (corners) {
      const ax = vw / res.proc.w;
      const ay = vh / res.proc.h;
      const pts = [corners.tl, corners.tr, corners.br, corners.bl].map((p) => ({
        x: p.x * ax,
        y: p.y * ay,
      }));

      // Dimensi output dari panjang sisi-sisi kertas (hasil = KERTAS SAJA).
      let outW = Math.round(Math.max(dist(pts[0], pts[1]), dist(pts[3], pts[2])));
      let outH = Math.round(Math.max(dist(pts[0], pts[3]), dist(pts[1], pts[2])));
      const scale = Math.min(1, MAX_OUT_DIM / Math.max(outW, outH));
      outW = Math.max(1, Math.round(outW * scale));
      outH = Math.max(1, Math.round(outH * scale));

      // WARP PERSPEKTIF: petakan persegi output -> quad kertas di sumber.
      // Sekaligus LURUSKAN + buang distorsi perspektif + buang SEMUA latar
      // (meja/bayangan/HP) karena hanya area di dalam 4 sudut yang diambil.
      const dst = [
        { x: 0, y: 0 },
        { x: outW, y: 0 },
        { x: outW, y: outH },
        { x: 0, y: outH },
      ];
      const hmat = getPerspectiveTransform(dst, [pts[0], pts[1], pts[2], pts[3]]);

      const srcData = fctx.getImageData(0, 0, vw, vh);
      const sd = srcData.data;

      outCanvas = document.createElement("canvas");
      outCanvas.width = outW;
      outCanvas.height = outH;
      const octx = outCanvas.getContext("2d");
      const outImg = octx.createImageData(outW, outH);
      const od = outImg.data;

      // Sampling bilinear untuk tiap piksel output (halus, tidak pecah).
      for (let y = 0; y < outH; y++) {
        for (let x = 0; x < outW; x++) {
          const s = applyTransform(hmat, x, y);
          let u = s.x;
          let v = s.y;
          if (u < 0) u = 0;
          else if (u > vw - 1) u = vw - 1;
          if (v < 0) v = 0;
          else if (v > vh - 1) v = vh - 1;
          const x0 = u | 0;
          const y0 = v | 0;
          const x1 = x0 + 1 < vw ? x0 + 1 : x0;
          const y1 = y0 + 1 < vh ? y0 + 1 : y0;
          const fx = u - x0;
          const fy = v - y0;
          const i00 = (y0 * vw + x0) * 4;
          const i10 = (y0 * vw + x1) * 4;
          const i01 = (y1 * vw + x0) * 4;
          const i11 = (y1 * vw + x1) * 4;
          const o = (y * outW + x) * 4;
          for (let k = 0; k < 3; k++) {
            const top = sd[i00 + k] * (1 - fx) + sd[i10 + k] * fx;
            const bot = sd[i01 + k] * (1 - fx) + sd[i11 + k] * fx;
            od[o + k] = (top * (1 - fy) + bot * fy) | 0;
          }
          od[o + 3] = 255;
        }
      }

      sharpenImageData(od, outW, outH, 0.6); // pertajam teks hasil scan
      octx.putImageData(outImg, 0, 0);
    }

    const dataUrl = outCanvas.toDataURL("image/jpeg", captureQuality);
    setCaptured(dataUrl);
    frozenRef.current = true;
    setCanCapture(false);
    outCanvas.toBlob((blob) => onCapture && onCapture(dataUrl, blob), "image/jpeg", captureQuality);
  }, [captureQuality, onCapture]);

  const retake = useCallback(() => {
    setCaptured(null);
    frozenRef.current = false;
    stableRef.current = 0;
    smoothCornersRef.current = null;
  }, []);

  // ---------------- Render ----------------
  const indicators = result
    ? [
        {
          key: "pos",
          label: "Posisi",
          ok: result.position.ok,
          value: result.position.skew == null ? "–" : result.position.skew.toFixed(1) + "°",
        },
        { key: "light", label: "Cahaya", ok: result.light.ok, value: result.light.shadow ? "bayangan" : String(Math.round(result.light.mean)) },
        { key: "blur", label: "Ketajaman", ok: result.blur.ok, value: String(Math.round(result.blur.variance)) },
      ]
    : [];

  return (
    <div className={styles.stage}>
      <video ref={videoRef} className={styles.video} playsInline muted autoPlay />
      <canvas ref={overlayRef} className={styles.overlay} />
      <canvas ref={procRef} className={styles.procCanvas} />
      {captured && <img src={captured} className={styles.captured} alt="Hasil scan kertas" />}

      {status.kind === "running" && (
        <>
          <div className={styles.hud}>
            {indicators.map((it) => (
              <div key={it.key} className={styles.chip}>
                <span className={`${styles.dot} ${it.ok ? styles.dotOk : ""}`} />
                {it.label} <span className={styles.val}>{it.value}</span>
              </div>
            ))}
          </div>

          {!captured && result && result.position.found && (
            <div className={styles.focusWrap}>
              <div className={styles.focusRow}>
                <span className={`${styles.focusLabel} ${result.blur.ok ? styles.focusOk : ""}`}>{result.blur.ok ? "Fokus tajam" : result.shaking ? "Kamera goyang — tahan stabil" : "Buram — fokuskan / tahan stabil"}</span>
                <span className={styles.focusVal}>{Math.round(result.blur.variance)}</span>
              </div>
              <div className={styles.focusBar}>
                <div className={`${styles.focusFill} ${result.blur.ok ? styles.focusFillOk : ""}`} style={focusFillStyle(result.blur.score)} />
              </div>
            </div>
          )}

          {!captured && <div className={`${styles.banner} ${result && result.allOK ? styles.bannerOk : ""}`}>{result ? result.message : "Arahkan kamera ke kertas…"}</div>}

          {captured && <div className={`${styles.banner} ${styles.bannerOk}`}>Hasil scan kertas</div>}

          <div className={styles.controls}>
            {captured && (
              <button className={styles.gbtn} onClick={retake} type="button">
                Ulangi
              </button>
            )}
            {!captured && <button className={`${styles.capture} ${canCapture ? styles.captureShow : ""}`} onClick={doCapture} type="button" aria-label="Ambil gambar" />}
          </div>
        </>
      )}

      {(status.kind === "idle" || status.kind === "starting" || status.kind === "error") && (
        <div className={styles.start}>
          <span className={styles.badge}>Grapholyze</span>
          <h1>Assisted Camera</h1>
          <p>
            Memandu pengambilan gambar tulisan tangan: deteksi posisi 4-sudut kertas, cahaya (luminance ITU-R BT.601), dan blur (variansi Laplacian). Saat optimal, tombol ambil gambar muncul dan hasilnya otomatis dipotong, diluruskan &
            dipertajam seperti scan.
          </p>
          <button onClick={startCamera} disabled={status.kind === "starting"} type="button">
            {status.kind === "starting" ? "Memulai…" : "Aktifkan Kamera"}
          </button>
          {status.kind === "error" && <div className={styles.err}>{status.message}</div>}
        </div>
      )}
    </div>
  );
}

// ---------------- Helpers ----------------
function dist(p, q) {
  return Math.hypot(p.x - q.x, p.y - q.y);
}
function lerpPt(a, b, f) {
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}
function smoothQuad(prev, next, f) {
  if (!prev) return next;
  return {
    tl: lerpPt(prev.tl, next.tl, f),
    tr: lerpPt(prev.tr, next.tr, f),
    br: lerpPt(prev.br, next.br, f),
    bl: lerpPt(prev.bl, next.bl, f),
  };
}
function maxCornerDelta(a, b) {
  if (!a || !b) return Infinity;
  return Math.max(dist(a.tl, b.tl), dist(a.tr, b.tr), dist(a.br, b.br), dist(a.bl, b.bl));
}
function focusFillStyle(score) {
  const pct = Math.max(6, Math.min(100, Math.round((score || 0) * 100)));
  return { width: pct + "%" };
}
