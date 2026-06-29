"use client";

import { motion } from "framer-motion";
import { PenTool, Camera, Upload, Brain, TrendingUp, AlertTriangle, RefreshCcw, CheckCircle2, Lightbulb } from "lucide-react";
import Link from "next/link";

export default function LearnMore() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-[#1e3a8a] via-indigo-900 to-purple-900 text-white py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-6 text-indigo-100">
              Panduan Pengguna
            </span>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
              Tips Menggunakan Grapholyze Secara Optimal
            </h1>
            <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto leading-relaxed">
              Dapatkan hasil analisis kepribadian yang paling akurat dan bermakna dengan mengikuti panduan berbasis AI kami.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20 pb-24">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="space-y-12"
        >

          {/* Section 1: Preparation */}
          <motion.div variants={item} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0 text-blue-600">
                  <span className="text-3xl font-black">1</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <PenTool className="w-8 h-8 text-blue-600" />
                    Persiapkan Tulisan Tangan
                  </h2>
                  <p className="text-gray-600 text-lg mb-8">
                    Tulisan tangan yang baik adalah kunci analisis yang akurat. Pastikan kondisi fisik tulisan mendukung keterbacaan AI.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                      <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Tips (Do's)
                      </h3>
                      <ul className="space-y-3 text-green-900/80">
                        <li className="flex items-start gap-2">✓ Gunakan kertas polos atau bergaris tipis</li>
                        <li className="flex items-start gap-2">✓ Gunakan pulpen/pena (hindari pensil)</li>
                        <li className="flex items-start gap-2">✓ Tulis secara natural, jangan dibuat-buat</li>
                        <li className="flex items-start gap-2">✓ Panjang tulisan minimal 3–5 baris</li>
                      </ul>
                    </div>
                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                      <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> Hindari (Don'ts)
                      </h3>
                      <ul className="space-y-3 text-red-900/80">
                        <li className="flex items-start gap-2">✕ Tulisan terlalu kecil atau besar</li>
                        <li className="flex items-start gap-2">✕ Coretan yang berlebihan</li>
                        <li className="flex items-start gap-2">✕ Tulisan hasil edit digital</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 2: Capture */}
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div variants={item} className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <Camera className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Foto & Scan Berkualitas</h2>
              <p className="text-gray-600 mb-6">AI membaca detail visual. Pastikan gambar:</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"><span className="w-2 h-2 bg-indigo-500 rounded-full"></span>Jelas dan tidak blur</li>
                <li className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"><span className="w-2 h-2 bg-indigo-500 rounded-full"></span>Pencahayaan cukup (terang)</li>
                <li className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"><span className="w-2 h-2 bg-indigo-500 rounded-full"></span>Tulisan utuh tidak terpotong</li>
              </ul>
              <div className="mt-6 bg-indigo-50 text-indigo-800 px-4 py-3 rounded-lg text-sm font-medium">
                📌 Scan dokumen memberikan hasil terbaik dibanding foto kamera.
              </div>
            </motion.div>

            <motion.div variants={item} className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                <Upload className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Upload & Analisis</h2>
              <p className="text-gray-600 mb-6">Langkah mudah memulai:</p>
              <ol className="space-y-4">
                <li className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">1</span>
                  <span className="text-gray-700 font-medium">Buka menu Handwriting Analyst</span>
                </li>
                <li className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">2</span>
                  <span className="text-gray-700 font-medium">Upload foto/scan tulisan</span>
                </li>
                <li className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">3</span>
                  <span className="text-gray-700 font-medium">Tunggu proses AI (beberapa detik)</span>
                </li>
              </ol>
            </motion.div>
          </div>

          {/* Section 4 & 5: Results & Growth */}
          <motion.div variants={item} className="bg-gradient-to-br from-indigo-900 to-purple-800 rounded-3xl shadow-2xl overflow-hidden text-white relative">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="p-8 md:p-12 relative z-10">
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <Brain className="w-8 h-8 text-pink-400" />
                    4. Memahami Hasil
                  </h2>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6">
                    <h4 className="font-semibold text-pink-200 mb-3 uppercase tracking-wider text-sm">Cakupan Analisis</h4>
                    <ul className="space-y-2 text-indigo-100">
                      <li>• Karakter dominan & pola kepribadian</li>
                      <li>• Kecenderungan emosional</li>
                      <li>• Insight untuk pengembangan diri</li>
                    </ul>
                  </div>
                  <div className="flex items-start gap-3 bg-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
                    <Lightbulb className="w-5 h-5 shrink-0" />
                    <p>Tips: Fokus pada pola utama, bukan satu indikator saja. Gunakan sebagai alat refleksi diri.</p>
                  </div>
                </div>

                <div className="md:border-l md:border-white/10 md:pl-12">
                  <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-green-400" />
                    5. Pengembangan Diri
                  </h2>
                  <p className="text-indigo-100 mb-6 text-lg">
                    Grapholyze bukan hanya alat analisis, tapi sarana untuk bertumbuh. Gunakan untuk:
                  </p>
                  <ul className="space-y-4">
                    {["Mengenali gaya belajar & kerja", "Memahami cara komunikasi efektif", "Mengelola emosi & keputusan", "Refleksi diri harian"].map((text, i) => (
                      <li key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors">
                        <span className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center text-xs">✓</span>
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 6 & 7: Footer Info */}
          <motion.div variants={item} className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <h3 className="font-bold text-gray-900 text-xl mb-4">6. Hal yang Perlu Diketahui</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Hasil bersifat non-medis & pendukung.</li>
                <li>• Dipengaruhi kondisi fisik saat menulis.</li>
                <li>• Tidak menggantikan diagnosis profesional.</li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
              <h3 className="font-bold text-blue-900 text-xl mb-4 flex items-center gap-2">
                <RefreshCcw className="w-5 h-5" /> 7. Analisis Ulang
              </h3>
              <p className="text-blue-800/80 text-sm mb-4">
                Kepribadian berkembang. Disarankan melakukan analisis ulang setelah beberapa bulan atau dalam kondisi emosional berbeda.
              </p>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div variants={item} className="text-center pt-12">
            <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
              Pahami dirimu lebih dalam melalui tulisan tangan.
            </h3>
            <Link href="/homeanalisis">
              <button className="bg-[#1e3a8a] text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                Mulai Analisis Sekarang
              </button>
            </Link>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
