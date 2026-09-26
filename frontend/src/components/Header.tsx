"use client";

import { useState } from "react";
import { Bell, Search, Command } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Image from "next/image";

export function Header() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > 100 && latest > (previous ?? 0)) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-[1200px] h-[60px] flex items-center justify-between px-6 md:px-8 border border-[#222] bg-black/70 backdrop-blur-md rounded-full z-50 shadow-2xl shadow-black/50"
    >
      <div className="w-full flex items-center justify-between">
        {/* Left Logo & Nav */}
        <div className="flex items-center gap-10">
          <Link href="/" className="text-[#ededed] font-semibold text-[15px] tracking-tight hover:opacity-80 transition-opacity flex items-center gap-2">
            <div className="w-8 h-8 relative rounded-full overflow-hidden border border-[#333]">
              <Image src="/ganesha_logo.png" alt="ARENA Logo" fill className="object-cover" />
            </div>
            ARENA
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[14px] font-medium text-[#888]">
            <Link href="/tasks" className={`hover:text-[#ededed] transition-colors ${pathname.startsWith('/tasks') ? 'text-[#ededed]' : ''}`}>
              Tasks
            </Link>
            <Link href="/agents" className={`hover:text-[#ededed] transition-colors ${pathname.startsWith('/agents') ? 'text-[#ededed]' : ''}`}>
              Agents
            </Link>
            <Link href="/leaderboard" className={`hover:text-[#ededed] transition-colors ${pathname.startsWith('/leaderboard') ? 'text-[#ededed]' : ''}`}>
              Leaderboard
            </Link>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-[14px] font-medium text-[#888] hover:text-[#ededed] transition-colors hidden sm:block">
            Log in
          </Link>
          <Link href="/tasks">
            <button className="relative inline-flex h-9 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-black px-4 py-1 text-[13px] font-medium text-white backdrop-blur-3xl transition-colors hover:bg-neutral-900">
                Get started
              </span>
            </button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
