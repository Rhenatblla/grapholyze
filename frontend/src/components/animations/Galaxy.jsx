"use client";
import { useEffect, useRef } from "react";

export default function Galaxy({
  mouseRepulsion = true,
  mouseInteraction = true,
  density = 1.5,
  glowIntensity = 0.4,
  saturation = 0.8,
  hueShift = 240,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let stars = [];
    let mouse = { x: null, y: null, radius: 120 };
    let animationFrame;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Generate galaxy stars
    const numStars = Math.floor((canvas.width * density) / 2);
    for (let i = 0; i < numStars; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2 + 0.5;
      const speed = Math.random() * 0.3 + 0.05;
      stars.push({ x, y, size, speed });
    }

    if (mouseInteraction) {
      window.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      });
    }

    const draw = () => {
      ctx.fillStyle = `hsl(${hueShift}, 60%, 6%)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const dx = s.x - mouse.x;
        const dy = s.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (mouseRepulsion && dist < mouse.radius) {
          s.x += dx / dist;
          s.y += dy / dist;
        }

        s.y += s.speed;
        if (s.y > canvas.height) {
          s.y = 0;
          s.x = Math.random() * canvas.width;
        }

        const color = `hsl(${hueShift + Math.random() * 30}, ${saturation * 100}%, ${
          70 + Math.random() * 30
        }%)`;

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = s.size * glowIntensity * 10;
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const animate = () => {
      draw();
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [density, glowIntensity, saturation, hueShift, mouseRepulsion, mouseInteraction]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        background: "black",
      }}
    />
  );
}
