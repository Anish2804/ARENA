"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Trophy,
  ListTodo,
  Terminal,
  Activity,
  Box
} from "lucide-react";

interface SidebarProps {
  activePath: string;
}

const NAV_ITEMS = [
  { name: "Command Center", href: "/", icon: LayoutDashboard },
  { name: "Tasks", href: "/tasks", icon: ListTodo },
  { name: "Agents", href: "/agents", icon: Users },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
];

export function Sidebar({ activePath }: SidebarProps) {
  return (
    <div className="h-full flex flex-col bg-black text-[#ededed]">
      {/* Brand Header */}
      <div className="p-6 pb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-7 h-7 rounded-[6px] bg-[#111] border border-[#333] flex items-center justify-center group-hover:border-[#555] transition-colors">
            <Box className="w-4 h-4 text-[#ededed]" />
          </div>
          <span className="font-semibold tracking-tight text-[15px]">ARENA</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 px-4 space-y-6">
        <div>
          <div className="text-[11px] font-medium text-[#666] mb-3 px-2 uppercase tracking-widest">
            Overview
          </div>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? activePath === "/"
                  : activePath.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-[13px] rounded-md transition-all duration-200 ${
                    isActive
                      ? "bg-[#111] text-[#ededed] font-medium"
                      : "text-[#888] hover:text-[#ededed] hover:bg-[#0a0a0a]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#ededed]" : "text-[#666]"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="text-[11px] font-medium text-[#666] mb-3 px-2 uppercase tracking-widest">
            Infrastructure
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between px-3 py-2 text-[13px] text-[#888] rounded-md hover:bg-[#0a0a0a] transition-colors cursor-default">
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-[#666]" />
                <span>Cluster</span>
              </div>
              <span className="text-[11px] font-mono text-[#555]">Online</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 text-[13px] text-[#888] rounded-md hover:bg-[#0a0a0a] transition-colors cursor-default">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-[#666]" />
                <span>Status</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
          </div>
        </div>
      </div>

      {/* User / Org Footer */}
      <div className="p-4 border-t border-[#222]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[#111] transition-colors cursor-pointer">
          <div className="w-6 h-6 rounded-full bg-[#333] flex items-center justify-center text-[11px] font-semibold">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-medium text-[#ededed]">Admin</span>
            <span className="text-[10px] text-[#666]">Acme Corp</span>
          </div>
        </div>
      </div>
    </div>
  );
}
