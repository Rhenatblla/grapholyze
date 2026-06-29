"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, LogOut, Camera, Save } from "lucide-react";
import { authApi, analysisApi } from "@/api";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); // RAW FILE FOR UPLOAD
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [analysisHistory, setAnalysisHistory] = useState([]);

  // Protected route check
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/auth/login");
      return;
    }
  }, [user, loading, router]);

  // Fetch user profile and analysis history
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoadingData(true);
        // Fetch user profile
        const profileData = await authApi.getProfile();

        setFormData({
          name: profileData.name || "",
          email: profileData.email || "",
          phoneNumber: profileData.phoneNumber || "",
        });

        // Set initial profile image if exists
        if (profileData.profilePicture) {
          // Check if full URL or relative
          const imageUrl = profileData.profilePicture.startsWith("http") ? profileData.profilePicture : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${profileData.profilePicture}`;
          setProfileImage(imageUrl);
        }

        // Fetch analysis history
        try {
          const historyRes = await analysisApi.getHistory(user._id || user.id);
          setAnalysisHistory(historyRes?.data?.analyses || []);
        } catch (err) {
          console.error("Error fetching history:", err);
          // Don't fail entire page if history fails
        }

        setLoadingData(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setErrorMessage("Failed to load profile: " + error.message);
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file); // SAVE RAW FILE
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result); // PREVIEW
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = new FormData();
      dataToSubmit.append("name", formData.name);
      dataToSubmit.append("email", formData.email);
      dataToSubmit.append("phoneNumber", formData.phoneNumber);

      if (selectedFile) {
        dataToSubmit.append("profilePicture", selectedFile);
      }

      await authApi.updateProfile(dataToSubmit);

      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(""), 3000);

      // Refresh to ensure everything is synced
      const freshProfile = await authApi.getProfile();

      // Update AuthContext so Navbar updates immediately
      if (updateUser) {
        updateUser({ ...user, ...freshProfile });
      }

      if (freshProfile.profilePicture) {
        const imageUrl = freshProfile.profilePicture.startsWith("http") ? freshProfile.profilePicture : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${freshProfile.profilePicture}`;
        setProfileImage(imageUrl);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage(error.message || "Error updating profile");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage("Passwords do not match!");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    try {
      await authApi.changePassword(passwordData.currentPassword, passwordData.newPassword);

      setSuccessMessage("Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsChangingPassword(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      // Validasi error (misal password salah) cukup tampilkan notifikasi, jangan console.error agar tidak dianggap system crash
      setErrorMessage(error.message || "Error changing password");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pt-16 pb-12 px-4">
      <div className="max-w-4xl mx-auto" suppressHydrationWarning>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and personal information</p>
        </motion.div>

        {/* Messages */}
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </motion.div>
        )}
        {errorMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {errorMessage}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info Card */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-8">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-6">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                  {profileImage ? <img src={profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" /> : <User className="w-16 h-16 text-white" />}
                </div>
                <label className="absolute bottom-0 right-0 bg-purple-600 text-white p-3 rounded-full cursor-pointer hover:bg-purple-700 transition shadow-lg">
                  <Camera className="w-5 h-5" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{formData.name}</h2>
              <p className="text-gray-600 text-sm">{formData.email}</p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <button onClick={() => setIsEditing(!isEditing)} className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2">
                <User className="w-5 h-5" />
                Edit Profile
              </button>
              <button onClick={() => setIsChangingPassword(!isChangingPassword)} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </button>
              <button onClick={handleLogout} className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2">
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </motion.div>

          {/* Forms and History */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-8">
            {/* Edit Profile Form */}
            {isEditing && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button type="submit" className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2">
                      <Save className="w-5 h-5" />
                      Save Changes
                    </button>
                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-400 transition">
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Change Password Form */}
            {isChangingPassword && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>
                  <div className="flex gap-4">
                    <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                      <Save className="w-5 h-5" />
                      Update Password
                    </button>
                    <button type="button" onClick={() => setIsChangingPassword(false)} className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-400 transition">
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Analysis History */}
            {!isEditing && !isChangingPassword && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Analysis History</h3>
                {loadingData ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  </div>
                ) : analysisHistory.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No analysis history yet</p>
                ) : (
                  <div className="space-y-4">
                    {analysisHistory.map((analysis, index) => (
                      <motion.div key={analysis._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900 capitalize">{analysis.analysisType}</p>
                            <p className="text-sm text-gray-600">Type: {analysis.personalityType}</p>
                          </div>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-semibold ${
                              analysis.status === "completed" ? "bg-green-100 text-green-800" : analysis.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {analysis.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(analysis.createdAt).toLocaleDateString()} at {new Date(analysis.createdAt).toLocaleTimeString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
