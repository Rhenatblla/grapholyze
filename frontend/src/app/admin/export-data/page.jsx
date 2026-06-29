"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Users, Calendar, Clock, CheckCircle } from "lucide-react";
import { adminApi } from "@/api";

export default function ExportData() {
  const [isExporting, setIsExporting] = useState(false);
  const [totalUsers, setTotalUsers] = useState("...");

  // Fetch total count on mount just for display
  useState(() => {
    adminApi.getStats().then(data => setTotalUsers(data.totalUsers)).catch(err => console.error(err));
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Fetch ALL users (limit: 0)
      const data = await adminApi.getUsers(1, 0, "");
      const users = data.users || [];

      // Build CSV
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "No,Nama Lengkap,Email,Gender,Umur,Role,Tanggal Join\n";

      users.forEach((user, index) => {
        const date = new Date(user.createdAt).toLocaleDateString('id-ID');
        const age = user.profile?.age || "-";
        const gender = user.profile?.gender || "-";
        csvContent += `${index + 1},"${user.name}","${user.email}","${gender}","${age}",${user.role},${date}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `GraphologyAI_All_Users_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Export failed", error);
      alert("Gagal mengunduh data. Silakan coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-10 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>
        <p className="text-gray-600 mt-1">Download semua data pengguna dalam format Excel (CSV)</p>
      </div>

      <div className="p-8 max-w-7xl mx-auto">

        {/* Card Utama */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-12 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10 text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Download className="w-14 h-14" />
            </div>
            <h2 className="text-5xl font-bold mb-4">Siap Download Data?</h2>
            <p className="text-xl opacity-90 mb-10">Total {totalUsers} pengguna siap diekspor dalam format Excel</p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              disabled={isExporting}
              className="bg-white text-indigo-600 text-2xl font-bold px-16 py-8 rounded-3xl shadow-2xl flex items-center gap-5 mx-auto hover:shadow-3xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-10 h-10 border-4 border-indigo-300 border-t-white rounded-full animate-spin"></div>
                  <span>Sedang menyiapkan file...</span>
                </>
              ) : (
                <>
                  <Download className="w-10 h-10" />
                  <span>Download Data Sekarang (.csv)</span>
                </>
              )}
            </motion.button>

            <div className="mt-10 grid grid-cols-3 gap-8 text-center">
              <div>
                <Users className="w-12 h-12 mx-auto mb-2 opacity-80" />
                <p className="text-4xl font-bold">{totalUsers}</p>
                <p className="text-lg opacity-90">Total Pengguna</p>
              </div>
              <div>
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-80" />
                <p className="text-4xl font-bold">CSV</p>
                <p className="text-lg opacity-90">Format File</p>
              </div>
              <div>
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-80" />
                <p className="text-4xl font-bold">{new Date().getFullYear()}</p>
                <p className="text-lg opacity-90">Data Terbaru</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 bg-blue-50 border-2 border-blue-200 rounded-3xl p-8 text-center"
        >
          <CheckCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-blue-900 mb-2">File akan otomatis terdownload!</h3>
          <p className="text-blue-700 text-lg">Bisa langsung dibuka di Microsoft Excel, Google Sheets, atau LibreOffice</p>
        </motion.div>

        {/* Riwayat Mini */}
        <div className="mt-10 text-center">
          <p className="text-gray-600">
            <Clock className="inline w-5 h-5" /> Data Real-time dari Database
          </p>
        </div>
      </div>
    </div>
  );
}