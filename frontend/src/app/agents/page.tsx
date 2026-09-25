"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import {
  Bot,
  Cpu,
  Zap,
  Terminal,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  Clock,
  DollarSign,
  ShieldCheck,
  Target
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  model: string;
  system_prompt: string;
  status: string;
  created_at?: string;
  total_tasks?: number;
  score?: number;
  quality?: number;
  accuracy?: number;
  latency_ms?: number;
  cost?: number;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchAgentsData = async () => {
    try {
      const [agentsRes, leaderboardRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/agents`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE_URL}/api/leaderboard`).then((r) => (r.ok ? r.json() : []))
      ]);

      const statsMap = new Map<string, any>();
      if (Array.isArray(leaderboardRes)) {
        leaderboardRes.forEach((item: any) => {
          statsMap.set(item.agent_id, item);
        });
      }

      if (Array.isArray(agentsRes)) {
        const combined = agentsRes.map((agent: any) => {
          const stats = statsMap.get(agent.id) || {};
          return {
            ...agent,
            total_tasks: stats.total_tasks ?? 0,
            score: stats.score ?? 0,
            quality: stats.quality ?? 0,
            accuracy: stats.accuracy ?? 0,
            latency_ms: stats.latency_ms ?? 0,
            cost: stats.cost ?? 0
          };
        });
        setAgents(combined);
      }
    } catch (e) {
      console.error("Failed to load agent roster", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentsData();
    const interval = setInterval(fetchAgentsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const togglePrompt = (id: string) => {
    setExpandedPrompts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getAgentProfile = (id: string) => {
    switch (id) {
      case "research-pro":
        return { temp: 0.4, maxTokens: 1500, tag: "Deep Reasoning", badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
      case "precision-x":
        return { temp: 0.1, maxTokens: 800, tag: "Deterministic Facts", badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case "fast-research":
        return { temp: 0.5, maxTokens: 400, tag: "Speed & Cost", badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
      case "general-agent":
        return { temp: 0.7, maxTokens: 1000, tag: "Balanced General", badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
      default:
        return { temp: 0.7, maxTokens: 1024, tag: "Standard", badgeColor: "text-zinc-400 bg-white/[0.05] border-white/[0.08]" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] uppercase font-mono tracking-widest text-zinc-400">
              Workforce Directory
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[11px] font-mono text-emerald-400">4 Active Specialists</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Agent Roster
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAgentsData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Roster</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dispatch Task</span>
          </Link>
        </div>
      </div>

      {/* Agents Roster Grid (2-column Linear cards) */}
      {loading && agents.length === 0 ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500 bg-[#0e1017] border border-white/[0.08] rounded-lg">
          Loading agent profiles from Neon PostgreSQL...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {agents.map((agent) => {
            const profile = getAgentProfile(agent.id);
            const isExpanded = !!expandedPrompts[agent.id];

            return (
              <div
                key={agent.id}
                className="bg-[#0e1017] hover:bg-[#11131c] border border-white/[0.08] hover:border-white/[0.14] rounded-lg p-5 transition-all duration-150 flex flex-col justify-between space-y-4"
              >
                {/* Header: Name, Role, Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-200">
                        <Bot className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                          <span>{agent.name}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.2 rounded border font-semibold ${profile.badgeColor}`}>
                            {profile.tag}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 font-sans">
                          {agent.role}
                        </div>
                      </div>
                    </div>

                    <StatusBadge status={agent.status} />
                  </div>

                  {/* Strategic Description */}
                  <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                    {agent.description}
                  </p>
                </div>

                {/* Technical Configuration Pills */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-xs font-mono">
                  <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-[10px] text-zinc-500 uppercase">Model</div>
                    <div className="text-[11px] text-zinc-200 font-semibold truncate mt-0.5">
                      {agent.model.split("/").pop()}
                    </div>
                  </div>

                  <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-[10px] text-zinc-500 uppercase">Temperature</div>
                    <div className="text-[11px] text-zinc-200 font-semibold mt-0.5">
                      {profile.temp}
                    </div>
                  </div>

                  <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-[10px] text-zinc-500 uppercase">Max Output</div>
                    <div className="text-[11px] text-zinc-200 font-semibold mt-0.5">
                      {profile.maxTokens} tok
                    </div>
                  </div>
                </div>

                {/* Cumulative Historical Performance Metrics */}
                <div className="p-3 rounded-md bg-[#090a0f] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span className="uppercase tracking-wider font-semibold">Cumulative Performance</span>
                    <span className="text-zinc-500">{agent.total_tasks || 0} Runs Recorded</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono">
                    <div className="p-1.5 rounded bg-white/[0.02]">
                      <div className="text-[10px] text-zinc-500">Score</div>
                      <div className="text-sm font-bold text-emerald-400">
                        {agent.score ? agent.score : "—"}
                      </div>
                    </div>

                    <div className="p-1.5 rounded bg-white/[0.02]">
                      <div className="text-[10px] text-zinc-500">Quality</div>
                      <div className="text-sm font-bold text-zinc-200">
                        {agent.quality ? `${agent.quality}%` : "—"}
                      </div>
                    </div>

                    <div className="p-1.5 rounded bg-white/[0.02]">
                      <div className="text-[10px] text-zinc-500">Latency</div>
                      <div className="text-sm font-bold text-zinc-200">
                        {agent.latency_ms ? `${agent.latency_ms.toFixed(0)}ms` : "—"}
                      </div>
                    </div>

                    <div className="p-1.5 rounded bg-white/[0.02]">
                      <div className="text-[10px] text-zinc-500">Avg Cost</div>
                      <div className="text-sm font-bold text-zinc-200">
                        {agent.cost ? `$${agent.cost.toFixed(4)}` : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collapsible System Prompt Architecture */}
                <div className="pt-2 border-t border-white/[0.06]">
                  <button
                    onClick={() => togglePrompt(agent.id)}
                    className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3 h-3 text-zinc-500" />
                      <span>System Prompt Architecture</span>
                    </span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 p-3 rounded bg-[#08090d] border border-white/[0.06] text-[11px] font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap selection:bg-blue-500/20">
                      {agent.system_prompt}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
