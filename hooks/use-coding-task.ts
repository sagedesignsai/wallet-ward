"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface CodingSession {
  id: string;
  projectId: string;
  name: string;
  type: string;
  status: "idle" | "running" | "awaiting_approval" | "completed" | "failed";
  prompt: string | null;
  daytonaSandboxId: string | null;
  sandboxUrl: string | null;
  currentTask: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  proposals?: Array<{
    id: string;
    title: string;
    description: string;
    riskLevel: string;
    actionType: string;
    status: string;
  }>;
}

export function useCodingTask(projectId: string) {
  const [sessions, setSessions] = useState<CodingSession[]>([]);
  const [activeSession, setActiveSession] = useState<CodingSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchSessions = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/agents/coding?projectId=${projectId}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = await res.json();
      if (Array.isArray(json.data)) {
        setSessions(json.data);
        setActiveSession((prev) => prev ?? json.data[0]);
      }
    } catch (err) {
      console.error("[useCodingTask] Failed to fetch sessions:", err);
      toast.error("Failed to load coding agent sessions");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const initiateCodingTask = useCallback(
    async (prompt: string, repositoryId?: string, branchName?: string) => {
      if (!projectId || !prompt.trim()) return;
      setIsSubmitting(true);
      try {
        const res = await fetch("/api/agents/coding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            prompt,
            repositoryId,
            branchName,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to start coding task");
        }

        toast.success("Coding task initiated in Daytona Cloud Sandbox!");
        const newSession = json.data.session;
        setSessions((prev) => [newSession, ...prev]);
        setActiveSession(newSession);
        return json.data;
      } catch (err) {
        console.error("[useCodingTask] Error starting task:", err);
        toast.error(err instanceof Error ? err.message : "Failed to start task");
      } finally {
        setIsSubmitting(false);
      }
    },
    [projectId]
  );

  return {
    sessions,
    activeSession,
    setActiveSession,
    isLoading,
    isSubmitting,
    fetchSessions,
    initiateCodingTask,
  };
}
