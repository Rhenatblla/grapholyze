"use client";

import { useState, useEffect } from "react";
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
    <main className="relative min-h-screen overflow-x-hidden pt-16 md:pt-20">
      {/* ✨ Loading shimmer */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a1a] transition-opacity duration-700">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>
        </div>
      )}

      {/* Homepage sections */}
      <HeroSection id="home" />
      <AboutSection />
      <Footer />
    </main>
  );
}
