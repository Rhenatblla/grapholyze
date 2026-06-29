"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LogIn, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginRequiredModal({ isOpen, onClose }) {
    const router = useRouter();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Decorative Background */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex flex-col items-center text-center pt-4">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                            <LogIn className="w-8 h-8 text-indigo-600" />
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Login Diperlukan
                        </h3>

                        <p className="text-gray-600 mb-8">
                            Maaf, Anda perlu login terlebih dahulu untuk menggunakan fitur Analisis Tulisan Tangan AI kami.
                        </p>

                        <div className="flex gap-4 w-full">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => router.push("/auth/login")}
                                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:shadow-lg hover:scale-[1.02] transition transform"
                            >
                                Login Sekarang
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
