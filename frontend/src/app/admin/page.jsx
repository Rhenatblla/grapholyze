"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Download, FileText, TrendingUp } from "lucide-react";
import * as XLSX from "xlsx";
import { useAuth } from "@/context/AuthContext";
import { adminApi } from "@/api";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [selectedType, setSelectedType] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Protected Route Check
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push(user ? "/dashboard" : "/auth/login");
    }
  }, [user, loading, router]);

  // Fetch Stats (Single Call)
  useEffect(() => {
    if (user?.role === "admin") {
      adminApi.getStats()
        .then(data => {
          setStats(data);
          setLoadingData(false);
        })
        .catch(err => {
          console.error("Failed to load dashboard:", err);
          setLoadingData(false);
        });
    }
  }, [user]);

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  // Process Distribution Data
  const personalityTypes = [
    { type: "Optimist", color: "#FFD700", label: "Optimis" }, // type 3? Mapping needed if types are numbers
    { type: "Introvert", color: "#8B5CF6", label: "Introvert" }, // type 2
    { type: "Creative", color: "#3B82F6", label: "Kreatif" }, // type 5
    { type: "Analytical", color: "#10B981", label: "Analitis" }, // type 4
    { type: "Leader", color: "#EF4444", label: "Pemimpin" }, // type 1
  ].map((pt, index) => {
    // Find count from stats.distribution
    // Assuming distribution is [{_id: 1, count: 5}, ...]
    // We need to map real types to these labels. For now, simplistic mapping:
    const match = stats?.distribution?.find(d => d._id === (index + 1)) || { count: 0 };
    return { ...pt, value: match.count };
  });

  const totalAnalyses = stats?.totalTests || 0;

  // Pie Chart Logic
  const totalCircle = personalityTypes.reduce((a, b) => a + b.value, 0) || 1;
  let cumulative = 0;
  const segments = personalityTypes.map((item) => {
    const percent = (item.value / totalCircle) * 100;
    const start = cumulative;
    cumulative += percent;
    return { ...item, percent, start };
  });

  const handleExport = () => {
    const data = (stats?.recentTests || []).map(analysis => ({
      "User": analysis.userId?.name || "Unknown",
      "Email": analysis.userId?.email || "-",
      "Personality Type": analysis.results?.personalityType || "-",
      "Confidence": analysis.results?.confidence || 0,
      "Date": new Date(analysis.createdAt).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Recent Analyses");
    XLSX.writeFile(wb, "GraphologyAI_Recent.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-10 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100 flex items-center justify-between"
          >
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Analisis</p>
              <p className="text-6xl font-bold text-gray-900 mt-3">{totalAnalyses}</p>
            </div>
            <div className="bg-blue-100 p-5 rounded-2xl">
              <FileText className="w-12 h-12 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100 flex flex-col justify-center items-center"
          >
            {/* Simplified Pie Chart Render */}
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle cx="100" cy="100" r="90" fill="none" stroke="#f3f4f6" strokeWidth="20" />
                {segments.map((seg, i) => (
                  <circle
                    key={i}
                    cx="100" cy="100" r="90"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="20"
                    strokeDasharray={`${seg.percent * 2.83} 283`}
                    strokeDashoffset={-seg.start * 2.83}
                    transform="rotate(-90 100 100)"
                  />
                ))}
                <text x="100" y="110" textAnchor="middle" className="text-4xl font-bold fill-gray-800">{totalAnalyses}</text>
              </svg>
            </div>
            <p className="mt-4 text-grap-500 font-medium">Distribution by Type</p>
          </motion.div>
        </div>

        {/* Tabel + Export */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">Recent Analyses</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                  <tr>
                    <th className="px-8 py-4 text-left">User</th>
                    <th className="px-8 py-4 text-left">Result Type</th>
                    <th className="px-8 py-4 text-center">Confidence</th>
                    <th className="px-8 py-4 text-center">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(stats?.recentTests || []).length === 0 ? (
                    <tr><td colSpan="4" className="px-8 py-5 text-center text-gray-500">No recent analyses.</td></tr>
                  ) : (
                    stats.recentTests.map((test) => (
                      <tr key={test._id} className="hover:bg-gray-50 transition">
                        <td className="px-8 py-5">
                          <p className="font-semibold text-gray-900">{test.userId?.name || "Unknown User"}</p>
                          <p className="text-xs text-gray-500">{test.userId?.email}</p>
                        </td>
                        <td className="px-8 py-5 text-gray-600">Type {test.results?.personalityType}</td>
                        <td className="px-8 py-5 text-center">{Math.round(test.results?.confidence || 0)}%</td>
                        <td className="px-8 py-5 text-center text-gray-500">
                          {new Date(test.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-xl font-bold mb-2">Export Data</h3>
              <p className="text-gray-600 text-sm">Download recent analysis data as Excel</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              disabled={!stats?.recentTests?.length}
              className="mt-8 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-6 h-6" />
              Download Excel
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}