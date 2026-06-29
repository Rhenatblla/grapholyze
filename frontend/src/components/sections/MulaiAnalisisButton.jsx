"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function MulaiAnalisisButton() {
  const router = useRouter();
  const { user } = useAuth();

  const handleClick = () => {
    if (!user) {
      router.push("/login");
    } else {
      router.push("/user/homeanalisis"); // Updated to new analysis page
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative z-50 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-lg px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
    >
      Mulai Analisis
    </button>
  );
}
