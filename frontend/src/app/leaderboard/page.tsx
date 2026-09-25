"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import {
  Trophy,
  Award,
  Clock,
  DollarSign,
  RefreshCw,
  Sparkles,
  Bot,
  Info,
  ArrowUpDown,
  CheckCircle2
} from "lucide-react";

interface LeaderboardEntry {
  agent_id: string;
  agent_name: string;
  role: string;
  total_tasks: number;
  score: number;
  quality: number;
  accuracy: number;
  latency_ms: number;
  cost: number;
}

export default function Leaderboard() {
  const [filter, setFilter] = useState("Overall");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = ["Overall", "Quality", "Accuracy", "Speed", "Cost Efficiency"];

  const fetchLeaderboard = () => {
    fetch(`${API_BASE_URL}/api/leaderboard`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: LeaderboardEntry[]) => {
        if (Array.isArray(data)) {
          setLeaderboard(data);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error("Failed to fetch leaderboard", e);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 4000);
    return () => clearInterval(interval);
  }, []);

  const getSortedData = () => {
    const data = [...leaderboard];
    if (filter === "Overall") data.sort((a, b) => b.score - a.score);
    if (filter === "Quality") data.sort((a, b) => b.quality - a.quality);
    if (filter === "Accuracy") data.sort((a, b) => b.accuracy - a.accuracy);
    if (filter === "Speed") {
      data.sort((a, b) => {
        if (a.total_tasks === 0) return 1;
        if (b.total_tasks === 0) return -1;
        return a.latency_ms - b.latency_ms;
      });
    }
    if (filter === "Cost Efficiency") {
      data.sort((a, b) => {
        if (a.total_tasks === 0) return 1;
        if (b.total_tasks === 0) return -1;
        return a.cost - b.cost;
      });
    }
    return data;
  };

  const sortedData = getSortedData();

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center font-bold text-[11px] font-mono">
            1
          </span>
        );
      case 2:
        return (
          <span className="w-5 h-5 rounded-full bg-zinc-300/20 text-zinc-300 border border-zinc-300/40 flex items-center justify-center font-bold text-[11px] font-mono">
            2
          </span>
        );
      case 3:
        return (
          <span className="w-5 h-5 rounded-full bg-amber-700/20 text-amber-500 border border-amber-600/40 flex items-center justify-center font-bold text-[11px] font-mono">
            3
          </span>
        );
      default:
        return (
          <span className="w-5 h-5 rounded-full bg-white/[0.04] text-zinc-500 border border-white/[0.08] flex items-center justify-center font-medium text-[11px] font-mono">
            {rank}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] uppercase font-mono tracking-widest text-zinc-400">
              Benchmark Analytics
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[11px] font-mono text-emerald-400">Live Database Aggregation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Leaderboard & Rankings
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLeaderboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Task</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs Bar (Linear-style pills) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-md bg-[#0e1017] border border-white/[0.08] w-fit">
        <span className="text-[11px] font-mono text-zinc-500 px-2 flex items-center gap-1">
          <ArrowUpDown className="w-3 h-3" />
          <span>Sort By:</span>
        </span>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-xs font-mono transition-all ${
              filter === f
                ? "bg-white/[0.1] text-white font-medium border border-white/[0.12] shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Leaderboard Table (High-Density SaaS Table) */}
      <div className="bg-[#0e1017] border border-white/[0.08] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#090a0f] text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4 font-medium w-16">Rank</th>
                <th className="py-3 px-4 font-medium">Agent</th>
                <th className="py-3 px-4 font-medium">Composite Score</th>
                <th className="py-3 px-4 font-medium">Quality (45%)</th>
                <th className="py-3 px-4 font-medium">Accuracy (30%)</th>
                <th className="py-3 px-4 font-medium">Latency (15%)</th>
                <th className="py-3 px-4 font-medium">Cost (10%)</th>
                <th className="py-3 px-4 font-medium text-right">Runs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading && leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 font-mono">
                    Aggregating leaderboard records...
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 font-mono">
                    No evaluated tasks recorded yet.
                  </td>
                </tr>
              ) : (
                sortedData.map((agent, index) => {
                  const rank = index + 1;
                  const hasTasks = agent.total_tasks > 0;

                  return (
                    <tr
                      key={agent.agent_id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 font-mono">
                        {getRankBadge(rank)}
                      </td>

                      {/* Agent & Role */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-100 flex items-center gap-2">
                          <Bot className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{agent.agent_name}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-sans mt-0.5">
                          {agent.role}
                        </div>
                      </td>

                      {/* Composite Score with Micro Meter */}
                      <td className="py-3.5 px-4 font-mono">
                        {hasTasks ? (
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-1 font-bold text-sm text-emerald-400">
                              <span>{agent.score}</span>
                              <span className="text-[10px] text-zinc-500 font-normal">/100</span>
                            </div>
                            <div className="w-24 h-1 rounded-full bg-white/[0.08] overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, agent.score))}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Quality */}
                      <td className="py-3.5 px-4 font-mono text-zinc-200">
                        {hasTasks ? `${agent.quality}%` : "—"}
                      </td>

                      {/* Accuracy */}
                      <td className="py-3.5 px-4 font-mono text-zinc-200">
                        {hasTasks ? `${agent.accuracy}%` : "—"}
                      </td>

                      {/* Latency */}
                      <td className="py-3.5 px-4 font-mono text-zinc-200">
                        {hasTasks ? `${agent.latency_ms.toFixed(0)}ms` : "—"}
                      </td>

                      {/* Cost */}
                      <td className="py-3.5 px-4 font-mono text-zinc-200">
                        {hasTasks ? `$${agent.cost.toFixed(4)}` : "—"}
                      </td>

                      {/* Runs Count */}
                      <td className="py-3.5 px-4 font-mono text-right text-zinc-400">
                        {agent.total_tasks}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluation Methodology Note Card */}
      <div className="bg-[#0e1017] border border-white/[0.08] rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06] text-xs font-mono text-zinc-300 font-semibold">
          <Info className="w-4 h-4 text-blue-400" />
          <span>Composite Scoring Formula & Weights</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono text-zinc-400 pt-1">
          <div className="p-3 rounded bg-[#08090d] border border-white/[0.04]">
            <div className="text-[11px] text-zinc-300 font-semibold uppercase">Quality (45%)</div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Evaluated by LLM judge on structure, nuance, and analytical depth.
            </p>
          </div>

          <div className="p-3 rounded bg-[#08090d] border border-white/[0.04]">
            <div className="text-[11px] text-zinc-300 font-semibold uppercase">Accuracy (30%)</div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Evaluated on factual consistency, precision, and absence of hallucination.
            </p>
          </div>

          <div className="p-3 rounded bg-[#08090d] border border-white/[0.04]">
            <div className="text-[11px] text-zinc-300 font-semibold uppercase">Latency (15%)</div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Normalized turnaround execution time. Lower latency yields a higher score.
            </p>
          </div>

          <div className="p-3 rounded bg-[#08090d] border border-white/[0.04]">
            <div className="text-[11px] text-zinc-300 font-semibold uppercase">Cost (10%)</div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Token consumption cost normalized relative to task benchmark. Lower cost = better.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
