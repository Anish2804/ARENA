"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

function MysticMandala() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none opacity-[0.15] z-0 flex items-center justify-center mix-blend-screen scale-[1.2]">
      {/* Glowing center core */}
      <div className="absolute w-[20%] h-[20%] bg-amber-500/20 blur-[100px] rounded-full" />
      
      {/* Outer slow ring */}
      <div className="absolute inset-0 rounded-full border-[1px] border-amber-500/20 border-dashed animate-[spin_60s_linear_infinite]" />
      <div className="absolute inset-[2%] rounded-full border-[2px] border-amber-500/10 border-dotted animate-[spin_45s_linear_infinite_reverse]" />
      
      {/* Complex inner geometry (Octagram) */}
      <div className="absolute inset-[15%] rounded-full border-[1px] border-amber-500/30 animate-[spin_90s_linear_infinite]">
        <div className="absolute inset-0 border-[1px] border-amber-500/20 rotate-45" />
        <div className="absolute inset-0 border-[1px] border-amber-500/20 rotate-15" />
        <div className="absolute inset-0 border-[1px] border-amber-500/20 -rotate-15" />
      </div>

      {/* Middle rings with arcs */}
      <div className="absolute inset-[30%] rounded-full border-[1px] border-t-amber-400/40 border-r-transparent border-b-amber-400/40 border-l-transparent animate-[spin_20s_linear_infinite_reverse] shadow-[0_0_50px_rgba(245,158,11,0.1)]" />
      <div className="absolute inset-[32%] rounded-full border-[1px] border-t-transparent border-r-amber-500/30 border-b-transparent border-l-amber-500/30 animate-[spin_25s_linear_infinite]" />
      
      {/* Inner tight rings */}
      <div className="absolute inset-[45%] rounded-full border-[1px] border-amber-500/20 border-dashed animate-[spin_30s_linear_infinite]" />
      <div className="absolute inset-[48%] rounded-full border-[2px] border-amber-500/10 border-dotted animate-[spin_15s_linear_infinite_reverse]" />
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    // Simulate login
    setTimeout(() => {
      setIsSubmitting(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("arena_session", "active");
        window.dispatchEvent(new Event("storage"));
      }
      router.push("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      
      <MysticMandala />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[420px] z-10 px-6"
      >
        <div className="mb-12 flex justify-center">
          <Link href="/" className="flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 hover:border-white/15 transition-colors group relative overflow-hidden p-3 shadow-[0_0_30px_rgba(255,255,255,0.02)] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <Image src="/ganesha_logo.png" alt="ARENA Logo" fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>

        <div className="bg-[#0c0c0f] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="text-center mb-8">
            <h1 className="text-[24px] font-medium text-white/90 mb-2">Welcome back</h1>
            <p className="text-[14px] text-white/40">Enter your email to sign in to your workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[14px] text-white placeholder:text-white/20 outline-none transition-all focus:border-white/20 focus:bg-white/[0.04]"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="w-full relative group overflow-hidden rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-[14px] font-medium text-white/80 transition-all hover:bg-white/[0.1] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#E2CBFF]/10 to-[#393BB2]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with Email</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/[0.04] text-center">
            <p className="text-[13px] text-white/40">
              Don&apos;t have an account?{" "}
              <span className="text-white/60 hover:text-white cursor-pointer transition-colors">Request access</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
