"use client";

import React, { useId } from "react";

export interface CyberRetroGridProps {
  className?: string;
  angle?: number;
  cellSize?: number;
  opacity?: number;
  lightLineColor?: string;
  darkLineColor?: string;
  speed?: number;
}

export function CyberRetroGrid({
  className = "",
  angle = 65,
  cellSize = 50,
  opacity = 0.5,
  darkLineColor = "rgba(168, 85, 247, 0.28)",
  speed = 15,
}: CyberRetroGridProps) {
  const gridId = useId().replace(/:/g, "");

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden [perspective:200px] ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes cyber-grid-travel-${gridId} {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(${cellSize}px);
          }
        }
        .cyber-grid-plane-${gridId} {
          animation: cyber-grid-travel-${gridId} ${speed}s linear infinite;
        }
      `}</style>

      {/* 3D Perspective Plane */}
      <div
        className="absolute inset-0 origin-top"
        style={{ transform: `rotateX(${angle}deg)` }}
      >
        <div
          className={`cyber-grid-plane-${gridId} absolute -left-1/2 -top-full h-[300vh] w-[200vw]`}
          style={{
            backgroundImage: `
              linear-gradient(to right, ${darkLineColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${darkLineColor} 1px, transparent 1px)
            `,
            backgroundSize: `${cellSize}px ${cellSize}px`,
            backgroundRepeat: "repeat",
          }}
        />
      </div>

      {/* Atmospheric Horizon Gradient Veil */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/60 to-transparent pointer-events-none" />
    </div>
  );
}

export default CyberRetroGrid;
