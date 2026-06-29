"use client";

import { useState, useEffect, useRef } from "react";
import SplitText from "@/components/animations/SplitText";
import Galaxy from "@/components/animations/Galaxy";
import MulaiAnalisisButton from "./MulaiAnalisisButton";
import { useRouter } from "next/navigation";

export default function HeroSection({ id }) {
  const [isClient, setIsClient] = useState(false);
  const [isGalaxyActive, setIsGalaxyActive] = useState(true);
  const scrollTimeout = useRef(null);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);

    const handleScroll = () => {
      if (window.scrollY > 500) setIsGalaxyActive(false);
      else setIsGalaxyActive(true);

      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        if (window.scrollY < 500) setIsGalaxyActive(true);
      }, 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout.current);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsGalaxyActive(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <section id={id || "home"} className="relative flex items-center justify-center min-h-[95vh] overflow-hidden px-6">
      {/* 🌌 Galaxy Background */}
      {isClient && (
        <div className="absolute inset-0 -z-10 opacity-0 animate-[fadeIn_1.5s_ease-in-out_forwards]">
          <Galaxy fps={20} density={0.4} glowIntensity={0.2} hueShift={230} mouseRepulsion={false} mouseInteraction={isGalaxyActive} />
        </div>
      )}

      {/* ✨ Content */}
      <div className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        {/* LEFT TEXT */}
        <div className="flex flex-col gap-6 text-center md:text-left">
          <div className="text-4xl md:text-6xl font-extrabold leading-tight text-white drop-shadow-lg space-y-3">
            <span className="block">
              <SplitText text="Analyze" delay={0.2} duration={0.6} ease="power3.out" from={{ opacity: 0, y: 40 }} to={{ opacity: 1, y: 0 }} />
            </span>
            <span className="block">
              <SplitText text="Handwriting" delay={0.4} duration={0.7} ease="power3.out" from={{ opacity: 0, y: 40 }} to={{ opacity: 1, y: 0 }} />
            </span>
            <span className="block text-yellow-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.6)]">
              <SplitText text="AI" delay={0.6} duration={0.8} ease="power3.out" from={{ opacity: 0, y: 50 }} to={{ opacity: 1, y: 0 }} />
            </span>
          </div>

          <p className="text-lg text-white/90 leading-relaxed max-w-lg">Temukan kepribadian dan karakter kalian melalui analisis grafologi yang didukung AI canggih</p>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <MulaiAnalisisButton />
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="flex justify-center">
          <img src="/graf.jpeg" alt="AI Graphology Illustration" className="w-[420px] h-[420px] rounded-2xl object-cover shadow-[0_25px_50px_rgba(0,0,0,0.3)]" />
        </div>
      </div>
    </section>
  );
}
