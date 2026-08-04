/**
 * API endpoint for seeding operations
 * POST /api/admin/seed
 * 
 * Requires:
 * - Admin role
 * - Proper authorization
 */

import { NextRequest, NextResponse } from 'next/server'
import { SeedOrchestrator } from '@/lib/seeding/orchestrator'
import type { SeedConfig } from '@/lib/seeding/types'

/**
 * POST /api/admin/seed
 * Execute seeding operation
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add proper authentication and authorization
    // This is a placeholder - implement your auth logic
    const isAdmin = true // Replace with actual auth check

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can execute seed operations' },
        { status: 403 }
      )
    }

    const body: SeedConfig = await request.json()

    // Validate configuration
    if (!body.organizationCount || body.organizationCount < 1) {
      return NextResponse.json(
        { error: 'organizationCount must be at least 1' },
        { status: 400 }
      )
    }

    if (!body.projectsPerOrg || body.projectsPerOrg < 1) {
      return NextResponse.json(
        { error: 'projectsPerOrg must be at least 1' },
        { status: 400 }
      )
    }

    // Initialize orchestrator
    const orchestrator = new SeedOrchestrator({
      enableAI: body.aiGeneration?.enabled || false,
      aiApiKey: process.env.OPENROUTER_API_KEY
    })

    try {
      // Execute seeding
      const result = await orchestrator.executeSeed(body)

      return NextResponse.json(
        {
          success: result.success,
          message: result.message,
          stats: result.stats,
          errors: result.errors
        },
        { status: result.success ? 200 : 207 }
      )
    } finally {
      // Cleanup
      await orchestrator.cleanupRepositories()
    }
  } catch (error) {
    console.error('Seed API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        stats: {
          organizationsCreated: 0,
          projectsCreated: 0,
          usersCreated: 0,
          environmentsCreated: 0,
          secretsCreated: 0,
          documentsCreated: 0,
          tasksCreated: 0,
          filesCreated: 0,
          repositoriesCreated: 0
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/seed
 * Get seeding status and configuration options
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add proper authentication and authorization
    const isAdmin = true // Replace with actual auth check

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can access seed operations' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      available: true,
      features: {
        aiGeneration: !!process.env.OPENROUTER_API_KEY,
        gitRepositories: true
      },
      defaultConfig: {
        organizationCount: 2,
        projectsPerOrg: 3,
        usersPerOrg: 4,
        environmentsPerProject: 2,
        secretsPerEnvironment: 3,
        documentsPerProject: 3,
        tasksPerProject: 5,
        filesPerProject: 4,
        repositoriesPerProject: 2
      }
    })
  } catch (error) {
    console.error('Seed GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seed configuration' },
      { status: 500 }
    )
  }
}
