"use client";

import { useEffect, useState } from "react";
import { Loader2, Brain, Sparkles } from "lucide-react";

export default function LoadingModal({ isOpen }) {
    const [message, setMessage] = useState("Memulai analisis...");

    const loadingMessages = [
        "Memindai pola tulisan...",
        "Mendeteksi kemiringan & tekanan...",
        "Mencocokkan dengan basis data grafologi...",
        "AI menyusun profil kepribadian...",
        "Selesai sebentar lagi..."
    ];

    useEffect(() => {
        if (isOpen) {
            let i = 0;
            const interval = setInterval(() => {
                setMessage(loadingMessages[i]);
                i = (i + 1) % loadingMessages.length;
            }, 1500);
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
            {/* Modal Content */}
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-10 max-w-sm w-full shadow-2xl border border-white/50 text-center relative overflow-hidden">

                {/* Animated Background Gradients */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                {/* Icons & Animation */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center justify-center animate-spin-slow opacity-30">
                        <div className="w-24 h-24 border-4 border-dashed border-indigo-500 rounded-full"></div>
                    </div>
                    <div className="flex justify-center items-center">
                        <div className="relative">
                            <Brain className="w-16 h-16 text-indigo-600 animate-pulse" />
                            <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
                        </div>
                    </div>
                </div>

                {/* Text */}
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent mb-2">
                    Sedang Menganalisis
                </h3>
                <p className="text-gray-600 font-medium h-6">{message}</p>

                {/* Progress Bar placeholder */}
                <div className="mt-8 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full animate-loadingBar"></div>
                </div>

            </div>

            <style jsx>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animate-loadingBar {
          width: 50%;
          animation: loading 2s ease-in-out infinite;
        }
        @keyframes loading {
          0% { width: 0%; transform: translateX(-50%); }
          50% { width: 100%; transform: translateX(0); }
          100% { width: 0%; transform: translateX(150%); }
        }
        .animate-fadeIn {
           animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
           from { opacity: 0; }
           to { opacity: 1; }
        }
      `}</style>
        </div>
    );
}
