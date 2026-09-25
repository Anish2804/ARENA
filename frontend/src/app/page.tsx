"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import {
  Sparkles,
  Bot,
  Activity,
  ArrowRight,
  Clock,
  DollarSign,
  Award,
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role: string;
}

interface ActivityEvent {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
}

interface TaskItem {
  id: string;
  title: string;
  prompt: string;
  status: string;
  created_at: string;
  completed_at?: string | null;
  runs?: any[];
}

export default function CommandCenter() {
  const [metrics, setMetrics] = useState({
    agentsOnline: 4,
    tasksRunning: 0,
    avgQuality: 0,
    avgCost: 0
  });

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [taskPrompt, setTaskPrompt] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [recentTasks, setRecentTasks] = useState<TaskItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityEvent[]>([]);

  const samplePrompts = [
    "Compare Byzantine fault tolerance vs fail-stop architectures for autonomous vehicle actuators.",
    "Evaluate NVIDIA's enterprise competitive moat and hardware supply constraints over the next 24 months.",
    "Design a resilient zero-trust API gateway architecture for high-frequency algorithmic trading."
  ];

  // Fetch initial dashboard telemetry
  const loadData = async () => {
    try {
      const [agentsRes, leaderboardRes, tasksRes, activityRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/agents`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE_URL}/api/leaderboard`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE_URL}/api/tasks`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE_URL}/api/activity?limit=8`).then((r) => (r.ok ? r.json() : []))
      ]);

      if (Array.isArray(agentsRes) && agentsRes.length > 0) {
        setAgents(agentsRes);
        // Default to all agents if not yet selected
        setSelectedAgentIds((prev) => (prev.length === 0 ? agentsRes.map((a: Agent) => a.id) : prev));
      }

      if (Array.isArray(tasksRes)) {
        setRecentTasks(tasksRes.slice(0, 5));
        const activeCount = tasksRes.filter(
          (t: TaskItem) => t.status === "running" || t.status === "queued"
        ).length;
        setMetrics((prev) => ({ ...prev, tasksRunning: activeCount }));
      }

      const completedEvals = Array.isArray(leaderboardRes)
        ? leaderboardRes.filter((item: any) => item.total_tasks > 0)
        : [];

      const avgQuality =
        completedEvals.length > 0
          ? completedEvals.reduce((acc: number, val: any) => acc + (val.quality || 0), 0) /
            completedEvals.length
          : 0;

      const avgCost =
        completedEvals.length > 0
          ? completedEvals.reduce((acc: number, val: any) => acc + (val.cost || 0), 0) /
            completedEvals.length
          : 0;

      setMetrics({
        agentsOnline: agentsRes.length || 4,
        tasksRunning: Array.isArray(tasksRes)
          ? tasksRes.filter((t: any) => t.status === "running" || t.status === "queued").length
          : 0,
        avgQuality: parseFloat(avgQuality.toFixed(1)),
        avgCost: parseFloat(avgCost.toFixed(4))
      });

      if (Array.isArray(activityRes)) {
        setRecentActivities(activityRes);
      }
    } catch (e) {
      console.error("Error loading dashboard data", e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Poll active task status if currently executing
  useEffect(() => {
    if (!activeTask || activeTask.status === "completed" || activeTask.status === "failed") return;

    const taskPoll = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tasks/${activeTask.id}`);
        if (res.ok) {
          const updated = await res.json();
          setActiveTask(updated);
          if (updated.status === "completed" || updated.status === "failed") {
            clearInterval(taskPoll);
            loadData();
          }
        }
      } catch (e) {
        console.error("Error polling active task", e);
      }
    }, 2000);

    return () => clearInterval(taskPoll);
  }, [activeTask]);

  const toggleAgent = (agentId: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId)
        ? prev.length > 1
          ? prev.filter((id) => id !== agentId)
          : prev // keep at least 1
        : [...prev, agentId]
    );
  };

  const handleRunTask = async () => {
    if (!taskPrompt.trim() || selectedAgentIds.length === 0) return;
    setIsDispatching(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskPrompt.slice(0, 60) + (taskPrompt.length > 60 ? "..." : ""),
          prompt: taskPrompt,
          agent_ids: selectedAgentIds
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveTask(data);
        setTaskPrompt("");
        loadData();
      }
    } catch (e) {
      console.error("Failed to dispatch task", e);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header (Vercel-style precision) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] uppercase font-mono tracking-widest text-zinc-400">
              Orchestration & Evaluation
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[11px] font-mono text-blue-400">Multi-Agent</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Command Center
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Cluster Ready: 4 Autonomous Workers</span>
        </div>
      </div>

      {/* Primary Metrics Grid (Linear-style dense cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Agents Ready"
          value={metrics.agentsOnline}
          subtext="100% Cluster Capacity"
          icon={<Bot className="w-4 h-4 text-blue-400" />}
        />
        <MetricCard
          label="Active Tasks"
          value={metrics.tasksRunning}
          subtext={metrics.tasksRunning > 0 ? "Executing concurrent runs" : "Standby for dispatch"}
          valueColor={metrics.tasksRunning > 0 ? "text-amber-400" : "text-zinc-100"}
          icon={<Activity className="w-4 h-4 text-amber-400" />}
        />
        <MetricCard
          label="Avg Benchmark"
          value={metrics.avgQuality > 0 ? `${metrics.avgQuality}%` : "—"}
          subtext="Evaluator Quality Score"
          valueColor="text-emerald-400"
          icon={<Award className="w-4 h-4 text-emerald-400" />}
        />
        <MetricCard
          label="Cost / Execution"
          value={metrics.avgCost > 0 ? `$${metrics.avgCost}` : "—"}
          subtext="Groq Token Efficiency"
          icon={<DollarSign className="w-4 h-4 text-zinc-400" />}
        />
      </div>

      {/* Task Dispatch Console (Linear/Vercel command interface) */}
      <div className="bg-[#0e1017] border border-white/[0.08] rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
              Dispatch Multi-Agent Task
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">
              Model: openai/gpt-oss-20b
            </span>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          <textarea
            value={taskPrompt}
            onChange={(e) => setTaskPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleRunTask();
              }
            }}
            placeholder="Describe the research, evaluation, or analysis task to benchmark across agents..."
            className="w-full bg-[#08090d] border border-white/[0.08] focus:border-blue-500/60 rounded-md p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 resize-none min-h-[100px] font-sans transition-colors"
          />

          {/* Sample Prompt Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
            <span className="text-[11px] font-mono text-zinc-500">Quick Prompts:</span>
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTaskPrompt(prompt)}
                className="text-[11px] px-2 py-1 rounded bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] text-zinc-300 transition-colors truncate max-w-[260px]"
                title={prompt}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Agent Selectors & Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-3 border-t border-white/[0.06]">
          {/* Target Agents Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-400 mr-1">Target Agents:</span>
            {agents.map((agent) => {
              const isSelected = selectedAgentIds.includes(agent.id);
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => toggleAgent(agent.id)}
                  className={`text-xs px-2.5 py-1 rounded-md border font-mono transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-300 shadow-xs"
                      : "bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? "bg-blue-400" : "bg-zinc-600"
                    }`}
                  />
                  <span>{agent.name}</span>
                </button>
              );
            })}
          </div>

          {/* Dispatch Button */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="hidden sm:inline text-[11px] font-mono text-zinc-500">
              Press ⌘+Enter
            </span>
            <button
              onClick={handleRunTask}
              disabled={isDispatching || !taskPrompt.trim() || selectedAgentIds.length === 0}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {isDispatching ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Dispatching Arena...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-white" />
                  <span>Launch Task ({selectedAgentIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Active Task Pipeline Status */}
        {activeTask && (
          <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-3">
            <div className="p-3.5 rounded-md bg-[#0a0c12] border border-blue-500/20 flex flex-col md:flex-row justify-between md:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-semibold text-blue-400 uppercase tracking-wider">
                    Execution Pipeline
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    ID: {activeTask.id.slice(0, 8)}
                  </span>
                  <StatusBadge status={activeTask.status} />
                </div>
                <div className="text-sm font-medium text-zinc-200 line-clamp-1">
                  {activeTask.title}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto">
                {activeTask.status === "completed" ? (
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    All Agents Evaluated & Persisted
                  </span>
                ) : (
                  <span className="text-xs font-mono text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Evaluating responses in parallel...
                  </span>
                )}
                <Link
                  href="/tasks"
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] transition-colors"
                >
                  <span>Inspect Runs</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Two-Column Telemetry Section: Recent Tasks & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Recent Executions Table */}
        <div className="lg:col-span-7 bg-[#0e1017] border border-white/[0.08] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                Recent Task Executions
              </span>
            </div>
            <Link
              href="/tasks"
              className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <span>View All ({recentTasks.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 font-mono">
              No task runs recorded yet. Launch your first task above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    <th className="pb-2 font-medium">Task</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Runs</th>
                    <th className="pb-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {recentTasks.map((t) => (
                    <tr key={t.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pr-3">
                        <div className="font-medium text-zinc-200 line-clamp-1 group-hover:text-white">
                          {t.title}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500">
                          {new Date(t.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-zinc-400">
                        {t.runs ? `${t.runs.length} agents` : "4 agents"}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          href="/tasks"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-blue-400 transition-colors"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Live Audit & Event Stream */}
        <div className="lg:col-span-5 bg-[#0e1017] border border-white/[0.08] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-200">
                Live Audit Stream
              </span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live
            </span>
          </div>

          {recentActivities.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 font-mono">
              Waiting for incoming agent events...
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {recentActivities.map((event) => (
                <div
                  key={event.id}
                  className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04] text-xs font-mono space-y-1 hover:border-white/[0.08] transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-400 font-medium">
                      {event.event_type}
                    </span>
                    <span>
                      {new Date(event.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {event.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
