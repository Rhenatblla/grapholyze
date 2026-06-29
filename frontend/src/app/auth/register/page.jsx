"use client";

import { motion } from "framer-motion";
import { Sparkles, Shield } from "lucide-react";
import RegisterForm from "@/components/forms/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-80 h-80 bg-purple-600 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-600 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6">
            <Sparkles className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-6xl font-black text-white mb-3">Grapholyze</h1>
          <p className="text-purple-200 text-xl font-light">
            Daftar & Mulai Analisis Tulisan Tangan
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-10">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Buat Akun Baru
          </h2>

          {/* LOGIC ADA DI FORM */}
          <RegisterForm />

          <div className="pt-8 border-t border-white/10 mt-8">
            <button className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-3">
              <Shield className="w-6 h-6" />
              Masuk sebagai Admin (Demo)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
