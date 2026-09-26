"use client";

import { useEffect, useRef } from "react";

export function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetX = width / 2;
    let targetY = height / 2;

    let animationFrameId: number;

    const render = () => {
      // Smoothly interpolate mouse position for a fluid trailing effect (increased speed to match mouse pace)
      mouseX += (targetX - mouseX) * 0.3;
      mouseY += (targetY - mouseY) * 0.3;

      // Clear the canvas to transparent so the CSS dot grid shows through
      ctx.clearRect(0, 0, width, height);

      // Create a soft green radial gradient that follows the mouse
      const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 600);
      gradient.addColorStop(0, "rgba(16, 185, 129, 0.15)"); // Emerald 500 but faint
      gradient.addColorStop(0.5, "rgba(4, 120, 87, 0.05)");  // Emerald 700 fainter
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Add a secondary subtle static glow in the top-right
      const staticGlow = ctx.createRadialGradient(width - 200, 100, 0, width - 200, 100, 800);
      staticGlow.addColorStop(0, "rgba(5, 150, 105, 0.08)");
      staticGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = staticGlow;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-black">
      {/* CSS Dot Grid Background */}
      <div 
        className="absolute inset-0 opacity-40" 
        style={{
          backgroundImage: "radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full mix-blend-screen"
      />
      {/* Optional dark gradient overlay to fade edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
    </div>
  );
}
