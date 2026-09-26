"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { API_BASE_URL } from "@/lib/api";
import { StatusBadge } from "@/components/ui/Badge";
import { useRouter } from "next/navigation";
import {
  ListTodo,
  Search,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Bot,
  X,
  Loader2,
  Clock,
  Gauge,
  DollarSign,
  Star,
  MessageSquare,
  Terminal,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Evaluation {
  quality_score: number | null;
  accuracy_score: number | null;
  final_score: number | null;
  decision: string | null;
  evaluator_feedback: string | null;
}

interface AgentRun {
  id: string;
  agent_id: string;
  agent_name: string;
  status: string;
  response: string | null;
  latency_ms: number | null;
  estimated_cost: number | null;
  evaluation: Evaluation | null;
}

interface TaskItem {
  id: string;
  title: string;
  prompt: string;
  status: string;
  created_at: string;
  completed_at?: string | null;
  runs?: AgentRun[];
}

const agentTabColors = [
  { active: "border-violet-400/60 bg-violet-500/10 text-violet-300", dot: "bg-violet-400" },
  { active: "border-cyan-400/60 bg-cyan-500/10 text-cyan-300", dot: "bg-cyan-400" },
  { active: "border-amber-400/60 bg-amber-500/10 text-amber-300", dot: "bg-amber-400" },
  { active: "border-rose-400/60 bg-rose-500/10 text-rose-300", dot: "bg-rose-400" },
];

function getTabThemeForName(name: string) {
  const char = name ? name.charAt(0).toUpperCase() : '';
  if (char === 'F') return agentTabColors[0];
  if (char === 'P') return agentTabColors[1];
  if (char === 'G') return agentTabColors[2];
  if (char === 'R') return agentTabColors[3];

  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return agentTabColors[Math.abs(hash) % agentTabColors.length];
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [activeTabAgentId, setActiveTabAgentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "RUNNING" | "FAILED">("ALL");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const router = useRouter();

  // New Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPrompt, setNewTaskPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks`);
      if (res.ok) {
        const data: TaskItem[] = await res.json();
        setTasks(data);
        if (data.length > 0 && !selectedTaskId) {
          setSelectedTaskId(data[0].id);
        }
      }
    } catch {
      // Backend not reachable
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [selectedTaskId]);

  useEffect(() => {
    if (!selectedTaskId) return;
    const fetchDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tasks/${selectedTaskId}`);
        if (res.ok) {
          const data: TaskItem = await res.json();
          setSelectedTask(data);
          if (data.runs && data.runs.length > 0 && !activeTabAgentId) {
            setActiveTabAgentId(data.runs[0].agent_id);
          }
        }
      } catch {
        // Backend not reachable
      }
    };
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaskId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks();
    const interval = setInterval(fetchTasks, 15000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  useEffect(() => {
    if (!selectedTask || (selectedTask.status !== "running" && selectedTask.status !== "queued")) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tasks/${selectedTask.id}`);
        if (res.ok) {
          const data: TaskItem = await res.json();
          setSelectedTask(data);
        }
      } catch {
        // Backend not reachable
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedTask]);

  const filteredTasks = useMemo(() => tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "COMPLETED" && t.status === "completed") ||
      (statusFilter === "RUNNING" && (t.status === "running" || t.status === "queued")) ||
      (statusFilter === "FAILED" && t.status === "failed");
    return matchesSearch && matchesStatus;
  }), [tasks, searchQuery, statusFilter]);

  const selectedRun =
    selectedTask?.runs?.find((r) => r.agent_id === activeTabAgentId) ||
    selectedTask?.runs?.[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskPrompt.trim() || !newTaskTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const agentRes = await fetch(`${API_BASE_URL}/api/agents`);
      if (!agentRes.ok) throw new Error("Failed to fetch agents");
      const agents = await agentRes.json();
      const agentIds = agents.map((a: { id: string }) => a.id);
      if (agentIds.length === 0) {
        alert("No agents available to run this task.");
        setIsSubmitting(false);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle, prompt: newTaskPrompt, agent_ids: agentIds })
      });
      if (res.ok) {
        const created = await res.json();
        setNewTaskTitle("");
        setNewTaskPrompt("");
        setIsModalOpen(false);
        await fetchTasks();
        setSelectedTaskId(created.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] min-h-[600px] flex flex-col space-y-5 relative animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
            title="Go Back"
          >
            &lt;
          </button>
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-white/90">Tasks</h1>
            <p className="text-[14px] text-white/35 mt-1">
              Monitor and inspect multi-agent task evaluations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTasks}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-white/50 transition-all hover:bg-white/[0.08] hover:text-white/80 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] border border-white/10 px-4 py-2 text-[13px] font-medium text-white/70 transition-all hover:bg-white/[0.12] hover:text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            New Task
          </button>
        </div>
      </div>

      {/* Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start h-full pb-4">
        {/* Left: Task List */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.015]">
          {/* Search */}
          <div className="p-4 border-b border-white/[0.06] space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/20" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] py-2 pl-9 pr-4 text-[13px] text-white/80 placeholder:text-white/20 outline-none transition-colors focus:border-white/15 focus:bg-white/[0.05]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {(["ALL", "COMPLETED", "RUNNING", "FAILED"] as const).map((filter) => {
                const isActive = statusFilter === filter;
                const filterStyles: Record<string, string> = {
                  ALL: isActive ? "bg-white/10 text-white/80 border-white/15" : "",
                  COMPLETED: isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" : "",
                  RUNNING: isActive ? "bg-amber-500/10 text-amber-400 border-amber-500/25" : "",
                  FAILED: isActive ? "bg-rose-500/10 text-rose-400 border-rose-500/25" : "",
                };
                return (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all ${
                      isActive
                        ? filterStyles[filter]
                        : "border-transparent bg-transparent text-white/30 hover:text-white/50 hover:bg-white/[0.04]"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Task Items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {loading && tasks.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-white/20">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-white/20">No matching tasks found.</div>
            ) : (
              filteredTasks.map((task, i) => {
                const isSelected = task.id === selectedTaskId;
                return (
                  <motion.button
                    key={task.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => { setSelectedTaskId(task.id); setActiveTabAgentId(null); }}
                    className={`w-full text-left rounded-lg p-3 transition-all duration-200 flex flex-col gap-2 group ${
                      isSelected
                        ? "bg-white/[0.06] border border-white/10"
                        : "bg-transparent border border-transparent hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-white/20 group-hover:text-white/30 transition-colors">
                        {task.id.slice(0, 8)}
                      </span>
                      <StatusBadge status={task.status} />
                    </div>
                    <span className={`text-[13px] font-medium line-clamp-2 transition-colors ${
                      isSelected ? "text-white/80" : "text-white/50 group-hover:text-white/70"
                    }`}>
                      {task.title}
                    </span>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="lg:col-span-8 h-full flex flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.015]">
          {!selectedTask ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <ListTodo className="h-6 w-6 text-white/15" />
              </div>
              <p className="text-[14px] text-white/25">Select a task to inspect evaluations.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Task Header */}
              <div className="p-6 border-b border-white/[0.06] shrink-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-mono text-white/25">{selectedTask.id}</span>
                    <button
                      onClick={() => handleCopy(selectedTask.id)}
                      className="text-white/20 hover:text-white/60 transition-colors"
                    >
                      {copiedResponse ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <StatusBadge status={selectedTask.status} />
                </div>

                <h2 className="text-[20px] font-semibold text-white/85">{selectedTask.title}</h2>

                {/* Prompt */}
                <div className="pt-2">
                  <div className="text-[10px] uppercase tracking-[0.15em] font-medium text-white/20 mb-1.5 flex items-center gap-1.5"><Terminal className="w-3 h-3"/>Prompt</div>
                  <p className="text-[13px] font-mono text-white/60 leading-relaxed whitespace-pre-wrap pl-4 border-l-2 border-white/10">
                    {selectedTask.prompt}
                  </p>
                </div>
              </div>

              {/* Agent Tabs */}
              {selectedTask.runs && selectedTask.runs.length > 0 && (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-white/[0.06] p-4 shrink-0 overflow-x-auto">
                    {selectedTask.runs.map((run) => {
                      const isCurrent = (activeTabAgentId || selectedTask.runs![0].agent_id) === run.agent_id;
                      const tabTheme = getTabThemeForName(run.agent_name);
                      const score = run.evaluation?.final_score;

                      return (
                        <button
                          key={run.id}
                          onClick={() => setActiveTabAgentId(run.agent_id)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all ${
                            isCurrent
                              ? tabTheme.active
                              : "border-white/[0.06] bg-transparent text-white/30 hover:text-white/50 hover:bg-white/[0.03]"
                          }`}
                        >
                          <Bot className="h-3.5 w-3.5" />
                          <span>{run.agent_name}</span>
                          {score !== null && score !== undefined && (
                            <span className="ml-1 opacity-70 font-mono text-[11px]">{score}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Evaluation Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {selectedRun && (
                      <div className="space-y-6">
                        {selectedRun.evaluation ? (
                          <>
                            {/* Metrics - Compact Row */}
                            <div className="flex flex-wrap items-center gap-6 px-2 py-3 border-b border-white/[0.04]">
                              <div className="flex items-center gap-2">
                                <Star className="h-3.5 w-3.5 text-white/20" />
                                <span className="text-[11px] text-white/40 uppercase tracking-widest">Score</span>
                                <span className="text-[14px] font-mono text-white/90 ml-1">{selectedRun.evaluation.final_score ?? 0}</span>
                              </div>
                              <div className="w-[1px] h-4 bg-white/10" />
                              <div className="flex items-center gap-2">
                                <Gauge className="h-3.5 w-3.5 text-white/20" />
                                <span className="text-[11px] text-white/40 uppercase tracking-widest">Quality</span>
                                <span className={`text-[14px] font-medium ml-1 ${
                                  (selectedRun.evaluation.quality_score ?? 0) >= 80 ? 'text-emerald-400' :
                                  (selectedRun.evaluation.quality_score ?? 0) >= 50 ? 'text-amber-400' : 'text-rose-400'
                                }`}>
                                  {selectedRun.evaluation.quality_score ?? 0}
                                </span>
                              </div>
                              <div className="w-[1px] h-4 bg-white/10" />
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-white/20" />
                                <span className="text-[11px] text-white/40 uppercase tracking-widest">Latency</span>
                                <span className="text-[14px] font-mono text-white/70 ml-1">
                                  {selectedRun.latency_ms ? `${selectedRun.latency_ms.toFixed(0)}ms` : "--"}
                                </span>
                              </div>
                              <div className="w-[1px] h-4 bg-white/10" />
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-3.5 w-3.5 text-white/20" />
                                <span className="text-[11px] text-white/40 uppercase tracking-widest">Cost</span>
                                <span className="text-[14px] font-mono text-white/70 ml-1">
                                  {selectedRun.estimated_cost ? `$${selectedRun.estimated_cost.toFixed(5)}` : "--"}
                                </span>
                              </div>
                            </div>

                            {/* Evaluator Feedback */}
                            {selectedRun.evaluation.evaluator_feedback && (
                              <div className="px-2 pt-2">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <MessageSquare className="h-3.5 w-3.5 text-white/20" />
                                  <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/25">Evaluator Feedback</span>
                                </div>
                                <p className="text-[13px] text-white/50 leading-relaxed italic border-l-2 border-white/5 pl-3">
                                  &quot;{selectedRun.evaluation.evaluator_feedback}&quot;
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
                            <Loader2 className="h-5 w-5 animate-spin text-white/15 mx-auto mb-2" />
                            <span className="text-[13px] text-white/25">Evaluation pending...</span>
                          </div>
                        )}

                        {/* Agent Output */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-3">
                            <Zap className="h-3.5 w-3.5 text-white/20" />
                            <span className="text-[12px] font-medium text-white/40">Agent Output</span>
                          </div>
                          <div className="rounded-xl bg-black/30 border border-white/[0.06] p-5 text-[13px] font-mono text-white/60 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                            {selectedRun.response || <span className="text-white/15">No output generated yet.</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0c0c0f] p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 text-white/25 hover:text-white/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-[20px] font-semibold text-white/85 mb-1">Create New Task</h2>
              <p className="text-[14px] text-white/35 mb-6">
                Dispatch a prompt to all registered agents.
              </p>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-white/30 uppercase tracking-[0.12em] mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="e.g. Fetch HackerNews headlines"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[14px] text-white/80 placeholder:text-white/15 outline-none transition-colors focus:border-white/15 focus:bg-white/[0.05]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-white/30 uppercase tracking-[0.12em] mb-2">
                    Task Prompt
                  </label>
                  <textarea
                    value={newTaskPrompt}
                    onChange={(e) => setNewTaskPrompt(e.target.value)}
                    placeholder="Write the task description..."
                    className="w-full h-32 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[14px] text-white/80 placeholder:text-white/15 outline-none resize-none transition-colors focus:border-white/15 focus:bg-white/[0.05]"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-white/8 bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-white/50 transition-all hover:bg-white/[0.08] hover:text-white/80"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-white/[0.08] border border-white/10 px-5 py-2 text-[13px] font-medium text-white/70 transition-all hover:bg-white/[0.12] hover:text-white disabled:opacity-40"
                    disabled={isSubmitting || !newTaskPrompt.trim()}
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Dispatching...
                      </span>
                    ) : (
                      "Dispatch Task"
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
