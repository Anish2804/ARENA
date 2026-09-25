"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import {
  ListTodo,
  Clock,
  DollarSign,
  Cpu,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Bot,
  Zap,
  ArrowRight,
  Filter
} from "lucide-react";

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

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [activeTabAgentId, setActiveTabAgentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "RUNNING" | "FAILED">("ALL");
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Fetch list of tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks`);
      if (res.ok) {
        const data: TaskItem[] = await res.json();
        setTasks(data);
        if (data.length > 0 && !selectedTaskId) {
          setSelectedTaskId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch tasks", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch task detail when selected
  useEffect(() => {
    if (!selectedTaskId) return;

    const fetchDetails = async () => {
      setLoadingDetail(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/tasks/${selectedTaskId}`);
        if (res.ok) {
          const data: TaskItem = await res.json();
          setSelectedTask(data);
          if (data.runs && data.runs.length > 0 && !activeTabAgentId) {
            setActiveTabAgentId(data.runs[0].agent_id);
          }
        }
      } catch (e) {
        console.error("Failed to fetch task detail", e);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetails();
  }, [selectedTaskId]);

  // Polling for tasks list
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 15000);
    return () => clearInterval(interval);
  }, []);

  // Poll selected task if running
  useEffect(() => {
    if (!selectedTask || (selectedTask.status !== "running" && selectedTask.status !== "queued")) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tasks/${selectedTask.id}`);
        if (res.ok) {
          const data: TaskItem = await res.json();
          setSelectedTask(data);
        }
      } catch (e) {
        console.error(e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedTask]);

  // Filter tasks list
  const filteredTasks = tasks.filter((t) => {
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
  });

  const selectedRun =
    selectedTask?.runs?.find((r) => r.agent_id === activeTabAgentId) ||
    selectedTask?.runs?.[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] uppercase font-mono tracking-widest text-zinc-400">
              Evaluation Workbench
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[11px] font-mono text-blue-400">{tasks.length} Total Runs</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Tasks & Evaluations
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTasks}
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
            <span>New Task</span>
          </Link>
        </div>
      </div>

      {/* Master-Detail Layout (Linear-style dense two-pane interface) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Pane (4 cols): Searchable Task List */}
        <div className="lg:col-span-4 bg-[#0e1017] border border-white/[0.08] rounded-lg overflow-hidden flex flex-col h-[760px]">
          {/* Search & Filter Bar */}
          <div className="p-3 border-b border-white/[0.08] space-y-2 bg-[#090a0f]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search tasks, prompts, IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#0e1017] border border-white/[0.08] rounded-md text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 font-sans"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1 text-[11px] font-mono">
              {(["ALL", "COMPLETED", "RUNNING", "FAILED"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    statusFilter === filter
                      ? "bg-white/[0.12] text-white font-medium"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Task Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
            {loading && tasks.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-zinc-500">
                Loading task database...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-zinc-500">
                No matching tasks found.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isSelected = task.id === selectedTaskId;
                return (
                  <button
                    key={task.id}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setActiveTabAgentId(null);
                    }}
                    className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-blue-500/[0.08] border-l-2 border-blue-500"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-zinc-500">
                        {task.id.slice(0, 8)}
                      </span>
                      <StatusBadge status={task.status} />
                    </div>

                    <div className="text-xs font-medium text-zinc-200 line-clamp-2 leading-snug">
                      {task.title}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mt-1">
                      <span>
                        {new Date(task.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      <span>4 Agents</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane (8 cols): Deep Evaluation Inspector */}
        <div className="lg:col-span-8 bg-[#0e1017] border border-white/[0.08] rounded-lg p-5 space-y-5 min-h-[760px] flex flex-col justify-between">
          {!selectedTask ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 text-zinc-500 space-y-3">
              <ListTodo className="w-8 h-8 text-zinc-600" />
              <p className="text-xs font-mono">Select a task from the left to inspect multi-agent evaluations.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Task Header & Metadata */}
              <div className="pb-4 border-b border-white/[0.08] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-zinc-400">
                      TASK ID: {selectedTask.id}
                    </span>
                    <button
                      onClick={() => handleCopy(selectedTask.id)}
                      className="p-1 rounded hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Copy Task ID"
                    >
                      {copiedResponse ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <StatusBadge status={selectedTask.status} />
                </div>

                <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
                  {selectedTask.title}
                </h2>

                {/* Prompt Details Accordion */}
                <div className="p-3 rounded-md bg-[#08090d] border border-white/[0.06] text-xs font-mono text-zinc-300 space-y-1">
                  <div className="text-[10px] uppercase font-semibold text-zinc-500">
                    Evaluation Prompt
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{selectedTask.prompt}</p>
                </div>
              </div>

              {/* Running State Notice if currently evaluating */}
              {selectedTask.status === "running" && (
                <div className="p-4 rounded-md bg-blue-500/[0.06] border border-blue-500/20 flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                  <div className="text-xs font-mono text-blue-300 space-y-0.5">
                    <div className="font-semibold">Agents Executing in Parallel</div>
                    <div className="text-zinc-400">
                      Executing inferences on Groq cluster. Results and LLM-as-a-judge scores will stream live.
                    </div>
                  </div>
                </div>
              )}

              {/* Agent Roster Tabs */}
              {selectedTask.runs && selectedTask.runs.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.06] pb-2">
                    {selectedTask.runs.map((run) => {
                      const isCurrent = (activeTabAgentId || selectedTask.runs![0].agent_id) === run.agent_id;
                      const score = run.evaluation?.final_score;

                      return (
                        <button
                          key={run.id}
                          onClick={() => setActiveTabAgentId(run.agent_id)}
                          className={`text-xs px-3 py-1.5 rounded-md font-mono transition-all flex items-center gap-2 border ${
                            isCurrent
                              ? "bg-white/[0.08] text-white border-white/[0.16] shadow-xs font-medium"
                              : "bg-white/[0.02] text-zinc-400 border-white/[0.04] hover:text-zinc-200 hover:bg-white/[0.04]"
                          }`}
                        >
                          <Bot className={`w-3.5 h-3.5 ${isCurrent ? "text-blue-400" : "text-zinc-500"}`} />
                          <span>{run.agent_name}</span>
                          {score !== null && score !== undefined && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                score >= 80
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : score >= 60
                                  ? "bg-blue-500/10 text-blue-400"
                                  : "bg-rose-500/10 text-rose-400"
                              }`}
                            >
                              {score}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Agent Evaluation & Result Viewer */}
                  {selectedRun && (
                    <div className="space-y-4">
                      {/* Evaluation Score Ribbon (AI-Native) */}
                      {selectedRun.evaluation ? (
                        <div className="bg-[#090a0f] border border-white/[0.08] rounded-lg p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-white/[0.06]">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                                LLM Judge Evaluation
                              </span>
                              <Badge
                                variant={
                                  selectedRun.evaluation.decision === "accepted" ? "success" : "danger"
                                }
                                dot
                              >
                                {selectedRun.evaluation.decision?.toUpperCase() || "REJECTED"}
                              </Badge>
                            </div>

                            <div className="flex items-baseline gap-2">
                              <span className="text-[11px] font-mono text-zinc-500">FINAL SCORE:</span>
                              <span
                                className={`text-xl font-bold font-mono ${
                                  (selectedRun.evaluation.final_score ?? 0) >= 75
                                    ? "text-emerald-400"
                                    : (selectedRun.evaluation.final_score ?? 0) >= 50
                                    ? "text-blue-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {selectedRun.evaluation.final_score ?? 0}
                                <span className="text-xs text-zinc-500">/100</span>
                              </span>
                            </div>
                          </div>

                          {/* 4 Dimension Metrics Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                              <div className="text-[10px] font-mono text-zinc-500 uppercase">
                                Quality (45%)
                              </div>
                              <div className="text-base font-bold font-mono text-zinc-200 mt-0.5">
                                {selectedRun.evaluation.quality_score ?? 0}
                                <span className="text-[11px] text-zinc-500">/100</span>
                              </div>
                            </div>

                            <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                              <div className="text-[10px] font-mono text-zinc-500 uppercase">
                                Accuracy (30%)
                              </div>
                              <div className="text-base font-bold font-mono text-zinc-200 mt-0.5">
                                {selectedRun.evaluation.accuracy_score ?? 0}
                                <span className="text-[11px] text-zinc-500">/100</span>
                              </div>
                            </div>

                            <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                              <div className="text-[10px] font-mono text-zinc-500 uppercase">
                                Latency (15%)
                              </div>
                              <div className="text-base font-bold font-mono text-zinc-200 mt-0.5">
                                {selectedRun.latency_ms ? `${selectedRun.latency_ms.toFixed(0)}ms` : "N/A"}
                              </div>
                            </div>

                            <div className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04]">
                              <div className="text-[10px] font-mono text-zinc-500 uppercase">
                                Cost (10%)
                              </div>
                              <div className="text-base font-bold font-mono text-zinc-200 mt-0.5">
                                {selectedRun.estimated_cost
                                  ? `$${selectedRun.estimated_cost.toFixed(5)}`
                                  : "$0.00"}
                              </div>
                            </div>
                          </div>

                          {/* Judge Feedback & Rationalization Quote Box */}
                          {selectedRun.evaluation.evaluator_feedback && (
                            <div className="mt-3 p-3 rounded-md bg-white/[0.02] border border-white/[0.06] text-xs space-y-1">
                              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400">
                                Evaluator Feedback & Rationalization:
                              </span>
                              <p className="text-zinc-300 leading-relaxed italic font-sans">
                                &ldquo;{selectedRun.evaluation.evaluator_feedback}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 rounded-md bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-zinc-500 flex items-center justify-between">
                          <span>Status: {selectedRun.status.toUpperCase()}</span>
                          {selectedRun.status === "running" && (
                            <span className="text-blue-400 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                              Evaluating in progress...
                            </span>
                          )}
                        </div>
                      )}

                      {/* Agent Response Content */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-400">
                            Agent Output ({selectedRun.agent_name})
                          </span>
                          {selectedRun.response && (
                            <button
                              onClick={() => handleCopy(selectedRun.response!)}
                              className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                            >
                              {copiedResponse ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedResponse ? "Copied" : "Copy Response"}</span>
                            </button>
                          )}
                        </div>

                        <div className="p-4 rounded-md bg-[#08090d] border border-white/[0.08] max-h-[380px] overflow-y-auto text-xs font-mono text-zinc-200 leading-relaxed whitespace-pre-wrap selection:bg-blue-500/20">
                          {selectedRun.response || (
                            <span className="text-zinc-500 italic">No output generated yet.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
