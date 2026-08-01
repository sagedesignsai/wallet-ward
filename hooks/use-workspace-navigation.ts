"use client"

import { useRouter } from "nextjs-toploader/app"
import { useCallback } from "react"
import { useWorkspacePanelStore } from "@/stores/workspace-panel-store"
import { useProjectStore } from "@/stores/project-store"
import type { ChatSession } from "@/stores/workspace-panel-store"

interface OpenWorkspaceOptions {
    /** Optional session ID to select before navigating */
    sessionId?: string
    /** Optional project context to attach */
    projectId?: string
    /** Optional environment context to attach */
    environmentId?: string
    /** Optional prompt to auto-send once the workspace panel mounts */
    prompt?: string
}

/**
 * Centralizes all navigation to `/dashboard/workspace`.
 *
 * Replaces the scattered `openChat()` + `launchAgent()` patterns that
 * assumed a panel would appear in-place. Now callers navigate to the
 * dedicated workspace route instead.
 */
export function useWorkspaceNavigation() {
    const router = useRouter()
    const newSession = useWorkspacePanelStore((s) => s.newSession)
    const selectSession = useWorkspacePanelStore((s) => s.selectSession)
    const setPendingPrompt = useWorkspacePanelStore((s) => s.setPendingPrompt)
    const launchAgent = useWorkspacePanelStore((s) => s.launchAgent)
    const openChat = useWorkspacePanelStore((s) => s.openChat)
    const activeProjectId = useProjectStore((s) => s.activeProjectId)

    /**
     * Navigate to the workspace route.
     *
     * - If `sessionId` is provided, selects that session first.
     * - If no `sessionId`, creates a new session (optionally with project/env context)
     *   and navigates to its deep-link.
     */
    const openWorkspace = useCallback(
        (options?: OpenWorkspaceOptions) => {
            const projectId = options?.projectId ?? activeProjectId ?? undefined
            const environmentId = options?.environmentId

            if (options?.sessionId) {
                selectSession(options.sessionId)
                if (options.prompt) setPendingPrompt({ sessionId: options.sessionId, text: options.prompt })
                router.push(`/dashboard/workspace/${options.sessionId}`)
                return
            }

            // Create a new session and deep-link to it
            const sessionId = newSession(projectId, environmentId)
            if (options?.prompt) setPendingPrompt({ sessionId, text: options.prompt })
            openChat()
            router.push(`/dashboard/workspace/${sessionId}`)
        },
        [router, newSession, selectSession, setPendingPrompt, openChat, activeProjectId]
    )

    /**
     * Launch an agent in the workspace.
     *
     * Creates a new agent session with the given type, then navigates
     * to the workspace deep-link for that session.
     */
    const launchAgentInWorkspace = useCallback(
        (agentType: NonNullable<ChatSession["agentType"]>) => {
            const sessionId = launchAgent(agentType)
            router.push(`/dashboard/workspace/${sessionId}`)
        },
        [router, launchAgent]
    )

    return { openWorkspace, launchAgentInWorkspace }
}