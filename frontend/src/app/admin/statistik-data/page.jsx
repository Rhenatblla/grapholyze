"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Activity, Calendar, Clock, Target, Award, Zap, ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { adminApi } from "@/api";

export default function StatistikData() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminApi.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) return <div className="p-10 text-center">Failed to load statistics.</div>;

  // Transform Data for Charts
  // 1. Daily Activity (Last 7 Days) - Merge valid dates
  const dailyData = (stats.dailyActivity?.users || []).map(item => {
    const testItem = stats.dailyActivity?.tests?.find(t => t._id === item._id);
    return {
      day: new Date(item._id).toLocaleDateString('id-ID', { weekday: 'long' }),
      users: item.count,
      tests: testItem ? testItem.count : 0
    };
  });

  // If empty (no data yet), provide placeholder to prevent crash
  if (dailyData.length === 0) {
    dailyData.push({ day: "No Data", users: 0, tests: 0 });
  }

  // 2. Monthly Growth
  const growthData = (stats.monthlyGrowth?.users || []).map(item => {
    const testItem = stats.monthlyGrowth?.tests?.find(t => t._id === item._id);
    return {
      month: new Date(item._id).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
      users: item.count,
      tests: testItem ? testItem.count : 0
    };
  });

  const kpis = [
    { label: "Total Pengguna", value: stats.totalUsers || 0, change: "+100%", trend: "up", icon: Users, color: "indigo" },
    { label: "Total Tes Selesai", value: stats.totalTests || 0, change: "+100%", trend: "up", icon: Target, color: "purple" },
    // Mocking these for now as backend doesn't compute them yet
    { label: "Rata-rata Waktu Tes", value: "5.2 menit", change: "-5%", trend: "down", icon: Clock, color: "pink" },
    { label: "Konversi (Estimasi)", value: "75%", change: "+15%", trend: "up", icon: Activity, color: "green" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-10 py-6">
        <h1 className="text-4xl font-bold text-gray-900">Statistik & Analitik</h1>
        <p className="text-gray-600 mt-2 text-lg">Pantau performa GraphologyAI secara real-time</p>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-10">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {kpis.map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-gray-100 rounded-full -mr-16 -mt-16 opacity-50"></div>

              <div className={`w-16 h-16 bg-${kpi.color}-100 rounded-2xl flex items-center justify-center mb-6`}>
                <kpi.icon className={`w-9 h-9 text-${kpi.color}-600`} />
              </div>

              <p className="text-gray-600 text-sm font-medium">{kpi.label}</p>
              <p className="text-5xl font-bold text-gray-900 mt-2">{kpi.value}</p>

              <div className={`flex items-center gap-2 mt-4 ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {kpi.trend === "up" ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                <span className="font-bold text-lg">{kpi.change}</span>
                <span className="text-sm">vs baseline</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Aktivitas Harian (Line + Area Chart) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-200"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <Activity className="w-10 h-10 text-indigo-600" />
            Aktivitas Pengguna (7 Hari Terakhir)
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#666" />
              <YAxis stroke="#666" allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#1f2937", border: "none", borderRadius: "12px", color: "white" }}
              />
              <Area type="monotone" dataKey="users" stackId="1" stroke="#8b5cf6" fill="#c4b5fd" name="User Baru" />
              <Area type="monotone" dataKey="tests" stackId="1" stroke="#3b82f6" fill="#93c5fd" name="Tes Selesai" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pertumbuhan Bulanan (Bar Chart) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <TrendingUp className="w-10 h-10 text-green-600" />
              Pertumbuhan Pengguna (6 Bulan)
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="users" fill="#10b981" radius={[10, 10, 0, 0]} name="Total Pengguna" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <Zap className="w-10 h-10 text-yellow-600" />
              Total Tes per Bulan
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="tests" stroke="#f59e0b" strokeWidth={5} dot={{ fill: "#f59e0b", r: 8 }} name="Tes Selesai" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Closing Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-white text-center shadow-2xl"
        >
          <h2 className="text-5xl font-bold mb-4">GraphologyAI Summary</h2>
          <p className="text-2xl opacity-90">Real-time Data Insights</p>
          <div className="mt-8 flex justify-center gap-8">
            <div className="text-center">
              <p className="text-6xl font-bold">{stats.totalUsers}</p>
              <p className="text-xl">Total Pengguna</p>
            </div>
            <div className="text-center">
              <p className="text-6xl font-bold">{stats.totalTests}</p>
              <p className="text-xl">Tes Selesai</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}