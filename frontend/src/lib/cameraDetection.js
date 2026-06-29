// lib/cameraDetection.js
// ---------------------------------------------------------------------------
// Grapholyze — Assisted Camera detection (JavaScript murni, tanpa dependency).
//
// File ini kini hanya "pintu masuk" (barrel) yang meneruskan semua fungsi dari
// modul-modul yang sudah dipisah per topik agar lebih rapi & mudah dirawat:
//
//   ./camera/config.js     -> DEFAULT_CONFIG (semua ambang batas)
//   ./camera/grayscale.js   -> toGrayscaleBT601 (utilitas bersama)
//   ./camera/light.js       -> CAHAYA  (meanLuminance, analyzeLight)
//   ./camera/blur.js        -> KETAJAMAN + GOYANG (laplacianVariance,
//                              frameDiffScore, analyzeBlur)
//   ./camera/position.js    -> POSISI  (otsuThreshold, detectPaperQuad,
//                              computeTargetBox, bboxFromCorners)
//   ./camera/rotation.js    -> KEMIRINGAN (Sobel + Hough: measureRotation,
//                              classifyRotation, analyzeRotation)
//   ./camera/capture.js     -> util CAPTURE (perspektif + sharpen)
//   ./camera/analyze.js     -> orkestrator (analyzeFrame, buildMessage,
//                              computeProcSize)
//
// Impor lama seperti `from '../lib/cameraDetection'` tetap berfungsi.
// ---------------------------------------------------------------------------

export { DEFAULT_CONFIG } from "./camera/config";
export { toGrayscaleBT601 } from "./camera/grayscale";
export { meanLuminance, analyzeLight } from "./camera/light";
export { laplacianVariance, frameDiffScore, analyzeBlur } from "./camera/blur";
export { otsuThreshold, computeTargetBox, detectPaperQuad, bboxFromCorners } from "./camera/position";
export { getPerspectiveTransform, applyTransform, sharpenImageData } from "./camera/capture";
export { analyzeFrame, buildMessage, computeProcSize } from "./camera/analyze";
export { measureRotation, classifyRotation, analyzeRotation } from "./camera/rotation";
