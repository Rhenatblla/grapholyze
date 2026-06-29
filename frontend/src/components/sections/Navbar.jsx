"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("/profile.jpeg");
  const [isClient, setIsClient] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const profileRef = useRef(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // update avatar
  useEffect(() => {
    if (user?.profilePicture) {
      const imageUrl = user.profilePicture.startsWith('http')
        ? user.profilePicture
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${user.profilePicture}`;
      setImgSrc(imageUrl);
    } else {
      setImgSrc("/profile.jpeg");
    }
  }, [user]);

  // close dropdown
  useEffect(() => {
    function handleOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const handleScrollOrNavigate = (page) => {
    if (page === "home") {
      router.push("/");
    } else if (page === "handwriting") {
      router.push("/user/homeanalisis");
    } else if (page === "about") {
      router.push("/about");
    } else if (page === "login") {
      router.push("/auth/login");
    }
    setMobileOpen(false);
  };

  // Hide Navbar on Admin pages (admin has its own navbar)
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-md transition-all duration-300" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center" suppressHydrationWarning>
        <div onClick={() => handleScrollOrNavigate("home")} className="cursor-pointer hover:opacity-80 transition-opacity">
          <Image
            src="/grapholyze_logo.png"
            alt="Grapholyze Capstone Logo"
            width={240}
            height={60}
            className="w-auto h-14 object-contain"
            priority
          />
        </div>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => handleScrollOrNavigate("home")} className="text-gray-700 font-medium hover:text-[#1e3a8a] transition-colors relative group">
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1e3a8a] transition-all group-hover:w-full"></span>
          </button>
          <button onClick={() => handleScrollOrNavigate("handwriting")} className="text-gray-700 font-medium hover:text-[#1e3a8a] transition-colors relative group">
            Handwriting Analyst
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1e3a8a] transition-all group-hover:w-full"></span>
          </button>
          <button onClick={() => router.push("/learn-more")} className="text-gray-700 font-medium hover:text-[#1e3a8a] transition-colors relative group">
            Learn More
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1e3a8a] transition-all group-hover:w-full"></span>
          </button>

          {isClient && (
            !user ? (
              <button onClick={() => router.push("/auth/login")} className="bg-[#1e3a8a] text-white px-6 py-2.5 rounded-full font-medium hover:bg-blue-900 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Login/Register
              </button>
            ) : (
              <div ref={profileRef} className="relative">
                <button onClick={() => setProfileOpen((v) => !v)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-[#1e3a8a] transition-colors">
                  <img src={imgSrc} alt="avatar" className="w-full h-full object-cover" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden animate-fade-in-down">
                    <div className="px-4 py-3 border-b bg-gray-50/50">
                      <div className="font-semibold text-gray-800">{user.name || "User"}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                      <div className="text-xs text-[#1e3a8a] mt-1 font-medium bg-blue-50 inline-block px-1.5 py-0.5 rounded">Role: {user.role || "user"}</div>
                    </div>
                    {user.role === "admin" && (
                      <button onClick={() => router.push("/admin")} className="block w-full px-4 py-2 text-left hover:bg-gray-50 font-medium text-purple-600 transition-colors">
                        📊 Admin Dashboard
                      </button>
                    )}
                    <button onClick={() => router.push("/profile")} className="block w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 transition-colors">
                      👤 Profile
                    </button>
                    <button onClick={handleLogout} className="block w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 transition-colors">
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
