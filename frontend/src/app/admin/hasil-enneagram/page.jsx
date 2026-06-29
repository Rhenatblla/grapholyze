"use client";

import { motion } from "framer-motion";
import { Users, TrendingUp, Award, Target, Heart, Brain, Zap, Shield, Star } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

export default function HasilEnneagram() {
  // Data distribusi tipe Enneagram
  const pieData = [
    { name: "Tipe 1 - Reformer", value: 18, color: "#6B7280", icon: Shield },
    { name: "Tipe 2 - Helper", value: 32, color: "#EC4899", icon: Heart },
    { name: "Tipe 3 - Achiever", value: 28, color: "#3B82F6", icon: Award },
    { name: "Tipe 4 - Individualist", value: 22, color: "#10B981", icon: Star },
    { name: "Tipe 5 - Investigator", value: 26, color: "#F59E0B", icon: Brain },
    { name: "Tipe 6 - Loyalist", value: 15, color: "#8B5CF6", icon: Target },
    { name: "Tipe 7 - Enthusiast", value: 12, color: "#EF4444", icon: Zap },
    { name: "Tipe 8 - Challenger", value: 19, color: "#1F2937", icon: TrendingUp },
    { name: "Tipe 9 - Peacemaker", value: 24, color: "#06B6D4", icon: Users },
  ];

  const totalUsers = pieData.reduce((acc, curr) => acc + curr.value, 0);

  // Data trend bulanan
  const monthlyData = [
    { month: "Okt 2024", tipe1: 5, tipe2: 12, tipe3: 10, tipe4: 8, tipe5: 11 },
    { month: "Nov 2024", tipe1: 7, tipe2: 15, tipe3: 14, tipe4: 10, tipe5: 13 },
    { month: "Des 2024", tipe1: 9, tipe2: 18, tipe3: 16, tipe4: 12, tipe5: 15 },
    { month: "Jan 2025", tipe1: 12, tipe2: 22, tipe3: 20, tipe4: 15, tipe5: 18 },
    { month: "Feb 2025", tipe1: 15, tipe2: 28, tipe3: 24, tipe4: 18, tipe5: 22 },
    { month: "Mar 2025", tipe1: 18, tipe2: 32, tipe3: 28, tipe4: 22, tipe5: 26 },
  ];

  const top5Users = [
    { rank: 1, name: "Jovita Cantika", type: 5, score: 98, tests: 7 },
    { rank: 2, name: "Budi Santoso", type: 3, score: 95, tests: 15 },
    { rank: 3, name: "Rhena Putri", type: 2, score: 93, tests: 4 },
    { rank: 4, name: "Aisyah Nur", type: 4, score: 91, tests: 9 },
    { rank: 5, name: "Aditya Wijaya", type: 5, score: 89, tests: 9 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-10 py-6">
        <h1 className="text-4xl font-bold text-gray-900">Hasil Tes Enneagram</h1>
        <p className="text-gray-600 mt-2 text-lg">Analisis lengkap kepribadian pengguna GraphologyAI</p>
      </div>

      <div className="p-8 max-w-7xl mx-auto space-y-8">

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Total Tes Selesai", value: "892", icon: Target, color: "indigo" },
            { label: "Pengguna Terdaftar", value: "196", icon: Users, color: "purple" },
            { label: "Tipe Terpopuler", value: "Tipe 2", icon: Heart, color: "pink" },
            { label: "Rata-rata Skor", value: "87.4", icon: Star, color: "yellow" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gradient-to-br from-white to-gray-100 rounded-3xl p-8 shadow-xl border border-gray-200"
            >
              <div className={`w-16 h-16 bg-${stat.color}-100 rounded-2xl flex items-center justify-center mb-4`}>
                <stat.icon className={`w-9 h-9 text-${stat.color}-600`} />
              </div>
              <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Pie Chart + Legend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-200"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Distribusi Tipe Enneagram</h2>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} orang`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-6">
              <p className="text-5xl font-bold text-indigo-600">{totalUsers}</p>
              <p className="text-gray-600 text-lg">Total Pengguna yang Sudah Tes</p>
            </div>
          </motion.div>

          {/* Legend Manual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-200"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Detail Tipe Kepribadian</h2>
            <div className="space-y-5">
              {pieData.map((type, i) => {
                const Icon = type.icon;
                const percentage = ((type.value / totalUsers) * 100).toFixed(1);
                return (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                        style={{ backgroundColor: type.color }}
                      >
                        {type.name.charAt(6)}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{type.name}</p>
                        <p className="text-gray-600">{type.value} orang</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: type.color }}>
                      {percentage}%
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Bar Chart Trend */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-200"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Trend Top 5 Tipe (6 Bulan Terakhir)</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tipe1" stackId="a" fill="#6B7280" name="Tipe 1 - Reformer" />
              <Bar dataKey="tipe2" stackId="a" fill="#EC4899" name="Tipe 2 - Helper" />
              <Bar dataKey="tipe3" stackId="a" fill="#3B82F6" name="Tipe 3 - Achiever" />
              <Bar dataKey="tipe4" stackId="a" fill="#10B981" name="Tipe 4 - Individualist" />
              <Bar dataKey="tipe5" stackId="a" fill="#F59E0B" name="Tipe 5 - Investigator" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top 5 Users */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl shadow-2xl p-10 text-white"
        >
          <h2 className="text-3xl font-bold text-center mb-10">
            Top 5 Pengguna dengan Skor Tertinggi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {top5Users.map((user) => (
              <motion.div
                key={user.rank}
                whileHover={{ scale: 1.08 }}
                className="text-center"
              >
                <div className={`relative mx-auto ${user.rank === 1 ? "w-32 h-32" : "w-24 h-24"}`}>
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                  <div className="relative w-full h-full bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl font-bold">
                    {user.rank === 1 ? "1st" : user.rank === 2 ? "2nd" : user.rank === 3 ? "3rd" : `${user.rank}th`}
                  </div>
                  {user.rank <= 3 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 text-5xl">Crown</div>
                  )}
                </div>
                <h3 className="mt-6 text-xl font-bold">{user.name}</h3>
                <p className="text-lg opacity-90">Tipe {user.type} • Skor {user.score}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Fun Fact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-pink-500 to-orange-500 rounded-3xl p-10 text-white text-center shadow-2xl"
        >
          <h2 className="text-4xl font-bold mb-4">Fun Fact!</h2>
          <p className="text-2xl">Tipe 2 (Helper) adalah tipe paling banyak — pengguna kita penuh kasih sayang!</p>
        </motion.div>
      </div>
    </div>
  );
}