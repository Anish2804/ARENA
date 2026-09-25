"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Menu, Activity, Sparkles, Terminal } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  onOpenMobile: () => void;
}

export function Header({ onOpenMobile }: HeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return "Command Center";
      case "/tasks":
        return "Tasks & Evaluations";
      case "/agents":
        return "Agent Roster";
      case "/leaderboard":
        return "Benchmark Leaderboard";
      default:
        return "Command Center";
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#08090d]/80 backdrop-blur-md border-b border-white/[0.08] px-4 md:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] md:hidden transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-500">ARENA</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-200 font-medium">{getPageTitle()}</span>
        </div>
      </div>

      {/* Right: Quick Action & Live Status */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Groq Cluster Online</span>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">New Task</span>
        </Link>
      </div>
    </header>
  );
}
