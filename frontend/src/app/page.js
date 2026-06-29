"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/sections/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import Footer from "@/components/sections/Footer";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden pt-20">
      {/* ✨ Loading shimmer */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a1a] transition-opacity duration-700">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {/* Navbar handled by Layout */}
      {/* Homepage hanya Hero Section dengan buttons */}
      <HeroSection id="home" />
      <AboutSection />
      <Footer />
    </main >
  );
}
