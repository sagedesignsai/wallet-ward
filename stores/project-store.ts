"use client";

import { create } from "zustand";

const STORAGE_KEY = "flowspace:activeProjectId";

interface ProjectStore {
  activeProjectId: string | null;
  setActiveProjectId: (projectId: string | null) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  activeProjectId:
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null,

  setActiveProjectId: (projectId) => {
    set({ activeProjectId: projectId });
    if (typeof window !== "undefined") {
      if (projectId) {
        localStorage.setItem(STORAGE_KEY, projectId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  },
}));
