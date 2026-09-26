"use client";

import React, { useState } from "react";
import { CyberRetroGrid } from "@/components/ui/cyber-matrix-retro-grid";

export default function CyberRetroGridDemo() {
  const [speed, setSpeed] = useState(12);

  return (
    <div className="relative flex min-h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#08090d] p-8 text-white select-none border border-slate-800 shadow-2xl">
      {/* 3D Cyber Retro Grid */}
      <CyberRetroGrid
        angle={68}
        cellSize={45}
        speed={speed}
        darkLineColor="rgba(56, 189, 248, 0.35)"
        opacity={0.7}
      />

      {/* Cyber Horizon Glow */}
      <div className="pointer-events-none absolute top-1/4 h-32 w-96 rounded-full bg-cyan-500/20 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/3 h-1 w-3/4 max-w-lg bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 blur-[1px]" />

      {/* Floating Center Glassmorphic Terminal Card */}
      <div className="relative z-10 flex max-w-lg flex-col items-center rounded-3xl border border-cyan-500/30 bg-slate-950/75 p-8 text-center shadow-[0_0_50px_rgba(6,182,212,0.25)] backdrop-blur-xl">
        {/* Terminal Header Tag */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/50 px-3.5 py-1 text-xs font-mono text-cyan-300">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          GRID PROTOCOL V4.2
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Infinite Synth Grid
        </h1>
        <p className="mt-3 text-sm text-slate-300 leading-relaxed">
          Perspective-projected retro wireframe terrain with continuous horizon acceleration and customizable shader parameters.
        </p>

        {/* Speed Adjustment Buttons */}
        <div className="mt-5 flex items-center gap-2 font-mono text-xs text-slate-400">
          <span>WARP SPEED:</span>
          {[20, 12, 6].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                speed === s
                  ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {s === 20 ? "CRUISE" : s === 12 ? "WARP" : "HYPER"}
            </button>
          ))}
        </div>

        {/* Action Button Linking to Scriptly */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://scriptly.store/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Explore Scriptly Store</span>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* Footer Backlink Attribution */}
      <a
        href="https://scriptly.store/"
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 mt-8 inline-flex items-center gap-1.5 font-mono text-xs text-slate-500 hover:text-cyan-400 transition-colors"
      >
        <span>Engineered for commercial grade projects at</span>
        <span className="font-semibold text-cyan-400 underline underline-offset-4">Scriptly.store ↗</span>
      </a>
    </div>
  );
}
