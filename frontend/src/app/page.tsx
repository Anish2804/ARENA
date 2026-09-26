"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Bot, Cpu, Zap, Activity, Code2, Network, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import Pyraminx from "@/components/Pyraminx";

interface DashboardStats {
  total_agents: number;
  total_tasks: number;
  active_tasks: number;
  avg_score: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_agents: 0,
    total_tasks: 0,
    active_tasks: 0,
    avg_score: 0,
  });

  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [agentsRes, tasksRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/agents`),
          fetch(`${API_BASE_URL}/api/tasks`)
        ]);

        if (agentsRes.ok && tasksRes.ok) {
          const agents = await agentsRes.json();
          const tasks = await tasksRes.json();
          
          const active = tasks.filter((t: any) => t.status === "running" || t.status === "queued").length;
          
          let totalScore = 0;
          let evaluations = 0;
          tasks.forEach((t: any) => {
            if (t.runs) {
              t.runs.forEach((r: any) => {
                if (r.evaluation && r.evaluation.final_score !== null) {
                  totalScore += r.evaluation.final_score;
                  evaluations++;
                }
              });
            }
          });

          setStats({
            total_agents: agents.length,
            total_tasks: tasks.length,
            active_tasks: active,
            avg_score: evaluations > 0 ? totalScore / evaluations : 0
          });
        }
      } catch (e) {
        console.error("Failed to fetch dashboard stats", e);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } }
  };

  return (
    <div className="pb-32 relative">
      {/* Hero Section (Resend Landing Page Style) */}
      <motion.div 
        className="min-h-[calc(100vh-120px)] flex flex-col lg:flex-row items-center justify-between relative py-20 z-10 w-full"
        style={{ y, opacity }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.01] rounded-full blur-3xl pointer-events-none"
        />

        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex-1 lg:pr-10 text-left w-full max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#222] hover:border-[#444] transition-colors bg-[#111] mb-8 cursor-pointer">
            <span className="text-[13px] font-medium text-[#ededed]">Join us at ARENA Forward</span>
            <span className="text-[13px] text-[#888] ml-1">›</span>
          </div>
          
          <h1 className="text-[64px] sm:text-[88px] font-serif tracking-tight text-[#ededed] leading-[1] mb-6 relative z-20">
            Agents for <br/> 
            developers
          </h1>
          
          <p className="text-[18px] sm:text-[20px] text-[#888] mb-10 leading-relaxed relative z-20 max-w-xl">
            The best way to orchestrate multi-agent workflows instead of complex monolithic scripts. Deliver intelligent automation at scale.
          </p>

          <div className="flex items-center gap-6 relative z-20">
            <Link href="/tasks">
              <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-black px-8 py-2 text-[15px] font-medium text-white backdrop-blur-3xl transition-colors hover:bg-neutral-900">
                  Get started
                </span>
              </button>
            </Link>
            <Link href="/agents" className="text-[#888] hover:text-[#ededed] transition-colors px-4 py-3 text-[15px] font-medium">
              Documentation
            </Link>
          </div>
        </motion.div>

        {/* Right Graphic (3D 9-Piece Glowing Cube) */}
        <motion.div 
          className="flex-1 mt-16 lg:mt-0 flex justify-center lg:justify-end z-10 w-full"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        >
          <div className="w-full h-72 sm:h-96 flex items-center justify-center lg:justify-end lg:translate-x-16">
            <Pyraminx />
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll-Revealed Dashboard Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="mt-20 max-w-[1000px] mx-auto space-y-12"
      >
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h2 className="text-[32px] font-semibold tracking-tight text-[#ededed]">Integrate this weekend</h2>
          <p className="text-[16px] text-[#888] mt-3">A simple, elegant interface so you can manage agents in minutes.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Total Agents"
              value={stats.total_agents}
              icon={<Bot className="w-4 h-4" />}
              subtitle="Registered across the cluster"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Active Tasks"
              value={stats.active_tasks}
              icon={<Activity className="w-4 h-4" />}
              trend={{ value: `${stats.active_tasks > 0 ? 'Evaluating' : 'Idle'}`, isPositive: stats.active_tasks > 0 }}
              subtitle="Currently running evaluations"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Total Evaluations"
              value={stats.total_tasks}
              icon={<Zap className="w-4 h-4" />}
              subtitle="Tasks completed or running"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <MetricCard
              title="Avg Quality Score"
              value={stats.avg_score > 0 ? `${stats.avg_score.toFixed(1)}%` : "--"}
              icon={<Cpu className="w-4 h-4" />}
              subtitle="Across all historical runs"
            />
          </motion.div>
        </div>

        {/* Feature Cards */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          <motion.div variants={itemVariants} className="resend-card p-8 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.03] rounded-bl-full group-hover:scale-150 transition-transform duration-700 ease-out" />
            <Code2 className="w-6 h-6 text-[#888] mb-6" />
            <h3 className="text-[20px] font-medium text-[#ededed] mb-2">First-class developer experience</h3>
            <p className="text-[14px] text-[#888] leading-relaxed">
              Designed for speed and reliability. Connect your agentic workflows with our SDKs and REST APIs in minutes.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="resend-card p-8 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.03] rounded-bl-full group-hover:scale-150 transition-transform duration-700 ease-out" />
            <Network className="w-6 h-6 text-[#888] mb-6" />
            <h3 className="text-[20px] font-medium text-[#ededed] mb-2">Multi-agent Orchestration</h3>
            <p className="text-[14px] text-[#888] leading-relaxed">
              Route requests intelligently across different foundation models. Fallback seamlessly if a model degrades.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
