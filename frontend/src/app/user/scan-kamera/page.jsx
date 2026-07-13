"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import AssistedCamera from "@/components/AssistedCamera";
import { RotateCcw, Check } from "lucide-react";

export default function ScanKameraPage() {
  const router = useRouter();
  const [preview, setPreview] = useState(null); // simpan hasil capture
  const [cameraKey, setCameraKey] = useState(0); // untuk reset kamera

  // Dipanggil AssistedCamera saat capture → simpan preview, jangan navigate dulu
  const handleCapture = useCallback((dataUrl, blob) => {
    setPreview(dataUrl);
  }, []);

  // Submit → kirim ke homeanalisis
  const handleSubmit = () => {
    sessionStorage.setItem("capturedImage", preview);
    router.push("/user/homeanalisis");
  };

  // Retake → hapus preview, reset kamera
  const handleRetake = () => {
    setPreview(null);
    setCameraKey((k) => k + 1); // remount AssistedCamera agar kamera mulai ulang
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Kamera (disembunyikan saat preview) */}
      {!preview && <AssistedCamera key={cameraKey} onCapture={handleCapture} onBack={() => router.back()} />}

      {/* Preview fullscreen setelah capture */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/80 text-white">
            <span className="font-semibold text-sm">Preview Hasil Scan</span>
          </div>

          {/* Gambar preview */}
          <div className="flex-1 flex items-center justify-center overflow-hidden bg-gray-900 p-4">
            <img src={preview} alt="Preview hasil scan" className="max-w-full max-h-full object-contain rounded-xl" />
          </div>

          {/* Tombol Retake & Submit */}
          <div className="bg-black/80 py-6 px-6 flex justify-center gap-4">
            <button onClick={handleRetake} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-3 rounded-full transition-all hover:scale-105 active:scale-95">
              <RotateCcw className="w-5 h-5" />
              Foto Ulang
            </button>

            <button onClick={handleSubmit} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95">
              <Check className="w-5 h-5" />
              Gunakan Foto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
