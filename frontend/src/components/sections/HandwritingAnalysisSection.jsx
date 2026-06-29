"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function HandwritingAnalysisSection({ onTryNow }) {
  const router = useRouter();

  const handleTryNow = () => {
    if (onTryNow) {
      onTryNow();
    } else {
      router.push("/(user)/homeanalisis");
    }
  };

  return (
    <section id="handwriting" className="bg-gray-50 text-gray-800 py-20 px-6">
      {/* Judul Utama */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-[#1e3a8a] mb-3">Handwriting Analysis</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">Grapholyze menggunakan teknologi Artificial Intelligence (AI) untuk menganalisis tulisan tangan Anda dan mengungkap kepribadian, pola pikir, serta karakter secara mendalam.</p>
      </div>

      {/* Konten Utama */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Gambar ilustrasi */}
        <div className="flex justify-center">
          <Image
            src="/Graf.jpeg"
            alt="Handwriting Analysis"
            width={400}
            height={300}
            className="rounded-2xl shadow-lg object-cover"
          />
        </div>

        {/* Deskripsi */}
        <div className="flex flex-col gap-6">
          <h3 className="text-2xl font-semibold text-[#1e3a8a]">Bagaimana Analisis Bekerja?</h3>
          <p className="text-gray-700 leading-relaxed">
            Cukup unggah gambar tulisan tangan Anda atau tulis langsung melalui kanvas digital kami. AI Grapholyze akan menganalisis goresan tulisan berdasarkan bentuk huruf, tekanan, kemiringan, dan jarak antarhuruf untuk memberikan
            laporan kepribadian yang akurat dan mudah dipahami.
          </p>

          <ul className="space-y-2 text-gray-700">
            <li>✅ Unggah tulisan tangan atau tulis langsung</li>
            <li>✅ Analisis otomatis berbasis AI</li>
            <li>✅ Laporan visual kepribadian</li>
          </ul>

          <button
            onClick={handleTryNow}
            className="mt-4 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl shadow hover:bg-indigo-700 transition-all duration-300 w-fit"
          >
            Coba Sekarang
          </button>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-24">
        <h3 className="text-2xl font-semibold text-indigo-600 mb-4">Siap Mengetahui Kepribadianmu?</h3>
        <p className="text-gray-600 mb-6">Unggah tulisan tanganmu sekarang dan biarkan Grapholyze menganalisis siapa dirimu!</p>
      </div>
    </section>
  );
}
