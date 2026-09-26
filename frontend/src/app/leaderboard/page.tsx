"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { Trophy, Activity, Target, Zap, Medal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

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

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color =
    pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[13px] font-mono" style={{ color }}>{value.toFixed(1)}</span>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 font-bold text-[13px]">
      1
    </div>
  );
  if (rank === 2) return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-400/10 border border-slate-400/40 text-slate-300 font-bold text-[13px]">
      2
    </div>
  );
  if (rank === 3) return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/10 border border-amber-700/40 text-amber-600 font-bold text-[13px]">
      3
    </div>
  );
  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#111] border border-[#222] text-[#555] font-bold text-[13px]">
      {rank}
    </div>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (e) {
      console.error("Failed to fetch leaderboard", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <style>{`
        @keyframes fadeInRow {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="flex flex-col gap-2 pb-4 border-b border-[#222]">
        <h1 className="text-[28px] font-semibold tracking-tight text-[#ededed]">
          Global Leaderboard
        </h1>
        <p className="text-[14px] text-[#888]">
          Aggregate LLM-as-a-judge scores and performance metrics across the cluster.
        </p>
      </div>

      <div className="resend-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1a1a1a] bg-[#060606]">
                <th className="px-6 py-4 text-[11px] font-medium text-[#555] uppercase tracking-widest">Rank</th>
                <th className="px-6 py-4 text-[11px] font-medium text-[#555] uppercase tracking-widest">Agent</th>
                <th className="px-6 py-4 text-[11px] font-medium text-[#555] uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[11px] font-medium text-[#555] uppercase tracking-widest text-right">Avg Score</th>
                <th className="px-6 py-4 text-[11px] font-medium text-[#555] uppercase tracking-widest">Quality</th>
                <th className="px-6 py-4 text-[11px] font-medium text-[#555] uppercase tracking-widest">Accuracy</th>
                <th className="px-6 py-4 text-[11px] font-medium text-[#555] uppercase tracking-widest text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111]">
              {loading ? (
                /* Skeleton rows */
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-8 bg-[#0d0d0d] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#555] text-[13px]">
                    No evaluations completed yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry, idx) => (
                  <tr
                    key={entry.agent_id}
                    className="group hover:bg-[#0a0f0b] transition-colors duration-200 cursor-default"
                    style={{ animation: `fadeInRow 0.35s ease-out ${idx * 0.06}s both` }}
                  >
                    <td className="px-6 py-4">
                      <RankBadge rank={idx + 1} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#ededed] group-hover:text-white transition-colors">{entry.agent_name}</div>
                      <div className="text-[11px] text-[#444] font-mono">{entry.total_tasks} runs</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[12px] text-[#666] bg-[#111] border border-[#1a1a1a] px-2 py-0.5 rounded">
                        {entry.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[20px] font-semibold tabular-nums ${
                        (entry.score || 0) >= 80 ? "text-emerald-400" :
                        (entry.score || 0) >= 50 ? "text-yellow-400" : "text-red-400"
                      }`}>
                        {(entry.score || 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBar value={entry.quality || 0} />
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBar value={entry.accuracy || 0} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[13px] font-mono text-[#666]">
                        {(entry.latency_ms || 0).toFixed(0)}ms
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
