"use client";

import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { Sparkles, Bell, User, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AdminNavbar() {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const router = useRouter();
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        logout();
        router.push("/auth/login");
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-end sticky top-0 z-40 gap-6">
            {/* Notification Icon */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-all border border-transparent hover:border-gray-100"
                >
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-gray-900">{user?.name || "Admin"}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role || "Administrator"}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-indigo-100 relative">
                        <Image
                            src={
                                user?.profilePicture
                                    ? (user.profilePicture.startsWith('http')
                                        ? user.profilePicture
                                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${user.profilePicture}`)
                                    : "/profile.jpeg"
                            }
                            alt="Profile"
                            fill
                            className="object-cover"
                            onError={(e) => { e.target.src = "/profile.jpeg" }}
                        />
                    </div>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden animate-fade-in-down z-50">
                        <div className="px-4 py-3 border-b bg-gray-50/50">
                            <p className="text-sm font-semibold text-gray-900">Signed in as</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <div className="py-1">
                            <button
                                onClick={() => router.push("/admin/profile")}
                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <User className="w-4 h-4 mr-3 text-gray-400" />
                                Manage Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-4 h-4 mr-3" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
