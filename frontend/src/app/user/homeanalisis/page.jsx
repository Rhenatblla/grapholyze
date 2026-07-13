"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UploadFoto from "@/components/homeanalisis/UploadFoto";
import HandwritingCanvas from "@/components/homeanalisis/HandwritingCanvas";
import HasilAnalisis from "@/components/homeanalisis/HasilAnalisis";
import LoginRequiredModal from "@/components/modals/LoginRequiredModal";
import LoadingModal from "@/components/modals/LoadingModal";
import { Upload, Sparkles, Check } from "lucide-react";
import { Lightbulb, Sun, Ruler, Smartphone, Camera, Pencil } from "lucide-react";
import { analysisApi } from "@/api";

export default function HomeAnalisis() {
  const router = useRouter();
  const [step, setStep] = useState("upload");
  const [inputMethod, setInputMethod] = useState("foto");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const steps = [
    { id: "upload", name: "Upload Tulisan", icon: Upload },
    { id: "hasil", name: "Hasil Analisis", icon: Sparkles },
  ];

  const inputTabs = [
    { id: "foto", name: "Upload Foto", icon: Upload },
    { id: "tulis", name: "Tulis di Layar", icon: Pencil },
    { id: "kamera", name: "Scan Kamera", icon: Camera },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  // Ambil hasil foto dari halaman kamera
  useEffect(() => {
    const captured = sessionStorage.getItem("capturedImage");
    if (captured) {
      sessionStorage.removeItem("capturedImage");
      handleUploadComplete(captured);
    }
  }, []);

  const handleUploadComplete = async (imageData) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analysisApi.uploadImage(imageData);
      setAnalysisResult(data.analysis);
      setStep("hasil");
    } catch (err) {
      console.error("Analysis Error:", err);
      setError(err.message);
      if (err.message.includes("authorized") || err.message.includes("token")) {
        setShowLoginModal(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-800">
      {/* Hero Header */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-16 px-4 sm:px-6 text-center shadow-lg pt-24 md:pt-32">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-pink-300">Analisis Tulisan Tangan AI</h1>
        <p className="text-sm sm:text-base md:text-xl max-w-3xl mx-auto opacity-90">Ungkap karakteristik kepribadian Anda melalui tulisan tangan dengan teknologi AI yang canggih untuk insight mendalam.</p>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        {/* Progress Stepper */}
        <div className="flex items-center justify-center mb-12">
          {steps.map((s, index) => {
            const Icon = s.icon;
            const isCompleted = index < currentStepIndex;
            const isActive = index === currentStepIndex;
            return (
              <div key={s.id} className="flex items-center">
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${isCompleted ? "bg-green-500 text-white" : isActive ? "bg-indigo-600 text-white shadow-lg scale-110" : "bg-gray-300 text-gray-600"}`}
                  >
                    {isCompleted ? <Check className="w-8 h-8" /> : <Icon className="w-8 h-8" />}
                  </div>
                  <p className={`mt-3 text-sm font-medium transition-colors ${isActive ? "text-indigo-600" : "text-gray-500"}`}>{s.name}</p>
                </div>
                {index < steps.length - 1 && <div className={`w-12 sm:w-24 md:w-32 h-1 mx-2 md:mx-4 transition-all duration-700 ${isCompleted ? "bg-green-500" : "bg-gray-300"}`} />}
              </div>
            );
          })}
        </div>

        {/* Kotak Analisis */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-5 md:p-16 transition-all duration-700 max-w-7xl mx-auto">
          {step === "upload" && (
            <div className="animate-fadeIn">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 md:mb-12 text-indigo-700">Pilih Cara Input Tulisan Tangan</h2>

              {/* Tab */}
              <div className="flex flex-wrap justify-center gap-2 mb-10 border-b border-indigo-200">
                {inputTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = inputMethod === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setInputMethod(tab.id)}
                      className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-all border-b-2 -mb-px ${active ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-indigo-500"}`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.name}
                    </button>
                  );
                })}
              </div>

              {/* Panel */}
              <div className="max-w-3xl mx-auto">
                {inputMethod === "foto" && <UploadFoto onUploadComplete={handleUploadComplete} />}
                {inputMethod === "tulis" && <HandwritingCanvas onUploadComplete={handleUploadComplete} />}
                {inputMethod === "kamera" && (
                  <div className="relative flex flex-col items-center justify-center gap-6 py-12">
                    {/* Tombol kembali */}
                    <button onClick={() => setInputMethod("foto")} className="absolute top-0 left-0 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      ←
                    </button>

                    <div className="bg-indigo-50 rounded-full p-8 shadow-inner">
                      <Camera className="w-16 h-16 text-indigo-500" />
                    </div>

                    <div className="text-center">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">Scan Tulisan Tangan</h3>
                      <p className="text-sm text-gray-500 max-w-xs">Deteksi posisi, cahaya dan ketajaman otomatis</p>
                    </div>

                    <button
                      onClick={() => router.push("/user/scan-kamera")}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
                    >
                      <Camera className="w-5 h-5" />
                      Buka Kamera
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "hasil" && (
            <div className="animate-fadeIn">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 md:mb-10 text-indigo-700">Hasil Analisis Lengkap</h2>
              <HasilAnalisis analysis={analysisResult} />
            </div>
          )}
        </div>

        {/* Tips Foto */}
        {step === "upload" && (
          <div className="mt-10 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-5 sm:p-8 md:p-10 animate-fadeIn">
            <div className="flex items-center justify-center gap-3 mb-8">
              <Lightbulb className="w-8 h-8 text-yellow-500" />
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-700 text-center">Tips Foto Tulisan Tangan Terbaik untuk Analisis Akurat</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-10 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="bg-green-100 rounded-2xl p-5 shadow-lg">
                  <img src="https://qph.cf2.quoracdn.net/main-qimg-9566da9f8272b4ba9de140d702d87da8-pjlq" alt="Contoh BAIK" className="rounded-xl shadow-xl mx-auto max-h-56 object-contain" />
                </div>
                <p className="mt-4 text-green-700 font-bold text-lg">✅ Contoh BAIK</p>
                <p className="text-sm text-gray-600">Jelas, rata, terang, tanpa bayangan</p>
              </div>
              <div className="text-center">
                <div className="bg-red-100 rounded-2xl p-5 shadow-lg">
                  <img
                    src="https://media.springernature.com/lw685/springer-static/image/art%3A10.1186%2Fs13640-018-0297-3/MediaObjects/13640_2018_297_Fig3_HTML.png"
                    alt="Contoh BURUK"
                    className="rounded-xl shadow-xl mx-auto max-h-56 object-contain"
                  />
                </div>
                <p className="mt-4 text-red-700 font-bold text-lg">❌ Contoh BURUK</p>
                <p className="text-sm text-gray-600">Buram, miring, gelap, ada bayangan</p>
              </div>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-w-4xl mx-auto">
              <li className="flex items-start gap-4 bg-indigo-50 p-5 rounded-2xl">
                <Sun className="w-8 h-8 text-yellow-500 flex-shrink-0" />
                <div>
                  <strong className="text-base">Pencahayaan terang & merata</strong>
                  <p className="text-gray-600 mt-1 text-sm">Hindari bayangan atau cahaya langsung dari atas</p>
                </div>
              </li>
              <li className="flex items-start gap-4 bg-indigo-50 p-5 rounded-2xl">
                <Ruler className="w-8 h-8 text-indigo-500 flex-shrink-0" />
                <div>
                  <strong className="text-base">Letakkan kertas rata di meja</strong>
                  <p className="text-gray-600 mt-1 text-sm">Foto dari atas tegak lurus, jangan miring</p>
                </div>
              </li>
              <li className="flex items-start gap-4 bg-indigo-50 p-5 rounded-2xl">
                <Smartphone className="w-8 h-8 text-green-500 flex-shrink-0" />
                <div>
                  <strong className="text-base">Tulis 3-5 baris kalimat lengkap</strong>
                  <p className="text-gray-600 mt-1 text-sm">Gunakan pulpen hitam/biru, bukan pensil</p>
                </div>
              </li>
              <li className="flex items-start gap-4 bg-indigo-50 p-5 rounded-2xl">
                <Camera className="w-8 h-8 text-purple-500 flex-shrink-0" />
                <div>
                  <strong className="text-base">Pastikan tulisan jelas & tidak terpotong</strong>
                  <p className="text-gray-600 mt-1 text-sm">Fokus tajam, tidak buram</p>
                </div>
              </li>
            </ul>
          </div>
        )}

        {/* Tips Tulis di Layar */}
        {step === "upload" && (
          <div className="mt-10 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-5 sm:p-8 md:p-10 animate-fadeIn">
            <div className="flex items-center justify-center gap-3 mb-6 md:mb-8">
              <Lightbulb className="w-8 h-8 text-yellow-500" />
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-700 text-center">Tips Menulis Langsung di Layar (Tablet/HP)</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-10 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="bg-green-100 rounded-2xl p-5 shadow-lg">
                  <img
                    src="https://images.pexels.com/photos/33342584/pexels-photo-33342584/free-photo-of-digital-planning-on-tablet-with-stylus-pen.jpeg"
                    alt="Dengan Stylus"
                    className="rounded-xl shadow-xl mx-auto max-h-56 object-contain"
                  />
                </div>
                <p className="mt-4 text-green-700 font-bold text-lg">✅ Dengan Stylus (Direkomendasikan)</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-2xl p-5 shadow-lg">
                  <img
                    src="https://c8.alamy.com/comp/2R41732/digital-signature-on-smartphone-screen-with-woman-hand-a-close-up-of-a-person-writing-on-a-cell-phone-2R41732.jpg"
                    alt="Dengan Jari"
                    className="rounded-xl shadow-xl mx-auto max-h-56 object-contain"
                  />
                </div>
                <p className="mt-4 text-blue-700 font-bold text-lg">✅ Dengan Jari</p>
              </div>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-w-4xl mx-auto">
              <li className="flex items-start gap-4 bg-purple-50 p-5 rounded-2xl">
                <Pencil className="w-8 h-8 text-purple-600 flex-shrink-0" />
                <div>
                  <strong className="text-base">Tulis dengan ukuran & tekanan bervariasi</strong>
                  <p className="text-gray-600 mt-1 text-sm">Seperti menulis biasa di kertas</p>
                </div>
              </li>
              <li className="flex items-start gap-4 bg-purple-50 p-5 rounded-2xl">
                <Ruler className="w-8 h-8 text-indigo-500 flex-shrink-0" />
                <div>
                  <strong className="text-base">Buat minimal 3-5 baris kalimat lengkap</strong>
                  <p className="text-gray-600 mt-1 text-sm">Agar analisis lebih akurat</p>
                </div>
              </li>
              <li className="flex items-start gap-4 bg-purple-50 p-5 rounded-2xl">
                <Smartphone className="w-8 h-8 text-green-500 flex-shrink-0" />
                <div>
                  <strong className="text-base">Gunakan stylus jika ada</strong>
                  <p className="text-gray-600 mt-1 text-sm">Hasil lebih natural dan presisi</p>
                </div>
              </li>
              <li className="flex items-start gap-4 bg-purple-50 p-5 rounded-2xl">
                <Sun className="w-8 h-8 text-yellow-500 flex-shrink-0" />
                <div>
                  <strong className="text-base">Pilih ukuran pena yang nyaman</strong>
                  <p className="text-gray-600 mt-1 text-sm">Klik ikon pensil untuk mengatur</p>
                </div>
              </li>
            </ul>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>

      <LoginRequiredModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <LoadingModal isOpen={isLoading} />
    </div>
  );
}
