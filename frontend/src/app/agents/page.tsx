"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/Badge";
import { useRouter } from "next/navigation";
import { Bot, Cpu, Zap, Activity, Sparkles, ChevronRight, Terminal, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Agent {
  id: string;
  name: string;
  model: string;
  provider: string;
  system_prompt: string;
  status: string;
  created_at: string;
}

const agentAccents = [
  { bg: "from-violet-500/15 via-violet-500/5 to-transparent", borderHover: "hover:border-violet-500/30", dot: "bg-violet-400", glow: "hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)]", icon: "text-violet-400", chip: "bg-violet-500/10 border-violet-500/20 text-violet-300", accent: "#8b5cf6" },
  { bg: "from-cyan-500/15 via-cyan-500/5 to-transparent", borderHover: "hover:border-cyan-500/30", dot: "bg-cyan-400", glow: "hover:shadow-[0_0_30px_-5px_rgba(34,211,238,0.15)]", icon: "text-cyan-400", chip: "bg-cyan-500/10 border-cyan-500/20 text-cyan-300", accent: "#22d3ee" },
  { bg: "from-amber-500/15 via-amber-500/5 to-transparent", borderHover: "hover:border-amber-500/30", dot: "bg-amber-400", glow: "hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]", icon: "text-amber-400", chip: "bg-amber-500/10 border-amber-500/20 text-amber-300", accent: "#f59e0b" },
  { bg: "from-rose-500/15 via-rose-500/5 to-transparent", borderHover: "hover:border-rose-500/30", dot: "bg-rose-400", glow: "hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.15)]", icon: "text-rose-400", chip: "bg-rose-500/10 border-rose-500/20 text-rose-300", accent: "#f43f5e" },
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

function AgentCard({ agent, onConfigure }: { agent: Agent; onConfigure: () => void }) {
  const isActive = agent.status === "active";
  const theme = getThemeForName(agent.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`group relative overflow-hidden rounded-xl border border-white/[0.04] bg-black/40 p-6 transition-all duration-500 ${theme.borderHover} ${theme.glow} backdrop-blur-md`}
    >
      {/* Background Hover Animation */}
      <div 
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br ${theme.bg}`} 
      />

      {/* Side color accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] opacity-40 group-hover:opacity-100 transition-opacity duration-500"
        style={{ backgroundColor: theme.accent, boxShadow: `0 0 12px ${theme.accent}` }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-black/40 border border-white/5 ${theme.icon} transition-colors`}>
                <Bot className="h-5 w-5" />
              </div>
              {isActive && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${theme.dot} opacity-75`} />
                  <span className={`relative inline-flex h-3 w-3 rounded-full ${theme.dot}`} />
                </span>
              )}
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-white/90 group-hover:text-white transition-colors">
                {agent.name}
              </h3>
              <span className="text-[11px] font-mono text-white/25">{agent.id.slice(0, 8)}</span>
            </div>
          </div>
          <StatusBadge status={agent.status} />
        </div>

        {/* Model & Provider */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-mono ${theme.chip}`}>
            <Cpu className="h-3 w-3" />
            {agent.model}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] text-white/40 capitalize">
            <Sparkles className="h-3 w-3" />
            {agent.provider}
          </span>
        </div>

        {/* System Prompt */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Terminal className="h-3 w-3 text-white/20" />
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/25">
              System Prompt
            </span>
          </div>
          <p className="rounded-lg bg-black/30 border border-white/5 p-3 text-[12px] leading-relaxed text-white/40 line-clamp-3 group-hover:text-white/50 transition-colors">
            {agent.system_prompt}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
          <span className="text-[11px] font-mono text-white/20">
            {new Date(agent.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <button
            onClick={onConfigure}
            className="inline-flex items-center gap-1 rounded-lg border border-white/8 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-white/50 transition-all hover:bg-white/10 hover:text-white/80 hover:border-white/15"
          >
            Configure
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Register Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentModel, setNewAgentModel] = useState("openai/gpt-4");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configure Modal State
  const [configuringAgent, setConfiguringAgent] = useState<Agent | null>(null);

  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAgentName, model: newAgentModel })
      });
      if (res.ok) {
        const newAgent = await res.json();
        setAgents((prev) => [...prev, newAgent]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
      setIsRegisterOpen(false);
      setNewAgentName("");
    }
  };

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/agents`);
        if (res.ok) {
          const data = await res.json();
          setAgents(data);
        }
      } catch {
        // Backend not reachable — expected during frontend-only dev
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
            title="Go Back"
          >
            &lt;
          </button>
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-white/90">
              Agent Roster
            </h1>
            <p className="text-[14px] text-white/40 mt-1">
              Manage and configure autonomous evaluators in the ARENA cluster.
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsRegisterOpen(true)}
          className="group inline-flex items-center gap-2 rounded-xl bg-white/[0.08] border border-white/10 px-5 py-2.5 text-[13px] font-medium text-white/70 transition-all hover:bg-white/[0.12] hover:text-white hover:border-white/15 hover:shadow-lg hover:shadow-white/5"
        >
          Register New Agent
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Total Agents" value={agents.length} icon={<Bot className="w-4 h-4" />} />
        <MetricCard title="Active Capacity" value={agents.filter(a => a.status === "active").length} icon={<Activity className="w-4 h-4" />} />
        <MetricCard title="Avg Inference" value="1.2s" icon={<Zap className="w-4 h-4" />} />
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 h-56 animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="h-11 w-11 rounded-xl bg-white/[0.04]" />
                <div className="space-y-2">
                  <div className="h-3.5 w-28 rounded bg-white/[0.04]" />
                  <div className="h-2.5 w-16 rounded bg-white/[0.03]" />
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="h-2.5 w-full rounded bg-white/[0.03]" />
                <div className="h-2.5 w-3/4 rounded bg-white/[0.03]" />
              </div>
            </div>
          ))
        ) : agents.length === 0 ? (
          <div className="col-span-full py-16 text-center text-white/25 text-[14px]">
            No agents registered yet.
          </div>
        ) : (
          agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onConfigure={() => setConfiguringAgent(agent)} />
          ))
        )}
      </div>

      {/* Register Agent Modal */}
      <AnimatePresence>
        {isRegisterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0c0f] p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="absolute right-4 top-4 text-white/25 hover:text-white/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-[20px] font-semibold text-white/85 mb-1">Register Agent</h2>
              <p className="text-[14px] text-white/35 mb-6">
                Add a new model configuration to your cluster.
              </p>

              <form onSubmit={handleRegisterAgent} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-white/30 uppercase tracking-[0.12em] mb-2">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="e.g. Finance Analyst"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[14px] text-white/80 placeholder:text-white/15 outline-none transition-colors focus:border-white/15 focus:bg-white/[0.05]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/30 uppercase tracking-[0.12em] mb-2">
                    Foundation Model
                  </label>
                  <select
                    value={newAgentModel}
                    onChange={(e) => setNewAgentModel(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-2.5 text-[14px] text-white/80 outline-none transition-colors focus:border-white/15 focus:bg-white/[0.05] appearance-none"
                  >
                    <option value="openai/gpt-4">GPT-4</option>
                    <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
                    <option value="google/gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="meta/llama-3">Llama 3</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsRegisterOpen(false)}
                    className="rounded-xl border border-white/8 bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-white/50 transition-all hover:bg-white/[0.08] hover:text-white/80"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-white/[0.08] border border-white/10 px-5 py-2 text-[13px] font-medium text-white/70 transition-all hover:bg-white/[0.12] hover:text-white disabled:opacity-40"
                    disabled={isSubmitting || !newAgentName.trim()}
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deploying...
                      </span>
                    ) : (
                      "Deploy Agent"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Configure Agent Modal */}
      <AnimatePresence>
        {configuringAgent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0c0f] p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setConfiguringAgent(null)}
                className="absolute right-4 top-4 text-white/25 hover:text-white/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-[20px] font-semibold text-white/85 mb-1">Configure {configuringAgent.name}</h2>
              <p className="text-[14px] text-white/35 mb-6">
                Adjust parameters and prompt logic for this agent.
              </p>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  setTimeout(() => {
                    setIsSubmitting(false);
                    setConfiguringAgent(null);
                  }, 800);
                }} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-medium text-white/30 uppercase tracking-[0.12em] mb-2">
                    Foundation Model
                  </label>
                  <select
                    defaultValue={configuringAgent.model}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-2.5 text-[14px] text-white/80 outline-none transition-colors focus:border-white/15 focus:bg-white/[0.05] appearance-none"
                  >
                    <option value={configuringAgent.model}>{configuringAgent.model}</option>
                    <option value="openai/gpt-4">openai/gpt-4</option>
                    <option value="anthropic/claude-3-opus">anthropic/claude-3-opus</option>
                    <option value="google/gemini-1.5-pro">google/gemini-1.5-pro</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[11px] font-medium text-white/30 uppercase tracking-[0.12em] mb-2">
                    System Prompt
                  </label>
                  <textarea
                    defaultValue={configuringAgent.system_prompt}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[13px] text-white/80 outline-none transition-colors focus:border-white/15 focus:bg-white/[0.05] h-24 resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-medium text-white/30 uppercase tracking-[0.12em] mb-2">
                    Agent Status
                  </label>
                  <select
                    defaultValue={configuringAgent.status}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#111] px-4 py-2.5 text-[14px] text-white/80 outline-none transition-colors focus:border-white/15 focus:bg-white/[0.05] appearance-none"
                  >
                    <option value="active">Active</option>
                    <option value="idle">Idle</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setConfiguringAgent(null)}
                    className="rounded-xl border border-white/8 bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-white/50 transition-all hover:bg-white/[0.08] hover:text-white/80"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-white/[0.08] border border-white/10 px-5 py-2 text-[13px] font-medium text-white/70 transition-all hover:bg-white/[0.12] hover:text-white disabled:opacity-40"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Save Config"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
