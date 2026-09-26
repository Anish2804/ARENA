"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import {
  ListTodo,
  Search,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Bot,
  X,
  Loader2
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

  // New Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPrompt, setNewTaskPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch list of tasks
  const fetchTasks = useCallback(async () => {
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
  }, [selectedTaskId]);

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

  // Filter tasks list — memoized so it only recomputes when deps change
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
      const agentIds = agents.map((a: any) => a.id);

      if (agentIds.length === 0) {
        alert("No agents available to run this task.");
        setIsSubmitting(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: newTaskTitle,
          prompt: newTaskPrompt,
          agent_ids: agentIds
        })
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
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 relative">
      <style>{`
        @keyframes fadeInTask {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      {/* Top Header */}
      <div className="flex justify-between items-end pb-4 border-b border-[#222]">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-[#ededed]">
            Tasks
          </h1>
          <p className="text-[14px] text-[#888] mt-1">
            Monitor and inspect multi-agent task evaluations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTasks}
            className="resend-btn"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="resend-btn-primary"
          >
            <Plus className="w-3.5 h-3.5 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full pb-4">
        {/* Left Pane (4 cols): Searchable Task List */}
        <div className="lg:col-span-4 resend-card flex flex-col h-full overflow-hidden">
          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-[#222] space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#555]" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 resend-input text-[13px]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap items-center gap-2">
              {(["ALL", "COMPLETED", "RUNNING", "FAILED"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 ${
                    statusFilter === filter
                      ? "bg-[#0d2a1a] text-emerald-300 border border-emerald-800"
                      : "bg-[#111] text-[#888] border border-transparent hover:bg-[#1a1a1a] hover:text-[#ededed]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Task Items List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading && tasks.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-[#555]">
                Loading tasks...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-[#555]">
                No matching tasks found.
              </div>
            ) : (
              filteredTasks.map((task, i) => {
                const isSelected = task.id === selectedTaskId;
                return (
                  <button
                    key={task.id}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setActiveTabAgentId(null);
                    }}
                    style={{ animation: `fadeInTask 0.3s ease-out ${i * 0.04}s both` }}
                    className={`w-full text-left p-3 rounded-md transition-all duration-200 flex flex-col gap-2 ${
                      isSelected
                        ? "bg-[#0d1f14] border border-emerald-900/60"
                        : "bg-transparent border border-transparent hover:bg-[#0a0f0b] hover:border-[#1a2a1d]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-[#666]">
                        {task.id.slice(0, 8)}
                      </span>
                      <StatusBadge status={task.status} />
                    </div>

                    <div className="text-[13px] font-medium text-[#ededed] line-clamp-2">
                      {task.title}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane (8 cols): Deep Evaluation Inspector */}
        <div className="lg:col-span-8 resend-card h-full flex flex-col overflow-hidden">
          {!selectedTask ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 text-[#555] space-y-4">
              <ListTodo className="w-8 h-8" />
              <p className="text-[14px]">Select a task from the left to inspect evaluations.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Task Header & Metadata */}
              <div className="p-6 border-b border-[#222] shrink-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-mono text-[#888]">
                      {selectedTask.id}
                    </span>
                    <button
                      onClick={() => handleCopy(selectedTask.id)}
                      className="text-[#555] hover:text-[#ededed] transition-colors"
                      title="Copy Task ID"
                    >
                      {copiedResponse ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <StatusBadge status={selectedTask.status} />
                </div>

                <h2 className="text-[20px] font-semibold text-[#ededed]">
                  {selectedTask.title}
                </h2>

                {/* Prompt */}
                <div className="bg-[#111] rounded-md p-4 border border-[#222]">
                  <div className="text-[11px] uppercase tracking-wider font-medium text-[#888] mb-2">
                    Prompt
                  </div>
                  <p className="text-[13px] font-mono text-[#ededed] leading-relaxed whitespace-pre-wrap">
                    {selectedTask.prompt}
                  </p>
                </div>
              </div>

              {/* Agent Roster Tabs */}
              {selectedTask.runs && selectedTask.runs.length > 0 && (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-[#222] p-4 shrink-0 overflow-x-auto">
                    {selectedTask.runs.map((run) => {
                      const isCurrent = (activeTabAgentId || selectedTask.runs![0].agent_id) === run.agent_id;
                      const score = run.evaluation?.final_score;

                      return (
                        <button
                          key={run.id}
                          onClick={() => setActiveTabAgentId(run.agent_id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 border ${
                            isCurrent
                              ? "bg-[#0d2a1a] text-emerald-300 border-emerald-800"
                              : "bg-transparent text-[#888] border-[#333] hover:text-[#ededed] hover:border-[#555]"
                          }`}
                        >
                          <Bot className="w-3.5 h-3.5" />
                          <span>{run.agent_name}</span>
                          {score !== null && score !== undefined && (
                            <span className="ml-1 opacity-70">
                              {score}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Agent Evaluation View */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {selectedRun && (
                      <div className="space-y-6">
                        {/* Metrics Grid */}
                        {selectedRun.evaluation ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div className="border border-[#222] rounded-md p-4 bg-[#0a0a0a]">
                                <div className="text-[11px] font-medium text-[#888] uppercase tracking-wider mb-2">Score</div>
                                <div className={`text-[24px] font-semibold ${
                                  (selectedRun.evaluation.final_score ?? 0) >= 80 ? 'text-emerald-500' :
                                  (selectedRun.evaluation.final_score ?? 0) >= 50 ? 'text-yellow-500' : 'text-red-500'
                                }`}>
                                  {selectedRun.evaluation.final_score ?? 0}
                                  <span className="text-[14px] text-[#555] ml-1">/100</span>
                                </div>
                              </div>
                              <div className="border border-[#222] rounded-md p-4 bg-[#0a0a0a]">
                                <div className="text-[11px] font-medium text-[#888] uppercase tracking-wider mb-2">Quality</div>
                                <div className={`text-[20px] font-semibold ${
                                  (selectedRun.evaluation.quality_score ?? 0) >= 80 ? 'text-emerald-500' :
                                  (selectedRun.evaluation.quality_score ?? 0) >= 50 ? 'text-yellow-500' : 'text-red-500'
                                }`}>
                                  {selectedRun.evaluation.quality_score ?? 0}
                                </div>
                              </div>
                              <div className="border border-[#222] rounded-md p-4 bg-[#0a0a0a]">
                                <div className="text-[11px] font-medium text-[#888] uppercase tracking-wider mb-2">Latency</div>
                                <div className="text-[16px] font-mono text-[#ededed] mt-1">
                                  {selectedRun.latency_ms ? `${selectedRun.latency_ms.toFixed(0)}ms` : "--"}
                                </div>
                              </div>
                              <div className="border border-[#222] rounded-md p-4 bg-[#0a0a0a]">
                                <div className="text-[11px] font-medium text-[#888] uppercase tracking-wider mb-2">Cost</div>
                                <div className="text-[16px] font-mono text-[#ededed] mt-1">
                                  {selectedRun.estimated_cost
                                    ? `$${selectedRun.estimated_cost.toFixed(5)}`
                                    : "--"}
                                </div>
                              </div>

                              {/* Feedback */}
                              {selectedRun.evaluation.evaluator_feedback && (
                                <div className="col-span-2 sm:col-span-4 border border-[#222] rounded-md p-4 bg-[#0a0a0a]">
                                  <div className="text-[11px] font-medium text-[#888] uppercase tracking-wider mb-2">Evaluator Feedback</div>
                                  <div className="text-[13px] text-[#ededed] leading-relaxed">
                                    {selectedRun.evaluation.evaluator_feedback}
                                  </div>
                                </div>
                              )}
                            </div>
                        ) : (
                          <div className="border border-[#222] rounded-md p-4 text-[13px] text-[#888]">
                            Evaluation pending or in progress...
                          </div>
                        )}

                        {/* Agent Output */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-medium text-[#ededed]">Agent Output</span>
                          </div>
                          <div className="bg-[#111] border border-[#222] rounded-md p-5 text-[13px] font-mono text-[#ededed] leading-relaxed whitespace-pre-wrap">
                            {selectedRun.response || <span className="text-[#555]">No output generated yet.</span>}
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

      {/* New Task Modal overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="resend-card w-full max-w-lg p-6 animate-slide-up shadow-2xl relative border-[#333]">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#888] hover:text-[#ededed] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-[20px] font-semibold text-[#ededed] mb-2">Create New Task</h2>
            <p className="text-[14px] text-[#888] mb-6">
              Dispatch a prompt to all registered agents in the cluster.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#888] mb-2 uppercase tracking-wider">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Fetch HackerNews headlines"
                  className="w-full resend-input"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#888] mb-2 uppercase tracking-wider">
                  Task Prompt
                </label>
                <textarea
                  value={newTaskPrompt}
                  onChange={(e) => setNewTaskPrompt(e.target.value)}
                  placeholder="e.g. Write a Python script to scrape the top headlines from HackerNews..."
                  className="w-full h-32 resend-input resize-none"
                  required
                />
              </div>
              
              <div className="flex justify-end pt-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="resend-btn"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="resend-btn-primary"
                  disabled={isSubmitting || !newTaskPrompt.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    "Dispatch Task"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
