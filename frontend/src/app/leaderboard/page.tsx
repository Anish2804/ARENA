"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";

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

const agentAccents = [
  { accent: "#8b5cf6", icon: "text-violet-400", bg: "bg-gradient-to-t from-transparent to-violet-500/5", topEdge: "rgba(139,92,246,0.2)" },
  { accent: "#22d3ee", icon: "text-cyan-400", bg: "bg-gradient-to-t from-transparent to-cyan-500/5", topEdge: "rgba(34,211,238,0.2)" },
  { accent: "#f59e0b", icon: "text-amber-400", bg: "bg-gradient-to-t from-transparent to-amber-500/5", topEdge: "rgba(245,158,11,0.2)" },
  { accent: "#f43f5e", icon: "text-rose-400", bg: "bg-gradient-to-t from-transparent to-rose-500/5", topEdge: "rgba(244,63,94,0.2)" },
];

function getThemeForName(name: string) {
  const char = name ? name.charAt(0).toUpperCase() : '';
  if (char === 'F') return agentAccents[0];
  if (char === 'P') return agentAccents[1];
  if (char === 'G') return agentAccents[2];
  if (char === 'R') return agentAccents[3];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return agentAccents[Math.abs(hash) % agentAccents.length];
}

function ScoreBar({ value, max = 100, color = "#888" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.8 }}
        />
      </div>
      <span className="text-[13px] font-mono" style={{ color, opacity: 0.8 }}>{value.toFixed(1)}</span>
    </div>
  );
}

function RankBadge({ rank, color = "#888" }: { rank: number; color?: string }) {
  return (
    <div 
      className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-[13px]"
      style={{
        backgroundColor: `${color}1A`,
        borderColor: `${color}40`,
        borderWidth: 1,
        borderStyle: 'solid',
        color: color,
        opacity: 0.9
      }}
    >
      {rank}
    </div>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch {
      // Backend not reachable — expected during frontend-only dev
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeaderboard();
    const interval = setInterval(() => {
      setIsRefreshing(true);
      fetchLeaderboard();
    }, 10000);
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

      <div className="flex flex-col gap-2 pb-4 border-b border-[#222] relative">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
              title="Go Back"
            >
              &lt;
            </button>
            <h1 className="text-[28px] font-semibold tracking-tight text-[#ededed]">
              Global Leaderboard
            </h1>
          </div>
          {isRefreshing && (
            <div className="flex items-center gap-2 text-[#888] text-[13px] font-medium bg-[#111] px-3 py-1.5 rounded-full border border-[#222]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Refreshing</span>
            </div>
          )}
        </div>
        <p className="text-[14px] text-[#888]">
          Aggregate LLM-as-a-judge scores and performance metrics across the cluster.
        </p>
      </div>

      {!loading && leaderboard.length >= 3 && (
        <div className="flex justify-center items-end h-64 gap-4 mt-16 mb-8">
          {[1, 0, 2].map((idx) => {
            const entry = leaderboard[idx];
            if (!entry) return null;
            const theme = getThemeForName(entry.agent_name);
            const rank = idx + 1;
            const height = rank === 1 ? "h-40" : rank === 2 ? "h-32" : "h-24";
            return (
              <div key={entry.agent_id} className="flex flex-col items-center w-32 animate-slide-up" style={{ animationDelay: `${0.1 * idx}s` }}>
                {/* Agent Icon/Avatar */}
                <div className="flex flex-col items-center mb-4 relative">
                  {rank === 1 && <span className="absolute -top-6 text-xl">👑</span>}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 bg-black z-10 ${theme.icon}`} style={{ borderColor: theme.accent }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                  </div>
                  <span className="text-white font-medium text-[14px] mt-2 text-center leading-tight truncate w-full px-2" title={entry.agent_name}>{entry.agent_name}</span>
                  <span className="text-white/50 text-[12px] font-mono">{(entry.score || 0).toFixed(1)}</span>
                </div>
                {/* Podium Bar */}
                <div 
                  className={`w-full rounded-t-[20px] flex justify-center pt-3 ${height} ${theme.bg} backdrop-blur-sm`} 
                  style={{ borderTop: `1px solid ${theme.topEdge}` }}
                >
                  <span className="text-white/60 font-bold text-xl drop-shadow-md">{rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="resend-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                <th className="px-6 py-4 text-[11px] font-medium text-white/40 uppercase tracking-widest">Rank</th>
                <th className="px-6 py-4 text-[11px] font-medium text-white/40 uppercase tracking-widest">Agent</th>
                <th className="px-6 py-4 text-[11px] font-medium text-white/40 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[11px] font-medium text-white/40 uppercase tracking-widest text-right">Avg Score</th>
                <th className="px-6 py-4 text-[11px] font-medium text-white/40 uppercase tracking-widest">Quality</th>
                <th className="px-6 py-4 text-[11px] font-medium text-white/40 uppercase tracking-widest">Accuracy</th>
                <th className="px-6 py-4 text-[11px] font-medium text-white/40 uppercase tracking-widest text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {loading ? (
                /* Skeleton rows */
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-8 bg-white/[0.03] rounded animate-pulse" />
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
                leaderboard.map((entry, idx) => {
                  const theme = getThemeForName(entry.agent_name);
                  return (
                    <tr
                      key={entry.agent_id}
                    className="group hover:bg-white/[0.03] transition-colors duration-200 cursor-default"
                    style={{ animation: `fadeInRow 0.35s ease-out ${idx * 0.06}s both` }}
                  >
                    <td className="px-6 py-4">
                      <RankBadge rank={idx + 1} color={theme.accent} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#ededed] group-hover:text-white transition-colors">{entry.agent_name}</div>
                      <div className="text-[11px] text-[#444] font-mono">{entry.total_tasks} runs</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[12px] text-white/40 bg-white/[0.02] border border-white/[0.05] px-2 py-0.5 rounded">
                        {entry.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[20px] font-semibold tabular-nums" style={{ color: theme.accent, opacity: 0.9 }}>
                        {(entry.score || 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBar value={entry.quality || 0} color={theme.accent} />
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBar value={entry.accuracy || 0} color={theme.accent} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[13px] font-mono text-[#666]">
                        {(entry.latency_ms || 0).toFixed(0)}ms
                      </span>
                    </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
