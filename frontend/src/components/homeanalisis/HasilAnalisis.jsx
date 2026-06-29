"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Share2, FileText, CheckCircle } from "lucide-react";

export default function AnalysisResult({ analysis }) {
  const [isExporting, setIsExporting] = useState(false);

  // Debugging
  useEffect(() => {
    console.log("Data diterima Frontend:", analysis);
  }, [analysis]);

  if (!analysis) return null;

  // --- 1. NORMALISASI DATA ---
  const rawData = analysis.data ? analysis.data : analysis;

  // Persiapan Data untuk Tampilan
  const displayData = {
    enneagram: rawData.enneagramType || "Tipe Tidak Terdeteksi",
    personality: rawData.personalityType || "Unknown Type",
    description: rawData.description || "Deskripsi tidak tersedia.",
    
    // Ambil Confidence (Bulatkan ke angka)
    confidence: rawData.confidence ? Math.round(rawData.confidence) : 0,

    // Ambil Features (Traits dari Backend)
    features: rawData.traits || rawData.graphologyAnalysis || null,
    
    // Gambar
    image: rawData.imageUrl || rawData.canvasData,

    // Rekomendasi: Gunakan data dari Backend jika ada, jika tidak gunakan fallback
    recommendations: (rawData.recommendations && rawData.recommendations.length > 0) 
      ? rawData.recommendations 
      : [ 'Template default....']
  };

  // --- 2. FUNGSI DOWNLOAD PDF (CLIENT SIDE - jspdf) ---
  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);
      const { jsPDF } = await import("jspdf");
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // -- Header --
      doc.setFontSize(22);
      doc.setTextColor(88, 28, 135); // Ungu
      doc.text("Graphology Analysis Result", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // -- Main Result --
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`Tipe: ${displayData.enneagram} (${displayData.personality})`, 20, yPosition);
      yPosition += 8;

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`AI Confidence: ${displayData.confidence}%`, 20, yPosition);
      yPosition += 15;

      // -- Description --
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Interpretasi Kepribadian", 20, yPosition);
      yPosition += 7;

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      const descLines = doc.splitTextToSize(displayData.description, pageWidth - 40);
      doc.text(descLines, 20, yPosition);
      yPosition += descLines.length * 5 + 10;

      // -- Graphology Features (Tabel Manual) --
      if (displayData.features) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Analisis Fitur Grafologi", 20, yPosition);
        yPosition += 10;

        const featuresToPrint = [
          { label: "Slant (Kemiringan)", data: displayData.features.slant },
          { label: "Size (Ukuran)", data: displayData.features.size },
          { label: "Pressure (Tekanan)", data: displayData.features.pressure },
          { label: "Baseline (Arah)", data: displayData.features.baseline },
        ];

        doc.setFontSize(10);
        featuresToPrint.forEach((item) => {
          if (item.data) {
            // Label
            doc.setFont("helvetica", "bold");
            doc.setTextColor(88, 28, 135);
            doc.text(item.label + ":", 20, yPosition);
            
            // Value
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            const valueText = `${item.data.val} - ${item.data.meaning}`;
            const valueLines = doc.splitTextToSize(valueText, pageWidth - 70);
            doc.text(valueLines, 70, yPosition);
            
            yPosition += valueLines.length * 5 + 3;
          }
        });
      }

      // -- TAMBAHAN: REKOMENDASI DI PDF --
      yPosition += 10;
      // Cek apakah muat di halaman, kalau tidak addPage
      if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Rekomendasi Pengembangan Diri", 20, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);

      displayData.recommendations.forEach((rec, index) => {
          const prefix = `${index + 1}. `;
          const recLines = doc.splitTextToSize(prefix + rec, pageWidth - 40);
          doc.text(recLines, 20, yPosition);
          yPosition += recLines.length * 5 + 2;
      });

      // -- Footer --
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated by Grapholyze on ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );

      doc.save(`Analysis_${displayData.enneagram}.pdf`);
      setIsExporting(false);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal membuat PDF. Coba lagi.");
      setIsExporting(false);
    }
  };

  // --- 3. FUNGSI DOWNLOAD TXT ---
  const handleDownloadTxt = () => {
    const f = displayData.features || {};
    
    // Format Rekomendasi untuk TXT
    const recText = displayData.recommendations
        .map((r, i) => `${i + 1}. ${r}`)
        .join('\n');

    const txtContent = `
Graphology Analysis Result
==========================
Date: ${new Date().toLocaleDateString()}

RESULT
------
Type: ${displayData.enneagram}
Personality: ${displayData.personality}
Confidence: ${displayData.confidence}%

DESCRIPTION
-----------
${displayData.description}

RECOMMENDATIONS
---------------
${recText}

GRAPHOLOGY FEATURES
-------------------
1. Slant: ${f.slant?.val || '-'} 
   Meaning: ${f.slant?.meaning || '-'}
2. Size: ${f.size?.val || '-'}
   Meaning: ${f.size?.meaning || '-'}
3. Pressure: ${f.pressure?.val || '-'}
   Meaning: ${f.pressure?.meaning || '-'}
4. Baseline: ${f.baseline?.val || '-'}
   Meaning: ${f.baseline?.meaning || '-'}
    `.trim();

    const element = document.createElement("a");
    const file = new Blob([txtContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `Analysis_${displayData.enneagram}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* SECTION 1: Image & Confidence Result (Sama Seperti Aslinya) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Kolom Kiri: Gambar */}
        {displayData.image && (
          <div className="bg-white shadow-lg rounded-2xl p-6 text-center flex flex-col items-center justify-center border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Citra Tulisan Tangan</h3>
            <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img
                src={displayData.image}
                alt="Tulisan tangan user"
                className="max-h-64 object-contain mx-auto"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 italic">
              Diproses menggunakan Histogram Equalization (HE)
            </p>
          </div>
        )}

        {/* Kolom Kanan: Hasil Utama & Confidence */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl rounded-2xl p-8 flex flex-col justify-center relative overflow-hidden">
          {/* Hiasan Background */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>

          <h2 className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">Hasil Prediksi AI</h2>

          {/* Tipe Enneagram */}
          <div className="text-5xl font-extrabold mb-2 text-white tracking-tight">
            {displayData.enneagram}
          </div>
          <div className="text-xl font-medium text-indigo-100 mb-8">
            {displayData.personality}
          </div>

          {/* CONFIDENCE LEVEL INDICATOR */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20">
            <div className="flex justify-between items-end mb-3">
              <span className="text-sm font-medium text-indigo-100">Tingkat Keyakinan AI</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">{displayData.confidence}</span>
                <span className="text-sm text-indigo-200">%</span>
              </div>
            </div>
            
            {/* Progress Bar Confidence */}
            <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${displayData.confidence}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  displayData.confidence > 80 ? 'bg-green-400' : 
                  displayData.confidence > 50 ? 'bg-yellow-400' : 'bg-red-400'
                } shadow-[0_0_10px_rgba(255,255,255,0.3)]`}
              ></motion.div>
            </div>
            
            <p className="text-xs text-indigo-200 mt-2 text-right italic">
              *Probabilitas output model MobileNetV2
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Interpretasi Deskriptif */}
      <div className="bg-indigo-50 border-l-4 border-indigo-600 rounded-r-lg p-6 shadow-sm">
        <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
          Interpretasi Kepribadian
        </h3>
        <p className="text-gray-700 leading-relaxed text-lg">
          {displayData.description}
        </p>
      </div>

      {/* SECTION 3: Analisis Fitur Grafologi (The "Scientific" Part) */}
      {displayData.features && (
        <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h3 className="text-2xl font-bold text-gray-800">Analisis Fitur Grafologi</h3>
            <p className="text-gray-500 text-sm mt-1">
              Penjelasan karakteristik visual berdasarkan literatur (Howard, 1922 & Lester, 1981).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard
              label="Kemiringan (Slant)"
              value={displayData.features.slant?.val}
              meaning={displayData.features.slant?.meaning}
              icon="📐"
            />
            <FeatureCard
              label="Ukuran Huruf (Size)"
              value={displayData.features.size?.val}
              meaning={displayData.features.size?.meaning}
              icon="🔍"
            />
            <FeatureCard
              label="Tekanan (Pressure)"
              value={displayData.features.pressure?.val}
              meaning={displayData.features.pressure?.meaning}
              icon="✒️"
              isHeEnhanced={true}
            />
            <FeatureCard
              label="Arah Baris (Baseline)"
              value={displayData.features.baseline?.val}
              meaning={displayData.features.baseline?.meaning}
              icon="📈"
            />
          </div>
        </div>
      )}

      {/* SECTION 4: Rekomendasi (Dinamis dari Data) */}
      <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <CheckCircle className="text-purple-600" />
          Rekomendasi Pengembangan Diri
        </h3>
        <ul className="space-y-3">
          {displayData.recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors duration-300">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                {idx + 1}
              </div>
              <p className="text-gray-700 font-medium">{rec}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* SECTION 5: ACTION BUTTONS (PDF / TXT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tombol PDF */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <FileText size={20} />
          {isExporting ? "Generating PDF..." : "Download PDF"}
        </motion.button>

        {/* Tombol TXT */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownloadTxt}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 font-semibold rounded-2xl transition shadow-sm"
        >
          <Download size={20} />
          Download TXT
        </motion.button>

        {/* Tombol Share */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-purple-100 hover:bg-purple-200 text-purple-600 font-semibold rounded-2xl transition shadow-sm"
        >
          <Share2 size={20} />
          Share Result
        </motion.button>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT UNTUK KARTU FITUR ---
function FeatureCard({ label, value, meaning, icon, isHeEnhanced }) {
  if (!value) return null;

  return (
    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <h4 className="font-semibold text-gray-700">{label}</h4>
      </div>

      <div className="ml-9">
        <div className="text-indigo-600 font-bold text-lg mb-1">{value}</div>
        <p className="text-sm text-gray-600 leading-snug">{meaning}</p>

        {isHeEnhanced && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
            Enhanced by HE
          </div>
        )}
      </div>
    </div>
  );
}