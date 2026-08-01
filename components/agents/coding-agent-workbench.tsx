"use client";

import { useState, useEffect } from "react";
import { useCodingTask, type CodingSession } from "@/hooks/use-coding-task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CodeIcon,
  PlayIcon,
  TerminalWindowIcon,
  GlobeIcon,
  GitBranchIcon,
  ShieldCheckIcon,
  CircleNotchIcon,
  CheckCircleIcon,
  CpuIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface CodingAgentWorkbenchProps {
  projectId: string;
  projectName?: string;
  repositories?: Array<{ id: string; name: string; url: string; branch: string }>;
}

export function CodingAgentWorkbench({
  projectId,
  projectName = "Project",
  repositories = [],
}: CodingAgentWorkbenchProps) {
  const {
    sessions,
    activeSession,
    setActiveSession,
    isLoading,
    isSubmitting,
    fetchSessions,
    initiateCodingTask,
  } = useCodingTask(projectId);

  const [prompt, setPrompt] = useState("");
  const [selectedRepoId, setSelectedRepoId] = useState<string>(repositories[0]?.id || "");
  const [activeTab, setActiveTab] = useState<"terminal" | "preview" | "timeline">("terminal");

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleStartTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    const taskPrompt = prompt;
    setPrompt("");
    await initiateCodingTask(taskPrompt, selectedRepoId);
  };

  const metadata = (activeSession?.metadata as Record<string, any>) || {};
  const terminalUrl = metadata.terminalUrl || activeSession?.sandboxUrl;
  const previewUrl = activeSession?.sandboxUrl;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 md:p-6 text-foreground">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-slate-950 border border-blue-500/20 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
            <CpuIcon size={28} weight="duotone" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Coding Task Agent
              </h2>
              <Badge variant="outline" className="border-blue-500/40 text-blue-400 text-xs px-2 py-0.5">
                Daytona Cloud Sandbox
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Autonomous subagent execution loop with OpenCode engine in {projectName}
            </p>
          </div>
        </div>

        {activeSession?.daytonaSandboxId && (
          <div className="flex items-center gap-2 text-xs bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-mono">
              Sandbox: {activeSession.daytonaSandboxId.slice(0, 16)}...
            </span>
          </div>
        )}
      </div>

      {/* Main Grid: Left Controls/Sessions, Right Workspace View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Task Dispatcher & Session List) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Dispatch Task Form */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-lg">
            <h3 className="text-sm font-semibold text-slate-200 mb-3.5 flex items-center gap-2">
              <PlayIcon size={16} className="text-blue-400" /> Dispatch Coding Task
            </h3>
            <form onSubmit={handleStartTask} className="flex flex-col gap-3">
              {repositories.length > 0 && (
                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
                  <GitBranchIcon size={14} className="text-slate-400" />
                  <select
                    value={selectedRepoId}
                    onChange={(e) => setSelectedRepoId(e.target.value)}
                    className="bg-transparent border-none text-slate-300 focus:outline-none w-full"
                  >
                    {repositories.map((r) => (
                      <option key={r.id} value={r.id} className="bg-slate-900 text-slate-200">
                        {r.name} ({r.branch})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Input
                placeholder="e.g. Add JWT auth middleware and unit tests..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isSubmitting}
                className="bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-500 text-sm focus-visible:ring-blue-500"
              />

              <Button
                type="submit"
                disabled={isSubmitting || !prompt.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs h-9 rounded-lg gap-2"
              >
                {isSubmitting ? (
                  <>
                    <CircleNotchIcon size={16} className="animate-spin" /> Provisioning Sandbox...
                  </>
                ) : (
                  <>
                    <CodeIcon size={16} /> Run OpenCode Subagent
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Coding Sessions List */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-lg flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Sessions ({sessions.length})
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-slate-500 gap-2 text-xs">
                <CircleNotchIcon size={18} className="animate-spin" /> Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No active coding sessions yet. Dispatch a task above!
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                {sessions.map((s) => {
                  const isActive = activeSession?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSession(s)}
                      className={cn(
                        "flex flex-col gap-1.5 p-3 rounded-lg text-left transition-all border text-xs",
                        isActive
                          ? "bg-blue-950/40 border-blue-500/40 text-slate-100"
                          : "bg-slate-950/40 border-slate-800/60 hover:bg-slate-900 text-slate-400"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate max-w-[190px]">{s.name}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 border-none capitalize",
                            s.status === "running" && "bg-blue-500/20 text-blue-400",
                            s.status === "completed" && "bg-emerald-500/20 text-emerald-400",
                            s.status === "failed" && "bg-rose-500/20 text-rose-400",
                            s.status === "awaiting_approval" && "bg-amber-500/20 text-amber-400"
                          )}
                        >
                          {s.status}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-500 truncate">
                        {s.prompt || "No prompt specification"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Live Terminal, Web Preview & Execution View) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Button
                variant={activeTab === "terminal" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("terminal")}
                className="gap-1.5 text-xs h-8"
              >
                <TerminalWindowIcon size={16} /> Web Terminal
              </Button>
              <Button
                variant={activeTab === "preview" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("preview")}
                className="gap-1.5 text-xs h-8"
              >
                <GlobeIcon size={16} /> App Preview
              </Button>
              <Button
                variant={activeTab === "timeline" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("timeline")}
                className="gap-1.5 text-xs h-8"
              >
                <CheckCircleIcon size={16} /> Subagent Execution
              </Button>
            </div>

            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono"
              >
                Open External Preview <GlobeIcon size={12} />
              </a>
            )}
          </div>

          {/* Workbench Display Card */}
          <div className="min-h-[460px] rounded-xl bg-slate-950 border border-slate-800 flex flex-col overflow-hidden relative shadow-2xl">
            {activeTab === "terminal" && (
              terminalUrl ? (
                <iframe
                  src={terminalUrl}
                  className="w-full h-[480px] border-none bg-black"
                  title="Daytona Web Terminal"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[480px] text-slate-500 gap-3 p-6 text-center">
                  <TerminalWindowIcon size={40} className="text-slate-600" />
                  <p className="text-sm">No active web terminal session attached.</p>
                  <p className="text-xs text-slate-600 max-w-md">
                    Select an active session or dispatch a coding task to spawn a Daytona Cloud Sandbox with web terminal access.
                  </p>
                </div>
              )
            )}

            {activeTab === "preview" && (
              previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[480px] border-none bg-white"
                  title="App Live Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[480px] text-slate-500 gap-3 p-6 text-center">
                  <GlobeIcon size={40} className="text-slate-600" />
                  <p className="text-sm">No live preview URL available yet.</p>
                  <p className="text-xs text-slate-600 max-w-md">
                    When the coding agent starts a local dev server (port 3000), Daytona will generate a live signed preview URL here.
                  </p>
                </div>
              )
            )}

            {activeTab === "timeline" && (
              <div className="p-6 flex flex-col gap-4 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-2 text-blue-400 font-sans font-semibold">
                  <ShieldCheckIcon size={18} /> Subagent Execution Trace
                </div>
                <div className="flex flex-col gap-2 bg-slate-900/80 p-4 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircleIcon size={16} /> Step 1: Provisioned Daytona Cloud Sandbox ({activeSession?.daytonaSandboxId || "active"})
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircleIcon size={16} /> Step 2: Loaded project repository context & secrets metadata
                  </div>
                  <div className="flex items-center gap-2 text-blue-400">
                    <CircleNotchIcon size={16} className="animate-spin" /> Step 3: OpenCode subagent executing autonomous code generation loop
                  </div>
                </div>

                {activeSession?.proposals && activeSession.proposals.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2.5 font-sans">
                    <h4 className="text-xs font-semibold text-slate-400">Action Proposals Awaiting Approval:</h4>
                    {activeSession.proposals.map((p) => (
                      <div key={p.id} className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-amber-200 text-xs">{p.title}</p>
                          <p className="text-slate-400 text-[11px]">{p.description}</p>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-300 text-[10px]">
                          {p.riskLevel} risk
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
