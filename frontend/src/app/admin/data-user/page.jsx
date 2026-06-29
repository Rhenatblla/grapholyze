"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, MoreVertical, Mail, Calendar, Trash2 } from "lucide-react";
import { adminApi } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DataUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const { user } = useAuth();
  const router = useRouter();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers(page, 10, searchTerm);
      setUsers(data.users || []);
      setTotalPages(data.pages || 1);
      setTotalUsers(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Fetch ALL users (limit: 0)
      const data = await adminApi.getUsers(1, 0, searchTerm); // Respect search term if needed, or remove searchTerm to export all
      const allUsers = data.users || [];

      // Build CSV
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "No,Nama Lengkap,Email,Gender,Umur,Role,Tanggal Join\n";

      allUsers.forEach((user, index) => {
        const date = new Date(user.createdAt).toLocaleDateString('id-ID');
        const age = user.profile?.age || "-";
        const gender = user.profile?.gender || "-";
        csvContent += `${index + 1},"${user.name}","${user.email}","${gender}","${age}",${user.role},${date}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `GraphologyAI_Users_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Export failed", error);
      alert("Gagal mengunduh data.");
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
      setDeleteLoading(userId);
      await adminApi.deleteUser(userId);
      fetchUsers(); // Refresh list
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleteLoading(null);
    }
  };

  if (!user || user.role !== 'admin') {
    // Optional: middleware should handle this, but double check
    return <div className="p-10 text-center">Unauthorized</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-10 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data User</h1>
          <p className="text-gray-600 mt-1">Manage and monitor all Grapholyze users</p>
        </div>
        <button onClick={fetchUsers} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Refresh Data</button>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        {/* Search & Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"
              >
                <Download className="w-5 h-5" /> Export List
              </button>
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-800">User List</h2>
            <span className="text-sm text-gray-500 font-medium bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">{totalUsers} Total Users</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User Profile</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-8 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined Date</th>
                  <th className="px-8 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-8 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-12 text-center text-gray-500">
                      <div className="flex justify-center flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        Loading data...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan="5" className="px-8 py-12 text-center text-gray-500">No users found matching your search.</td></tr>
                ) : (
                  <AnimatePresence>
                    {users.map((user, i) => (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-indigo-50/30 transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{user.name}</p>
                              <p className="text-xs text-gray-400">ID: {user._id.slice(-6)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {user.email}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button
                            onClick={() => handleDelete(user._id)}
                            disabled={deleteLoading === user._id || user.role === 'admin'}
                            className={`p-2 rounded-lg transition-colors ${user.role === 'admin' ? 'opacity-30 cursor-not-allowed text-gray-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-600'}`}
                            title="Delete User"
                          >
                            {deleteLoading === user._id ? (
                              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-8 py-5 border-t border-gray-200 flex justify-between items-center bg-gray-50/50">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-white transition"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 font-medium">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-white transition"
            >
              Next
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}