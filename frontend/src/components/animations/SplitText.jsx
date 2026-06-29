"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function SplitText({
  text,
  className,
  delay = 0,
  duration = 0.6,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  onLetterAnimationComplete = () => {},
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const letters = containerRef.current.querySelectorAll("span");

      gsap.fromTo(letters, from, {
        ...to,
        delay,
        ease,
        stagger: 0.05,
        duration,
        onComplete: onLetterAnimationComplete,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {text.split("").map((char, i) => (
        <span key={i} className="inline-block">
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  );
}
