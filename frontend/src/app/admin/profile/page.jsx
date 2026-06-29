"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Camera, Save, Shield } from "lucide-react";
import { authApi } from "@/api";
import { useAuth } from "@/context/AuthContext";

export default function AdminProfilePage() {
    const router = useRouter();
    const { user, loading, updateUser } = useAuth(); // No logout needed here, handled by Navbar

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
    const [selectedFile, setSelectedFile] = useState(null);
    const [loadingData, setLoadingData] = useState(true);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [activeTab, setActiveTab] = useState("general"); // 'general' or 'security'

    // Admin Check
    useEffect(() => {
        if (loading) return;
        if (!user || user.role !== 'admin') {
            router.push("/auth/login");
        }
    }, [user, loading, router]);

    // Fetch Data
    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                setLoadingData(true);
                const profileData = await authApi.getProfile();

                setFormData({
                    name: profileData.name || "",
                    email: profileData.email || "",
                    phoneNumber: profileData.phoneNumber || "",
                });

                if (profileData.profilePicture) {
                    const imageUrl = profileData.profilePicture.startsWith('http')
                        ? profileData.profilePicture
                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${profileData.profilePicture}`;
                    setProfileImage(imageUrl);
                }
                setLoadingData(false);
            } catch (error) {
                setErrorMessage("Failed to load profile");
                setLoadingData(false);
            }
        };
        fetchData();
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setProfileImage(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const dataToSubmit = new FormData();
            dataToSubmit.append('name', formData.name);
            dataToSubmit.append('email', formData.email);
            dataToSubmit.append('phoneNumber', formData.phoneNumber);
            if (selectedFile) dataToSubmit.append('profilePicture', selectedFile);

            await authApi.updateProfile(dataToSubmit);
            setSuccessMessage("Admin profile updated successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);

            const freshProfile = await authApi.getProfile();
            if (updateUser) updateUser({ ...user, ...freshProfile });

        } catch (error) {
            setErrorMessage(error.message || "Update failed");
            setTimeout(() => setErrorMessage(""), 3000);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setErrorMessage("Passwords do not match!");
            return;
        }
        try {
            await authApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
            setSuccessMessage("Password changed successfully!");
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (error) {
            setErrorMessage(error.message || "Change password failed");
            setTimeout(() => setErrorMessage(""), 3000);
        }
    };

    if (loading || loadingData) {
        return <div className="p-10 text-center text-gray-500">Loading admin profile...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Admin Settings</h1>
                    <p className="text-gray-500 text-sm">Manage your admin account preferences</p>
                </div>
                <div className="bg-indigo-100 px-4 py-2 rounded-lg text-indigo-700 font-medium text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Admin Access
                </div>
            </div>

            {/* Notifications */}
            {successMessage && <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{successMessage}</div>}
            {errorMessage && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{errorMessage}</div>}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-8 py-4 text-sm font-medium transition-colors ${activeTab === 'general' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        General Information
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`px-8 py-4 text-sm font-medium transition-colors ${activeTab === 'security' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Security & Password
                    </button>
                </div>

                <div className="p-8">
                    {activeTab === 'general' ? (
                        <form onSubmit={handleUpdateProfile} className="max-w-2xl">
                            {/* Avatar Upload */}
                            <div className="flex items-center gap-6 mb-8">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-sm overflow-hidden">
                                        {profileImage ? (
                                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <User className="w-10 h-10" />
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 text-white rounded-full cursor-pointer hover:bg-indigo-700 transition shadow-sm">
                                        <Camera className="w-4 h-4" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Profile Photo</h3>
                                    <p className="text-xs text-gray-500 mt-1">Accepts JPG, PNG or GIF. Max size 2MB.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" />
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Save Changes
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleChangePassword} className="max-w-xl">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                    <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                    <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" />
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm flex items-center gap-2">
                                    <Lock className="w-4 h-4" /> Update Password
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
