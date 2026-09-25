"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  Bot,
  Trophy,
  Cpu,
  Database,
  ExternalLink,
  Activity,
  Terminal,
  X
} from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Command Center",
      href: "/",
      icon: LayoutDashboard,
      shortcut: "1"
    },
    {
      label: "Tasks & Evaluations",
      href: "/tasks",
      icon: ListTodo,
      shortcut: "2"
    },
    {
      label: "Agent Roster",
      href: "/agents",
      icon: Bot,
      shortcut: "3"
    },
    {
      label: "Leaderboard",
      href: "/leaderboard",
      icon: Trophy,
      shortcut: "4"
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-[#090a0f] border-r border-white/[0.08] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header & Navigation */}
        <div className="flex flex-col">
          {/* Brand Mark */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.08]">
            <Link
              href="/"
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold tracking-wider text-sm text-zinc-100 group-hover:text-white transition-colors">
                  ARENA
                </span>
                <span className="text-[10px] font-mono text-zinc-500 font-medium">
                  v1.0
                </span>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Workspace pill */}
          <div className="px-3 pt-3 pb-1">
            <div className="px-2.5 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-medium text-zinc-300">
                  Production Roster
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">4 Agents</span>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="p-2 space-y-0.5">
            <div className="px-2 py-1.5 text-[10px] uppercase font-mono tracking-wider text-zinc-500">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all group ${
                    isActive
                      ? "bg-white/[0.08] text-white shadow-xs border border-white/[0.08]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? "text-blue-400"
                          : "text-zinc-500 group-hover:text-zinc-300"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1 rounded transition-colors ${
                      isActive
                        ? "text-zinc-300 bg-white/[0.08]"
                        : "text-zinc-600 group-hover:text-zinc-400"
                    }`}
                  >
                    {item.shortcut}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom System & Infrastructure Info */}
        <div className="p-3 border-t border-white/[0.08] space-y-3">
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 px-1">
              Infrastructure
            </div>

            <div className="px-2.5 py-1.5 rounded bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Inference</span>
              </div>
              <span className="text-zinc-300 truncate max-w-[90px]" title="openai/gpt-oss-20b">
                gpt-oss-20b
              </span>
            </div>

            <div className="px-2.5 py-1.5 rounded bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Database</span>
              </div>
              <span className="text-zinc-300">Neon Pg</span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between px-1 text-[11px] font-mono text-zinc-500">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>All Systems Nominal</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
