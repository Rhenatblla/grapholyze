'use client'

// components/AssistedCamera.jsx
// ---------------------------------------------------------------------------
// Komponen kamera berpemandu untuk Grapholyze (HIBRIDA gaya iPhone Notes).
// - Tiap frame mencoba mendeteksi TEPI kertas (4 sudut).
//   * MODE QUAD (tepi terdeteksi): overlay menggambar POLIGON tepi kertas;
//     saat capture, gambar di-crop + diluruskan otomatis (perspective warp)
//     -> preview = KERTAS SAJA dan selalu lurus. Kemiringan auto-dikoreksi.
//   * FALLBACK BINGKAI TETAP (tepi tak terdeteksi, mis. meja terang): overlay
//     menggambar bingkai A4 di tengah; capture memotong tegak lurus ke bingkai.
// - Overlay COVER-AWARE: karena <video> memakai object-fit: cover, overlay
//   dipetakan dengan skala seragam + offset -> yang tergambar PERSIS = area
//   yang akan ter-crop (WYSIWYG).
// - Tombol capture muncul saat semua OK & kamera diam.
// - onCapture(dataUrl, blob) dipanggil saat gambar diambil.
//
// Props:
//   onCapture       (dataUrl, blob) => void
//   config          objek override DetectionConfig
//   stableFrames    number (default 3)
//   intervalMs      number (default 130)
//   captureQuality  number 0..1 (default 0.98)
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  analyzeFrame,
  computeProcSize,
  DEFAULT_CONFIG,
  frameDiffScore,
  sharpenImageData,
  getPerspectiveTransform,
  applyTransform,
} from '../lib/cameraDetection'
import styles from './AssistedCamera.module.css'

const MAX_OUT_DIM = 2400 // batas dimensi hasil crop (jaga ketajaman)

export default function AssistedCamera({
  onCapture,
  config,
  stableFrames = 3,
  intervalMs = 130,
  captureQuality = 0.98,
}) {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  const videoRef = useRef(null)
  const overlayRef = useRef(null)
  const procRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const lastRunRef = useRef(0)
  const stableRef = useRef(0)
  const frozenRef = useRef(false)
  const lastResultRef = useRef(null)
  const prevFrameRef = useRef(null)
  const motionEmaRef = useRef(0)
  const rotStateRef = useRef({}) // state EMA untuk smoothing sudut kemiringan
  const cornersEmaRef = useRef(null) // sudut kertas yang DITAMPILKAN (dibekukan saat diam)

  const [status, setStatus] = useState({ kind: 'idle' })
  const [result, setResult] = useState(null)
  const [canCapture, setCanCapture] = useState(false)
  const [captured, setCaptured] = useState(null)

  // ---------------- Camera lifecycle ----------------
  const stopCamera = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    if (streamRef.current)
      streamRef.current.getTracks().forEach((tr) => tr.stop())
    streamRef.current = null
  }, [])

  // ---------------- Overlay drawing (COVER-AWARE) ----------------
  const drawOverlay = useCallback((res) => {
    const video = videoRef.current
    const overlay = overlayRef.current
    if (!video || !overlay) return
    const rect = video.getBoundingClientRect()
    overlay.width = rect.width
    overlay.height = rect.height
    const ctx = overlay.getContext('2d')
    if (!ctx) return

    const pw = res.proc.w
    const ph = res.proc.h
    // <video> object-fit: cover -> skala seragam + offset agar overlay PERSIS
    // menempel pada tampilan video (WYSIWYG dengan area crop).
    const scale = Math.max(overlay.width / pw, overlay.height / ph)
    const offX = (overlay.width - pw * scale) / 2
    const offY = (overlay.height - ph * scale) / 2
    const dx = (x) => offX + x * scale
    const dy = (y) => offY + y * scale

    const ready = res.allOK
    // hijau = siap, oranye = dokumen ada tapi belum sempurna, merah = belum ada dokumen
    const col = ready ? '#16a34a' : res.documentPresent ? '#d97706' : '#dc2626'

    ctx.clearRect(0, 0, overlay.width, overlay.height)

    if (res.corners) {
      // ---- MODE QUAD: gambar POLIGON tepi kertas yang terdeteksi. ----
      const c = res.corners
      const pts = [c.tl, c.tr, c.br, c.bl].map((p) => ({
        x: dx(p.x),
        y: dy(p.y),
      }))

      // Gelapkan area DI LUAR poligon kertas.
      ctx.fillStyle = 'rgba(0,0,0,0.45)'
      ctx.beginPath()
      ctx.rect(0, 0, overlay.width, overlay.height)
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < 4; i++) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.closePath()
      ctx.fill('evenodd')

      // Garis tepi kertas.
      ctx.strokeStyle = col
      ctx.lineWidth = ready ? 4 : 3
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < 4; i++) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.closePath()
      ctx.stroke()

      // Titik sudut sebagai penegas deteksi.
      ctx.fillStyle = col
      for (const p of pts) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, ready ? 6 : 5, 0, Math.PI * 2)
        ctx.fill()
      }
      return
    }

    // ---- FALLBACK MODE BINGKAI TETAP: kotak panduan A4 di tengah. ----
    const b = res.targetBox
    const bx = dx(b.x)
    const by = dy(b.y)
    const bw = b.w * scale
    const bh = b.h * scale

    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.beginPath()
    ctx.rect(0, 0, overlay.width, overlay.height)
    ctx.rect(bx, by, bw, bh)
    ctx.fill('evenodd')

    ctx.strokeStyle = col
    ctx.lineWidth = ready ? 4 : 3
    ctx.lineJoin = 'round'
    if (!ready) ctx.setLineDash([12, 9])
    ctx.strokeRect(bx, by, bw, bh)
    ctx.setLineDash([])

    const cc = Math.min(bw, bh) * 0.12
    ctx.lineWidth = ready ? 5 : 4
    ctx.beginPath()
    ctx.moveTo(bx, by + cc)
    ctx.lineTo(bx, by)
    ctx.lineTo(bx + cc, by)
    ctx.moveTo(bx + bw - cc, by)
    ctx.lineTo(bx + bw, by)
    ctx.lineTo(bx + bw, by + cc)
    ctx.moveTo(bx + bw, by + bh - cc)
    ctx.lineTo(bx + bw, by + bh)
    ctx.lineTo(bx + bw - cc, by + bh)
    ctx.moveTo(bx + cc, by + bh)
    ctx.lineTo(bx, by + bh)
    ctx.lineTo(bx, by + bh - cc)
    ctx.stroke()
  }, [])

  // ---------------- Analysis loop ----------------
  const loop = useCallback(
    (ts) => {
      rafRef.current = requestAnimationFrame(loop)
      if (frozenRef.current) return
      if (ts - lastRunRef.current < intervalMs) return
      lastRunRef.current = ts

      const video = videoRef.current
      const proc = procRef.current
      if (!video || !proc || video.readyState < 2) return
      const vw = video.videoWidth
      const vh = video.videoHeight
      if (!vw || !vh) return

      const size = computeProcSize(vw, vh, cfg.procW)
      proc.width = size.w
      proc.height = size.h
      const pctx = proc.getContext('2d', { willReadFrequently: true })
      if (!pctx) return
      pctx.drawImage(video, 0, 0, size.w, size.h)
      const imageData = pctx.getImageData(0, 0, size.w, size.h)

      const res = analyzeFrame(imageData, cfg, rotStateRef.current)

      // Kotak deteksi harus DIAM saat kertas tidak bergerak: bekukan sudut
      // selama perubahan antar-frame kecil (hanya noise). Kotak baru mengikuti
      // HANYA ketika ada pergerakan nyata -> tidak "gamau diem".
      if (res.corners) {
        const prev = cornersEmaRef.current
        if (!prev) {
          cornersEmaRef.current = res.corners
        } else {
          let maxD = 0
          for (const k of ['tl', 'tr', 'br', 'bl']) {
            const d = Math.hypot(
              res.corners[k].x - prev[k].x,
              res.corners[k].y - prev[k].y,
            )
            if (d > maxD) maxD = d
          }
          // Ambang mati (deadband) ~3% lebar proc: di bawah ini kotak DIBEKUKAN.
          if (maxD > res.proc.w * 0.03) cornersEmaRef.current = res.corners
        }
        res.corners = cornersEmaRef.current
      } else {
        cornersEmaRef.current = null
      }

      // Deteksi goyang (motion blur): selisih antar-frame di dalam bingkai,
      // dihaluskan (EMA) agar getaran sesaat saat HP DIAM tidak salah deteksi.
      let motion = 0
      const prevFrame = prevFrameRef.current
      if (prevFrame && prevFrame.length === imageData.data.length) {
        motion = frameDiffScore(
          prevFrame,
          imageData.data,
          size.w,
          res.targetBox,
        )
      }
      prevFrameRef.current = new Uint8ClampedArray(imageData.data)
      const motionEma = motionEmaRef.current * 0.6 + motion * 0.4
      motionEmaRef.current = motionEma
      // Tandai goyang HANYA jika: ada dokumen + gerakan besar berkelanjutan +
      // gambar memang jadi kurang tajam. HP diam/tajam tidak ditandai goyang.
      const shaking =
        prevFrame != null &&
        res.documentPresent &&
        motionEma > cfg.motionMax &&
        res.blur.variance < cfg.blurMin * 1.25
      res.motion = motionEma
      res.shaking = shaking
      if (shaking) {
        res.blur = {
          ...res.blur,
          ok: false,
          score: Math.min(res.blur.score, 0.2),
        }
        res.allOK = false
        res.message = 'Kamera goyang — tahan stabil hingga tajam'
      }

      lastResultRef.current = res

      // SIAP tepat ketika semua kondisi optimal (allOK) — SAMA PERSIS dengan
      // banner "Siap dianalisis". Ketajaman sudah menjamin gambar tidak buram,
      // jadi tak perlu gerbang gerakan terpisah yang bikin tombol nyangkut.
      const ready = res.allOK

      setResult(res)
      drawOverlay(res)
      setCanCapture(ready)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intervalMs, stableFrames, drawOverlay],
  )

  const startCamera = useCallback(async () => {
    setStatus({ kind: 'starting' })
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{ focusMode: 'continuous' }],
        },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()
      setStatus({ kind: 'running' })
      lastRunRef.current = 0
      rafRef.current = requestAnimationFrame(loop)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setStatus({
        kind: 'error',
        message:
          'Tidak bisa mengakses kamera: ' +
          message +
          '. Pastikan halaman via HTTPS/localhost dan izin kamera diberikan.',
      })
    }
  }, [loop])

  useEffect(() => () => stopCamera(), [stopCamera])

  // ---------------- Capture ----------------
  const doCapture = useCallback(() => {
    const video = videoRef.current
    const res = lastResultRef.current
    // Pengaman: hanya boleh menangkap saat semua kondisi optimal (tombol aktif).
    if (!video || !res || !res.allOK) return
    const vw = video.videoWidth
    const vh = video.videoHeight

    const full = document.createElement('canvas')
    full.width = vw
    full.height = vh
    const fctx = full.getContext('2d')
    if (!fctx) return
    fctx.drawImage(video, 0, 0, vw, vh)

    let outCanvas = full

    if (res && res.corners && res.proc) {
      // ---- MODE QUAD: warp perspektif -> kertas dipotong + diluruskan. ----
      const ax = vw / res.proc.w
      const ay = vh / res.proc.h
      const c = res.corners
      const src = [
        { x: c.tl.x * ax, y: c.tl.y * ay },
        { x: c.tr.x * ax, y: c.tr.y * ay },
        { x: c.br.x * ax, y: c.br.y * ay },
        { x: c.bl.x * ax, y: c.bl.y * ay },
      ]
      const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
      let outW = Math.max(dist(src[0], src[1]), dist(src[3], src[2]))
      let outH = Math.max(dist(src[0], src[3]), dist(src[1], src[2]))
      const sc = Math.min(1, MAX_OUT_DIM / Math.max(outW, outH))
      outW = Math.max(1, Math.round(outW * sc))
      outH = Math.max(1, Math.round(outH * sc))

      const dst = [
        { x: 0, y: 0 },
        { x: outW, y: 0 },
        { x: outW, y: outH },
        { x: 0, y: outH },
      ]
      // H memetakan koordinat OUTPUT -> SUMBER (sampling mundur).
      const H = getPerspectiveTransform(dst, src)
      const srcImg = fctx.getImageData(0, 0, vw, vh)
      const sd = srcImg.data

      outCanvas = document.createElement('canvas')
      outCanvas.width = outW
      outCanvas.height = outH
      const octx = outCanvas.getContext('2d')
      const outImg = octx.createImageData(outW, outH)
      const od = outImg.data
      for (let y = 0; y < outH; y++) {
        for (let x = 0; x < outW; x++) {
          const s = applyTransform(H, x + 0.5, y + 0.5)
          let fx = s.x - 0.5
          let fy = s.y - 0.5
          if (fx < 0) fx = 0
          else if (fx > vw - 1) fx = vw - 1
          if (fy < 0) fy = 0
          else if (fy > vh - 1) fy = vh - 1
          const x0 = fx | 0
          const y0 = fy | 0
          const x1 = Math.min(vw - 1, x0 + 1)
          const y1 = Math.min(vh - 1, y0 + 1)
          const tx = fx - x0
          const ty = fy - y0
          const i00 = (y0 * vw + x0) * 4
          const i10 = (y0 * vw + x1) * 4
          const i01 = (y1 * vw + x0) * 4
          const i11 = (y1 * vw + x1) * 4
          const o = (y * outW + x) * 4
          for (let k = 0; k < 3; k++) {
            const top = sd[i00 + k] * (1 - tx) + sd[i10 + k] * tx
            const bot = sd[i01 + k] * (1 - tx) + sd[i11 + k] * tx
            od[o + k] = top * (1 - ty) + bot * ty
          }
          od[o + 3] = 255
        }
      }
      // Pertajam teks hasil (seperti scan).
      sharpenImageData(od, outW, outH, 0.6)
      octx.putImageData(outImg, 0, 0)
    } else if (res && res.targetBox && res.proc) {
      // ---- FALLBACK: potong TEGAK LURUS ke bingkai panduan. ----
      const ax = vw / res.proc.w
      const ay = vh / res.proc.h
      let cropX = Math.max(0, Math.round(res.targetBox.x * ax))
      let cropY = Math.max(0, Math.round(res.targetBox.y * ay))
      let cropW = Math.round(res.targetBox.w * ax)
      let cropH = Math.round(res.targetBox.h * ay)
      if (cropX + cropW > vw) cropW = vw - cropX
      if (cropY + cropH > vh) cropH = vh - cropY

      let outW = cropW
      let outH = cropH
      const scale = Math.min(1, MAX_OUT_DIM / Math.max(outW, outH))
      outW = Math.max(1, Math.round(outW * scale))
      outH = Math.max(1, Math.round(outH * scale))

      outCanvas = document.createElement('canvas')
      outCanvas.width = outW
      outCanvas.height = outH
      const octx = outCanvas.getContext('2d')
      octx.drawImage(full, cropX, cropY, cropW, cropH, 0, 0, outW, outH)

      const outImg = octx.getImageData(0, 0, outW, outH)
      sharpenImageData(outImg.data, outW, outH, 0.6)
      octx.putImageData(outImg, 0, 0)
    }

    const dataUrl = outCanvas.toDataURL('image/jpeg', captureQuality)
    setCaptured(dataUrl)
    frozenRef.current = true
    setCanCapture(false)
    outCanvas.toBlob(
      (blob) => onCapture && onCapture(dataUrl, blob),
      'image/jpeg',
      captureQuality,
    )
  }, [captureQuality, onCapture])

  const retake = useCallback(() => {
    setCaptured(null)
    frozenRef.current = false
    stableRef.current = 0
  }, [])

  // ---------------- Render ----------------
  const indicators = result
    ? [
        {
          key: 'pos',
          label: 'Posisi',
          ok:
            result.documentPresent &&
            result.straight &&
            !(result.position && result.position.offCenter),
          value: result.skew == null ? '–' : result.skew.toFixed(1) + '°',
        },
        {
          key: 'light',
          label: 'Cahaya',
          // Bayangan (cahaya tidak merata) ikut menjadikan indikator Cahaya merah.
          ok: result.light.ok && !result.light.shadow,
          value: String(Math.round(result.light.mean)),
        },
        {
          key: 'blur',
          label: 'Ketajaman',
          ok: result.blur.ok,
          value: String(Math.round(result.blur.variance)),
        },
      ]
    : []

  return (
    <div className={styles.stage}>
      <video
        ref={videoRef}
        className={styles.video}
        playsInline
        muted
        autoPlay
      />
      <canvas ref={overlayRef} className={styles.overlay} />
      <canvas ref={procRef} className={styles.procCanvas} />
      {captured && (
        <img
          src={captured}
          className={styles.captured}
          alt="Hasil scan kertas"
        />
      )}

      {status.kind === 'running' && (
        <>
          <div className={styles.hud}>
            {indicators.map((it) => (
              <div key={it.key} className={styles.chip}>
                <span
                  className={`${styles.dot} ${it.ok ? styles.dotOk : ''}`}
                />
                {it.label} <span className={styles.val}>{it.value}</span>
              </div>
            ))}
          </div>

          {!captured && (
            <div
              className={`${styles.banner} ${result && result.allOK ? styles.bannerOk : ''}`}
            >
              {result ? result.message : 'Arahkan kamera ke dokumen…'}
            </div>
          )}

          {captured && (
            <div className={`${styles.banner} ${styles.bannerOk}`}>
              Hasil scan kertas
            </div>
          )}

          <div className={styles.controls}>
            {captured && (
              <button className={styles.gbtn} onClick={retake} type="button">
                Ulangi
              </button>
            )}
            {!captured && (
              <button
                className={`${styles.capture} ${styles.captureShow} ${canCapture ? styles.captureReady : ''}`}
                onClick={doCapture}
                disabled={!canCapture}
                type="button"
                aria-label={
                  canCapture
                    ? 'Ambil gambar'
                    : 'Belum siap — perbaiki kondisi dulu'
                }
              />
            )}
          </div>
        </>
      )}

      {(status.kind === 'idle' ||
        status.kind === 'starting' ||
        status.kind === 'error') && (
        <div className={styles.start}>
          <span className={styles.badge}>Grapholyze</span>
          <h1>Assisted Camera</h1>
          <p>
            Memandu pengambilan gambar tulisan tangan: kamera mendeteksi tepi
            kertas lalu memotong & meluruskan otomatis (seperti pindai dokumen).
            Bila tepi tak terdeteksi, gunakan bingkai panduan di tengah. Kamera
            memastikan cahaya (luminance ITU-R BT.601), ketajaman (variansi
            Laplacian), dan kelurusan sebelum tombol ambil gambar muncul.
          </p>
          <button
            onClick={startCamera}
            disabled={status.kind === 'starting'}
            type="button"
          >
            {status.kind === 'starting' ? 'Memulai…' : 'Aktifkan Kamera'}
          </button>
          {status.kind === 'error' && (
            <div className={styles.err}>{status.message}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------- Helpers ----------------
function focusFillStyle(score) {
  const pct = Math.max(6, Math.min(100, Math.round((score || 0) * 100)))
  return { width: pct + '%' }
}
