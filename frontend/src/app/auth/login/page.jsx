"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import LoginForm from "@/components/forms/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 px-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-80 h-80 bg-purple-600 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-600 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-600 rounded-full blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 w-full max-w-md">
        {/* LOGO */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6">
            <Sparkles className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-6xl font-black text-white mb-3">Grapholyze</h1>
          <p className="text-purple-200 text-xl font-light">Ungkap Kepribadian dari Tulisan Tangan</p>
        </div>

        {/* 🔲 LOGIN CARD (INI YANG HILANG TADI) */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-10">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Selamat Datang Kembali</h2>

          <LoginForm />

          <div className="mt-8 text-center text-purple-300">
            Belum punya akun?{" "}
            <a href="/auth/register" className="font-bold text-white hover:underline">
              Daftar di sini
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
