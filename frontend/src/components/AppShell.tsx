"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { usePathname } from "next/navigation";

import { GalaxyBackground } from "./GalaxyBackground";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen bg-black overflow-hidden selection:bg-[#333] selection:text-white">
      <GalaxyBackground />
      {/* Main Content Area */}
      <Header />
      <main className="flex-1 overflow-y-auto p-6 pt-28 md:p-10 md:pt-28 animate-fade-in relative z-10 w-full">
        <div className="max-w-[1200px] mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
