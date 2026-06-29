"use client";

import { useRef, useState, useEffect } from "react";
import { Eraser, Trash2, Pencil } from "lucide-react";
import { DRAWING_CONFIG } from "@/config/constants";

export default function HandwritingCanvas({ onUploadComplete }) {
  const isDrawingRef = useRef(false);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  
  // State UI
  const [tool, setTool] = useState("pen");
  const [penThickness, setPenThickness] = useState(4);
  const [hasContent, setHasContent] = useState(false);

  const eraserThickness = penThickness * (DRAWING_CONFIG?.eraserMultiplier || 5);

  // --- 1. SETUP CANVAS & SCROLL LOCK (ANTI-GESER) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    
    // Setup Resolusi Tinggi (Retina/High DPI Display)
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#000000";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, rect.height);
      
      ctxRef.current = ctx;
    };

    updateCanvasSize();
    // Opsional: update size kalau layar di-resize/rotate
    // window.addEventListener('resize', updateCanvasSize);

    // --- LOGIC MENGGAMBAR ---
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handlePointerDown = (e) => {
      // 🛑 JURUS 1: Matikan Scroll Browser Total saat mulai nulis
      document.body.style.overflow = "hidden"; 
      document.body.style.touchAction = "none";
      
      e.preventDefault();
      e.stopPropagation();
      
      // 🔒 JURUS 2: Kunci Pointer ke Canvas
      canvas.setPointerCapture(e.pointerId);
      
      isDrawingRef.current = true;
      setHasContent(true);

      const { x, y } = getPos(e);
      const context = ctxRef.current;
      context.beginPath();
      context.moveTo(x, y);
    };

    const handlePointerMove = (e) => {
      if (!isDrawingRef.current) return;
      
      e.preventDefault();
      e.stopPropagation();

      const { x, y } = getPos(e);
      const context = ctxRef.current;
      context.lineTo(x, y);
      context.stroke();
    };

    const handlePointerUp = (e) => {
      isDrawingRef.current = false;
      const context = ctxRef.current;
      if (context) context.closePath();
      
      // ✅ JURUS 3: Kembalikan Scroll Browser saat pen diangkat
      document.body.style.overflow = ""; 
      document.body.style.touchAction = "";
      
      if (e.pointerId) canvas.releasePointerCapture(e.pointerId);
    };

    // Pasang Event Listener 'Passive: False' (PENTING)
    canvas.addEventListener("pointerdown", handlePointerDown, { passive: false });
    canvas.addEventListener("pointermove", handlePointerMove, { passive: false });
    canvas.addEventListener("pointerup", handlePointerUp, { passive: false });
    canvas.addEventListener("pointercancel", handlePointerUp, { passive: false });

    // Cleanup
    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
      
      // Pastikan scroll nyala lagi kalau komponen hilang
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []); 

  // --- 2. UPDATE STYLE SAAT TOOL GANTI ---
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = eraserThickness;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = penThickness;
      ctx.strokeStyle = "#000000";
    }
  }, [tool, penThickness, eraserThickness]);

  // --- 3. ACTIONS ---
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const dpr = window.devicePixelRatio || 1;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Isi putih
    setHasContent(false);
  };

  const handleSubmit = () => {
    if (hasContent && canvasRef.current) {
      const imageData = canvasRef.current.toDataURL("image/jpeg", 0.9);
      onUploadComplete(imageData);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-2xl mx-auto border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Tulis Langsung di Layar
        </h2>
        <p className="text-sm text-gray-600 mt-2">Mode Fokus: Layar terkunci saat menulis</p>
      </div>

      {/* CANVAS CONTAINER */}
      {/* touch-action: none di sini sangat penting */}
      <div 
        className="rounded-2xl overflow-hidden shadow-inner border-4 border-dashed border-gray-200 bg-white relative"
        style={{ touchAction: 'none' }} 
      >
        <canvas
          ref={canvasRef}
          style={{ 
            width: "100%", 
            height: "400px", 
            touchAction: "none", // DOUBLE LOCK
            cursor: "crosshair",
            display: "block"
          }}
        />

        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-lg font-medium">Mulai menulis di sini ✍️</p>
          </div>
        )}
      </div>

      {/* TOOLBAR */}
      <div className="mt-8 bg-white rounded-full shadow-lg px-8 py-6 mx-auto max-w-lg">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setTool("pen")} 
            className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md ${tool === "pen" ? "scale-110" : ""}`}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500" />
            <Pencil className="w-8 h-8 text-white relative z-10" />
          </button>

          <button 
            onClick={() => setTool("eraser")} 
            className={`p-3 rounded-xl transition-all ${tool === "eraser" ? "bg-gray-200 scale-110" : "hover:bg-gray-100"}`}
          >
            <Eraser className="w-7 h-7 text-gray-700" />
          </button>

          <div className="h-12 w-px bg-gray-300" />

          {tool === "pen" && (
            <div className="flex items-center gap-4 flex-1 mx-6">
              <div className="w-8 h-8 rounded-full bg-black/20" />
              <input
                type="range" min="1" max="20"
                value={penThickness}
                onChange={(e) => setPenThickness(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider-purple"
              />
              <div className="w-12 h-12 rounded-full bg-black" />
            </div>
          )}

          <button onClick={clearCanvas} className="p-3 rounded-xl hover:bg-red-50 transition-all">
            <Trash2 className="w-7 h-7 text-red-600" />
          </button>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!hasContent}
        className={`mt-8 w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-md
          ${hasContent ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
      >
        Lanjut ke Analisis Hasil
      </button>

      <style jsx>{`
        .slider-purple::-webkit-slider-thumb {
          appearance: none; width: 28px; height: 28px;
          background: linear-gradient(to bottom right, #a855f7, #ec4899);
          border-radius: 50%; cursor: pointer;
          box-shadow: 0 4px 10px rgba(168, 85, 247, 0.4);
        }
      `}</style>
    </div>
  );
}