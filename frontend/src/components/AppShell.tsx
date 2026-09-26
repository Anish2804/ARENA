"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "./Header";
import { GalaxyBackground } from "./GalaxyBackground";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isDocOpen, setIsDocOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const handleOpen = () => setIsDocOpen(true);
    window.addEventListener('open-documentation', handleOpen);

    const checkAuth = () => {
      const isLogged = localStorage.getItem("arena_session") === "active";
      if (!isLogged && pathname !== "/" && pathname !== "/login") {
        router.replace("/login");
      }
    };
    
    // Check initially
    checkAuth();

    // Re-check when storage changes
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener('open-documentation', handleOpen);
      window.removeEventListener("storage", checkAuth);
    };
  }, [pathname, router]);

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden selection:bg-[#333] selection:text-white">
      <GalaxyBackground />
      {/* Main Content Area */}
      <Header />
      {/* Spacer to account for fixed header so content doesn't hide underneath it */}
      <div className="h-[80px] md:h-[90px] shrink-0 w-full relative z-0" />
      <main className="flex-1 overflow-y-auto p-6 md:p-8 animate-fade-in relative z-10 w-full">
        <div className="max-w-[1200px] mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {children}
        </div>
      </main>

      <AnimatePresence>
        {isDocOpen && mounted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0c0c0f] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E2CBFF] to-[#393BB2]"></div>
              
              <button
                onClick={() => setIsDocOpen(false)}
                className="absolute right-4 top-4 text-white/25 hover:text-white/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="mb-6">
                <h2 className="text-[24px] font-semibold text-white/90 mb-2">About ARENA</h2>
                <p className="text-[14px] text-white/40">The next-generation framework for autonomous multi-agent evaluations.</p>
              </div>

              <div className="space-y-4 text-[14px] leading-relaxed text-white/60">
                <p>
                  ARENA (Agentic Research & Evaluation Network Architecture) is an advanced platform designed to orchestrate, monitor, and evaluate autonomous AI agents in real-time.
                </p>
                <p>
                  By deploying a cluster of specialized agents — ranging from high-speed researchers to precision analysts — developers can break down complex objectives into manageable, verifiable tasks.
                </p>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-white/80">
                    <Zap className="h-4 w-4 text-emerald-400" />
                    <span className="font-medium">Key Features</span>
                  </div>
                  <ul className="list-disc list-inside text-white/50 space-y-1 ml-1">
                    <li>Real-time telemetry and latency tracking</li>
                    <li>Automated quality and accuracy scoring</li>
                    <li>Cost estimation per inference cycle</li>
                    <li>Extensible agent roster with distinct personalities</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setIsDocOpen(false)}
                  className="rounded-xl bg-white/[0.08] border border-white/10 px-6 py-2 text-[13px] font-medium text-white/80 transition-all hover:bg-white/[0.12] hover:text-white"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
