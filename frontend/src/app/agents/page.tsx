"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/Badge";
import { Bot, Cpu, Zap, Activity, Sparkles } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  model: string;
  provider: string;
  system_prompt: string;
  status: string;
  created_at: string;
}

function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const isActive = agent.status === "active";

  return (
    <div
      className="resend-card p-6 flex flex-col justify-between group relative overflow-hidden"
      style={{
        animation: `fadeInUp 0.4s ease-out ${index * 0.07}s both`,
      }}
    >
      {/* Shimmer on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(16,185,129,0.04) 50%, transparent 60%)",
          backgroundSize: "200% 100%",
        }}
      />

      {/* Top-right corner accent */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "radial-gradient(circle at top right, rgba(16,185,129,0.08), transparent 70%)" }}
      />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-[#0d1f15] border border-[#1a3a25] flex items-center justify-center group-hover:border-emerald-800 transition-colors duration-300">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              {/* Live pulse dot */}
              {isActive && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
              )}
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#ededed] group-hover:text-white transition-colors">{agent.name}</h3>
              <div className="text-[11px] font-mono text-[#555]">{agent.id.slice(0, 8)}</div>
            </div>
          </div>
          <StatusBadge status={agent.status} />
        </div>

        {/* Model / Provider chips */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#111] border border-[#1e1e1e] text-[11px] text-[#aaa] font-mono group-hover:border-[#333] transition-colors">
            <Cpu className="w-3 h-3 text-emerald-600" />
            {agent.model}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#111] border border-[#1e1e1e] text-[11px] text-[#aaa] capitalize group-hover:border-[#333] transition-colors">
            <Sparkles className="w-3 h-3 text-purple-500" />
            {agent.provider}
          </span>
        </div>

        {/* System Prompt */}
        <div>
          <div className="text-[10px] font-medium text-[#555] uppercase tracking-widest mb-1.5">System Prompt</div>
          <div className="text-[12px] text-[#777] bg-[#080808] border border-[#1a1a1a] p-3 rounded-md line-clamp-3 leading-relaxed group-hover:border-[#252525] transition-colors">
            {agent.system_prompt}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-[#161616] flex items-center justify-between">
        <span className="text-[11px] text-[#444] font-mono">
          {new Date(agent.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        <button className="resend-btn text-[12px] py-1.5 px-3 group-hover:border-[#333] transition-colors">
          Configure
        </button>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/agents`);
        if (res.ok) {
          const data = await res.json();
          setAgents(data);
        }
      } catch (e) {
        console.error("Failed to fetch agents", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-[#222]">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#ededed]">
            Agent Roster
          </h1>
          <p className="text-[14px] text-[#888] mt-1">
            Manage your autonomous workforce and view model configurations.
          </p>
        </div>
        <button className="resend-btn-primary">
          Register New Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Total Agents" value={agents.length} icon={<Bot className="w-4 h-4" />} />
        <MetricCard title="Active Capacity" value={agents.filter(a => a.status === "active").length} icon={<Activity className="w-4 h-4" />} />
        <MetricCard title="Avg Inference" value="1.2s" icon={<Zap className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {loading ? (
          /* Skeleton loaders */
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="resend-card p-6 h-52 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-[#1a1a1a]" />
                <div className="space-y-2">
                  <div className="h-3 w-28 bg-[#1a1a1a] rounded" />
                  <div className="h-2 w-16 bg-[#111] rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-[#111] rounded" />
                <div className="h-2 w-3/4 bg-[#111] rounded" />
              </div>
            </div>
          ))
        ) : agents.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#555] text-[14px]">
            No agents registered yet.
          </div>
        ) : (
          agents.map((agent, i) => (
            <AgentCard key={agent.id} agent={agent} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
