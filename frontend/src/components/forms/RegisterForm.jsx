"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/api";

export default function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateForm = () => {
    if (!name.trim()) {
      setError("Nama tidak boleh kosong");
      return false;
    }
    if (!email.trim()) {
      setError("Email tidak boleh kosong");
      return false;
    }
    if (!email.includes("@")) {
      setError("Format email tidak valid");
      return false;
    }
    if (!age || age < 12) {
      setError("Umur harus diisi (min 12 tahun)");
      return false;
    }
    if (!gender) {
      setError("Silakan pilih jenis kelamin");
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
    if (password !== confirmPassword) {
      setError("Password tidak cocok");
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
      const data = await authApi.register({
        name,
        email,
        password,
        age: parseInt(age),
        gender
      });

      // Register berhasil - login otomatis
      if (data.token) {
        localStorage.setItem("authToken", data.token);

        try {
          const userProfile = await authApi.getProfile();
          const userDataToSave = {
            id: userProfile._id || userProfile.id,
            email: userProfile.email,
            name: userProfile.name,
            role: userProfile.role || "user",
            photo: userProfile.profilePicture,
          };

          login({ ...userDataToSave, token: data.token });
          localStorage.setItem("userData", JSON.stringify(userDataToSave));

        } catch (profileError) {
          console.error("Failed to fetch profile after register:", profileError);
          // Fallback
          login({
            token: data.token,
            ...data
          });
        }
      }

      setLoading(false);
      router.push("/");
    } catch (err) {
      console.error("Register error:", err);
      setError(err.response?.data?.message || "Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-live="polite">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-100/20 border border-red-300 rounded-2xl text-red-400">
          <AlertCircle size={20} className="flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Nama */}
      <div className="text-left">
        <label className="block text-gray-700 font-medium mb-2">Nama Lengkap</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input type="text" placeholder="Nama lengkap" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 py-6 text-base" required />
        </div>
      </div>

      {/* Email */}
      <div className="text-left">
        <label className="block text-gray-700 font-medium mb-2">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 py-6 text-base" required />
        </div>
      </div>

      {/* Age & Gender Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-left">
          <label className="block text-gray-700 font-medium mb-2">Umur</label>
          <Input type="number" placeholder="Contoh: 25" value={age} onChange={(e) => setAge(e.target.value)} className="py-6 text-base" min="12" required />
        </div>
        <div className="text-left">
          <label className="block text-gray-700 font-medium mb-2">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 h-[50px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="" disabled>Pilih...</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>
      </div>

      {/* Password */}
      <div className="text-left">
        <label className="block text-gray-700 font-medium mb-2">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 py-6 text-base" required />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Konfirmasi Password */}
      <div className="text-left">
        <label className="block text-gray-700 font-medium mb-2">Konfirmasi Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input type={showConfirmPassword ? "text" : "password"} placeholder="Konfirmasi password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 pr-10 py-6 text-base" required />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={loading} className={`w-full bg-[#7B61FF] hover:bg-[#6B51EF] text-white py-6 text-base font-semibold rounded-lg ${loading ? "opacity-80 pointer-events-none" : ""}`}>
        {loading ? "Mendaftar..." : "Daftar"}
      </Button>
    </form>
  );
}
