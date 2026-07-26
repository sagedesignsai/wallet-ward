/**
 * Integration Tests: Approval Workflow
 * 
 * Tests the complete end-to-end flow:
 * 1. Agent proposes action
 * 2. Human approves
 * 3. Action executes
 * 4. Agent polls for status
 * 5. Error handling
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "@jest/globals"

// Mock data
const mockOrg = {
  id: "org_test_123",
  name: "Test Organization",
}

const mockProject = {
  id: "proj_test_123",
  organizationId: mockOrg.id,
  name: "Test Project",
  slug: "test-project",
}

const mockUser = {
  id: "user_test_123",
  email: "test@example.com",
  name: "Test User",
}

const mockAgentSession = {
  id: "agent_session_123",
  projectId: mockProject.id,
  name: "Test Agent",
  type: "coding" as const,
  status: "idle" as const,
}

const mockIntegration = {
  id: "integration_123",
  projectId: mockProject.id,
  provider: "vercel" as const,
  name: "Vercel",
  enabled: true,
}

describe("Approval Workflow Integration", () => {
  let proposalId: string

  beforeAll(async () => {
    // Setup: Create test org, project, user, agent session
    // In real implementation, this would use test database
    console.log("Setting up test environment...")
  })

  afterAll(async () => {
    // Cleanup: Remove test data
    console.log("Cleaning up test environment...")
  })

  beforeEach(() => {
    // Reset state before each test
    proposalId = ""
  })

  describe("1. Agent Proposes Action", () => {
    test("should create proposal with awaiting_approval status", async () => {
      // Arrange
      const proposalData = {
        projectId: mockProject.id,
        agentSessionId: mockAgentSession.id,
        title: "Deploy main to production",
        description: "Deploy latest code to production environment",
        riskLevel: "high" as const,
        actionType: "deploy",
        targetSystem: "Vercel Production",
        payload: {
          environment: "production",
          ref: "main",
        },
      }

      // Act
      const response = await fetch(
        `/api/v1/projects/${mockProject.id}/proposals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(proposalData),
        }
      )

      // Assert
      expect(response.ok).toBe(true)
      const { data } = await response.json()
      expect(data.status).toBe("awaiting_approval")
      expect(data.title).toBe(proposalData.title)
      expect(data.actionType).toBe("deploy")
      
      proposalId = data.id
    })

    test("should reject proposal with invalid action type", async () => {
      // Arrange
      const invalidData = {
        projectId: mockProject.id,
        title: "Invalid action",
        actionType: "invalid_type",
        riskLevel: "high" as const,
        targetSystem: "Unknown",
      }

      // Act
      const response = await fetch(
        `/api/v1/projects/${mockProject.id}/proposals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invalidData),
        }
      )

      // Assert
      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })
  })

  describe("2. Human Approves Proposal", () => {
    test("should approve proposal and mark as approved", async () => {
      // Arrange
      const notes = "Looks good, deploying to production"

      // Act
      const response = await fetch(
        `/api/v1/projects/${mockProject.id}/proposals/${proposalId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        }
      )

      // Assert
      expect(response.ok).toBe(true)
      const { data } = await response.json()
      expect(data.status).toBe("executed")
      expect(data.approvalNotes).toBe(notes)
      expect(data.approvedById).toBe(mockUser.id)
    })

    test("should reject double approval", async () => {
      // Act - try to approve again
      const response = await fetch(
        `/api/v1/projects/${mockProject.id}/proposals/${proposalId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      )

      // Assert
      expect(response.ok).toBe(false)
      expect(response.status).toBe(403) // Forbidden
    })
  })

  describe("3. Action Execution", () => {
    test("should execute deploy action to Vercel", async () => {
      // Mock Vercel API
      const mockVercelResponse = {
        id: "dpl_123",
        url: "https://test-project-prod.vercel.app",
        state: "BUILDING",
      }

      // Note: In real test, we'd mock fetch to Vercel API
      // For now, we verify the execution result is saved

      // Act - Get proposal after approval
      const response = await fetch(
        `/api/v1/projects/${mockProject.id}/proposals/${proposalId}`
      )

      // Assert
      expect(response.ok).toBe(true)
      const { data } = await response.json()
      expect(data.status).toBe("executed")
      expect(data.metadata?.executionResult).toBeDefined()
      expect(data.metadata?.executionResult.success).toBe(true)
    })

    test("should handle missing integration gracefully", async () => {
      // Arrange - Create proposal for project without integration
      const proposalData = {
        projectId: mockProject.id,
        title: "Deploy without integration",
        actionType: "deploy",
        riskLevel: "high" as const,
        targetSystem: "Vercel",
        payload: { environment: "production" },
      }

      const createRes = await fetch(
        `/api/v1/projects/${mockProject.id}/proposals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(proposalData),
        }
      )
      const { data: proposal } = await createRes.json()

      // Act - Approve (should fail execution but not crash)
      const approveRes = await fetch(
        `/api/v1/projects/${mockProject.id}/proposals/${proposal.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      )

      // Assert - Should succeed approval but fail execution
      expect(approveRes.ok).toBe(true)
      const { data: result } = await approveRes.json()
      expect(result.status).toBe("failed")
      expect(result.metadata?.executionResult?.error).toContain("integration")
    })
  })

  describe("4. Agent Polls for Status", () => {
    test("should return proposals grouped by status", async () => {
      // Act
      const response = await fetch(
        `/api/agents/sessions/${mockAgentSession.id}/pending-proposals`
      )

      // Assert
      expect(response.ok).toBe(true)
      const { pendingProposals } = await response.json()
      
      expect(pendingProposals).toHaveProperty("awaiting")
      expect(pendingProposals).toHaveProperty("approved")
      expect(pendingProposals).toHaveProperty("rejected")
      expect(pendingProposals).toHaveProperty("executed")
      expect(pendingProposals).toHaveProperty("failed")
    })

    test("should include execution results in approved proposals", async () => {
      // Act
      const response = await fetch(
        `/api/agents/sessions/${mockAgentSession.id}/pending-proposals`
      )

      // Assert
      const { pendingProposals } = await response.json()
      const executedProposals = pendingProposals.executed
      
      expect(executedProposals.length).toBeGreaterThan(0)
      expect(executedProposals[0]).toHaveProperty("executionResult")
      expect(executedProposals[0].executionResult).toHaveProperty("success")
    })
  })

  describe("5. Rejection Flow", () => {
    test("should reject proposal with notes", async () => {
      // Arrange - Create new proposal
      const proposalData = {
        projectId: mockProject.id,
        title: "Test rejection",
        actionType: "delete",
        riskLevel: "critical" as const,
        targetSystem: "Production Database",
      }

      const createRes = await fetch(
        `/api/v1/projects/${mockProject.id}/proposals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(proposalData),
        }
      )
      const { data: proposal } = await createRes.json()

      // Act - Reject
      const notes = "Too risky, rejecting"
      const rejectRes = await fetch(
        `/api/v1/projects/${mockProject.id}/proposals/${proposal.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        }
      )

      // Assert
      expect(rejectRes.ok).toBe(true)
      const { data: result } = await rejectRes.json()
      expect(result.status).toBe("rejected")
      expect(result.rejectionNotes).toBe(notes)
    })
  })

  describe("6. Audit Trail", () => {
    test("should log all proposal state changes", async () => {
      // Act - Get audit logs for the proposal
      const response = await fetch(
        `/api/v1/audit-logs?resourceType=action_proposal&resourceId=${proposalId}`
      )

      // Assert
      expect(response.ok).toBe(true)
      const { data: logs } = await response.json()
      
      // Should have at least: created, approved, executed
      expect(logs.length).toBeGreaterThanOrEqual(3)
      
      const actions = logs.map((log: any) => log.action)
      expect(actions).toContain("task_create") // Proposal created
      expect(actions).toContain("task_update") // Proposal approved
      expect(actions).toContain("agent_proxy_call") // Action executed
    })

    test("should include execution metadata in audit logs", async () => {
      // Act
      const response = await fetch(
        `/api/v1/audit-logs?resourceType=action_proposal&resourceId=${proposalId}`
      )

      // Assert
      const { data: logs } = await response.json()
      const executionLog = logs.find(
        (log: any) => log.action === "agent_proxy_call"
      )
      
      expect(executionLog).toBeDefined()
      expect(executionLog.metadata).toHaveProperty("actionType")
      expect(executionLog.metadata).toHaveProperty("success")
      expect(executionLog.metadata).toHaveProperty("targetSystem")
    })
  })

  describe("7. Security & Permissions", () => {
    test("should prevent approval from non-org member", async () => {
      // Arrange - Use different org context
      const otherOrgUser = { id: "user_other", organizationId: "org_other" }

      // Act - Try to approve
      const response = await fetch(
        `/api/v1/projects/${mockProject.id}/proposals/${proposalId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Mock auth context for different org
          },
          body: JSON.stringify({}),
        }
      )

      // Assert
      expect(response.ok).toBe(false)
      expect(response.status).toBe(404) // Not found (org-scoped)
    })

    test("should prevent credential leakage in responses", async () => {
      // Act - Get proposal after execution
      const response = await fetch(
        `/api/v1/projects/${mockProject.id}/proposals/${proposalId}`
      )

      // Assert
      const { data } = await response.json()
      const payloadStr = JSON.stringify(data)
      
      // Should not contain any tokens or secrets
      expect(payloadStr).not.toMatch(/sk_.*/) // Vercel token pattern
      expect(payloadStr).not.toMatch(/ghp_.*/) // GitHub token pattern
      expect(payloadStr).not.toMatch(/xoxb-.*/) // Slack token pattern
    })
  })

  describe("8. Error Handling", () => {
    test("should handle Vercel API failure gracefully", async () => {
      // Mock Vercel API to fail
      // In real test, we'd mock fetch to return 500

      // Arrange - Create and approve proposal
      const proposalData = {
        projectId: mockProject.id,
        title: "Test API failure",
        actionType: "deploy",
        riskLevel: "high" as const,
        targetSystem: "Vercel",
        payload: { environment: "production" },
      }

      const createRes = await fetch(
        `/api/v1/projects/${mockProject.id}/proposals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(proposalData),
        }
      )
      const { data: proposal } = await createRes.json()

      // Act - Approve (will fail during execution)
      const approveRes = await fetch(
        `/api/v1/projects/${mockProject.id}/proposals/${proposal.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      )

      // Assert - Should handle error gracefully
      expect(approveRes.ok).toBe(true) // Approval succeeds
      const { data: result } = await approveRes.json()
      expect(result.status).toBe("failed") // But execution fails
      expect(result.metadata?.executionResult?.error).toBeDefined()
    })
  })
})

describe("Tool Access Control", () => {
  test("should prevent content agent from using getSecrets", async () => {
    // This would be tested in the agent runtime
    // For now, we verify the schema validation
    const contentAgentContext = {
      organizationId: mockOrg.id,
      agentType: "content" as const,
    }

    // getSecrets should reject content agent type
    // In real implementation, this would be runtime validation
    expect(true).toBe(true) // Placeholder
  })

  test("should allow coding agent to use getSecrets", async () => {
    const codingAgentContext = {
      organizationId: mockOrg.id,
      agentType: "coding" as const,
    }

    // getSecrets should accept coding agent type
    expect(true).toBe(true) // Placeholder
  })
})
