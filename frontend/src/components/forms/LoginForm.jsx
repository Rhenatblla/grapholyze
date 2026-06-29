"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/api";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateForm = () => {
    if (!email.trim()) {
      setError("Email tidak boleh kosong");
      return false;
    }
    if (!email.includes("@")) {
      setError("Format email tidak valid");
      return false;
    }
    if (!password) {
      setError("Password tidak boleh kosong");
      return false;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      // 1. Call backend API untuk login
      // Backend akan men-set HttpOnly Cookie secara otomatis
      const loginResponse = await authApi.login(email, password);

      console.log("LOGIN RAW RESPONSE:", loginResponse); 

      // ✅ PERBAIKAN DI SINI: Cek 'success', bukan 'token'
      if (loginResponse.success) {
        
        // 2. Fetch User Profile lengkap
        // (Browser otomatis mengirim cookie token yang baru didapat)
        try {
          const userProfile = await authApi.getProfile();
          console.log("FULL USER PROFILE FETCHED:", userProfile);

          const userDataToSave = {
            id: userProfile._id || userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            role: userProfile.role || "user",
            photo: userProfile.photo,
          };

          // 3. Simpan Data User ke Context & LocalStorage (Tanpa Token)
          // Kita tidak perlu menyimpan token string lagi
          login(userDataToSave); 
          localStorage.setItem("userData", JSON.stringify(userDataToSave));

          // 4. Redirect
          console.log("Redirecting based on role:", userProfile.role);
          
          if (userProfile.role === 'admin') {
            // Set flag client-side untuk middleware (opsional, tergantung logic middleware kamu)
            document.cookie = "admin_access=true; path=/";
            router.push("/admin");
          } else {
            router.push("/");
          }

        } catch (profileError) {
          console.error("Failed to fetch profile:", profileError);
          // Jika gagal ambil profil, anggap login gagal
          throw new Error("Gagal mengambil data profil user.");
        }

      } else {
        // Jika success: false
        throw new Error(loginResponse.message || "Login gagal.");
      }

    } catch (err) {
      console.warn("Login attempt failed:", err);
      setError(`Terjadi kesalahan: ${err.message || 'Silakan coba lagi.'}`);
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-100/20 border border-red-300 rounded-2xl text-red-400">
          <AlertCircle size={20} className="flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Email */}
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="example@gmail.com"
          autoComplete="email"
          className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
        />
      </div>

      {/* Password */}
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          autoComplete="current-password"
          className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
        />
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition">
          {showPassword ? <EyeOff /> : <Eye />}
        </button>
      </div>

      {/* Ingat Saya */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-purple-200 cursor-pointer">
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-purple-500 w-4 h-4 rounded" />
          Ingat saya
        </label>

        <a href="/forgot-password" className="text-purple-300 hover:text-white transition">
          Lupa password?
        </a>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-400 disabled:to-pink-400 text-white font-semibold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Memproses...
          </>
        ) : (
          "Masuk"
        )}
      </button>
    </form>
  );
}