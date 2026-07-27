"use client";

import { useEffect } from "react";
import { useProjects } from "@/hooks/use-projects";
import { useProjectStore } from "./project-store";

/**
 * Hydrates the active project from localStorage and auto-selects the first
 * project when none is selected. Place at the top of a layout so it runs
 * unconditionally — it renders nothing.
 */
export function ProjectInitializer() {
  const { projects, isLoading } = useProjects();
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);

  // Auto-select first project when projects load and none is selected
  useEffect(() => {
    if (!isLoading && projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, isLoading, activeProjectId, setActiveProjectId]);

  return null;
}
