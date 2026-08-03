/**
 * Seeding Tool Examples
 * Demonstrates different usage patterns
 */

import { SeedOrchestrator, DatabaseSeeder, RepositoryHandler, DataGenerator } from '@/lib/seeding'
import type { SeedConfig } from '@/lib/seeding/types'

/**
 * Example 1: Basic seeding with CLI
 * Run: npx tsx scripts/seed.ts
 */
export const basicSeedingExample = {
  name: 'Basic Seeding',
  description: 'Creates 2 organizations with 3 projects each',
  command: 'npx tsx scripts/seed.ts',
  config: {
    organizationCount: 2,
    projectsPerOrg: 3,
    usersPerOrg: 4,
    environmentsPerProject: 2,
    secretsPerEnvironment: 3,
    documentsPerProject: 3,
    tasksPerProject: 5,
    filesPerProject: 4,
    repositoriesPerProject: 2
  } as SeedConfig
}

/**
 * Example 2: Large-scale seeding
 * Run: npx tsx scripts/seed.ts --orgs 10 --projects 20 --users 8
 */
export const largeSaleExample = {
  name: 'Large Scale Seeding',
  description: 'Creates 10 organizations with 20 projects each, 8 users per org',
  command: 'npx tsx scripts/seed.ts --orgs 10 --projects 20 --users 8',
  config: {
    organizationCount: 10,
    projectsPerOrg: 20,
    usersPerOrg: 8,
    environmentsPerProject: 3,
    secretsPerEnvironment: 5,
    documentsPerProject: 5,
    tasksPerProject: 10,
    filesPerProject: 8,
    repositoriesPerProject: 3
  } as SeedConfig
}

/**
 * Example 3: AI-powered content generation
 * Run: npx tsx scripts/seed.ts --enable-ai --ai-model meta-llama/llama-2-7b-chat
 * Requires: OPENROUTER_API_KEY set in environment
 */
export const aiPoweredExample = {
  name: 'AI-Powered Seeding',
  description: 'Generates realistic descriptions and content using AI',
  command: 'npx tsx scripts/seed.ts --enable-ai --ai-model meta-llama/llama-2-7b-chat',
  config: {
    organizationCount: 3,
    projectsPerOrg: 5,
    usersPerOrg: 4,
    environmentsPerProject: 2,
    secretsPerEnvironment: 3,
    documentsPerProject: 4,
    tasksPerProject: 8,
    filesPerProject: 5,
    repositoriesPerProject: 2,
    aiGeneration: {
      enabled: true,
      model: 'meta-llama/llama-2-7b-chat'
    }
  } as SeedConfig
}

/**
 * Example 4: With git repository integration
 * Run: npx tsx scripts/seed.ts --git-repos https://github.com/user/repo1.git,https://github.com/user/repo2.git
 */
export const gitRepoExample = {
  name: 'Git Repository Integration',
  description: 'Clones and processes git repositories as part of seeding',
  command: 'npx tsx scripts/seed.ts --git-repos https://github.com/vercel/next.js.git,https://github.com/facebook/react.git',
  config: {
    organizationCount: 2,
    projectsPerOrg: 3,
    usersPerOrg: 4,
    environmentsPerProject: 2,
    secretsPerEnvironment: 3,
    documentsPerProject: 3,
    tasksPerProject: 5,
    filesPerProject: 4,
    repositoriesPerProject: 2,
    gitRepos: [
      'https://github.com/vercel/next.js.git',
      'https://github.com/facebook/react.git'
    ]
  } as SeedConfig
}

/**
 * Example 5: Programmatic usage with async/await
 */
export async function programmaticSeeding() {
  const config: SeedConfig = {
    organizationCount: 1,
    projectsPerOrg: 2,
    usersPerOrg: 3,
    environmentsPerProject: 2,
    secretsPerEnvironment: 2,
    documentsPerProject: 2,
    tasksPerProject: 3,
    filesPerProject: 2,
    repositoriesPerProject: 1
  }

  const orchestrator = new SeedOrchestrator()
  const result = await orchestrator.executeSeed(config)

  console.log('Seeding result:', result)
  return result
}

/**
 * Example 6: Using individual components
 */
export async function customSeeding() {
  const generator = new DataGenerator()
  const seeder = new DatabaseSeeder()
  const handler = new RepositoryHandler()

  // Generate custom data
  const orgName = generator.generateOrganizationName()
  console.log('Generated org name:', orgName)

  const projectName = generator.generateProjectName()
  console.log('Generated project name:', projectName)

  // Seed database with custom config
  const config: SeedConfig = {
    organizationCount: 1,
    projectsPerOrg: 1,
    usersPerOrg: 2,
    environmentsPerProject: 1,
    secretsPerEnvironment: 2,
    documentsPerProject: 1,
    tasksPerProject: 2,
    filesPerProject: 1,
    repositoriesPerProject: 1
  }

  const result = await seeder.seed(config)
  console.log('Seeding stats:', result.stats)

  // Optional: Process git repos
  const repoData = await handler.cloneRepository(
    'https://github.com/vercel/ai.git',
    'main'
  )

  if (repoData) {
    console.log('Repository:', repoData.name)
    console.log('Files extracted:', repoData.files.length)
  }

  await handler.cleanupAll()

  return result
}

/**
 * Example 7: API endpoint usage
 */
export async function apiSeeding() {
  const config: SeedConfig = {
    organizationCount: 2,
    projectsPerOrg: 3,
    usersPerOrg: 4,
    environmentsPerProject: 2,
    secretsPerEnvironment: 3,
    documentsPerProject: 3,
    tasksPerProject: 5,
    filesPerProject: 4,
    repositoriesPerProject: 2,
    aiGeneration: {
      enabled: false
    }
  }

  const response = await fetch('http://localhost:3000/api/admin/seed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_AUTH_TOKEN'
    },
    body: JSON.stringify(config)
  })

  const result = await response.json()
  console.log('API result:', result)
  return result
}

/**
 * Example 8: Minimal seed for quick testing
 * Run: npx tsx scripts/seed.ts --orgs 1 --projects 1 --users 2 --environments 1 --secrets 1
 */
export const minimalSeedExample = {
  name: 'Minimal Seeding',
  description: 'Quick seed with minimal data for rapid testing',
  command: 'npx tsx scripts/seed.ts --orgs 1 --projects 1 --users 2 --environments 1 --secrets 1 --documents 1 --tasks 1 --files 1 --repos 1',
  config: {
    organizationCount: 1,
    projectsPerOrg: 1,
    usersPerOrg: 2,
    environmentsPerProject: 1,
    secretsPerEnvironment: 1,
    documentsPerProject: 1,
    tasksPerProject: 1,
    filesPerProject: 1,
    repositoriesPerProject: 1
  } as SeedConfig
}

/**
 * Example 9: Combined: Large scale + AI + Git repos
 * Run: npx tsx scripts/seed.ts --orgs 5 --projects 10 --enable-ai --git-repos https://github.com/vercel/next.js.git
 */
export const combinedExample = {
  name: 'Combined: Large Scale + AI + Git Repos',
  description: 'Comprehensive seeding with scale, AI, and git integration',
  command: 'npx tsx scripts/seed.ts --orgs 5 --projects 10 --enable-ai --ai-model meta-llama/llama-2-7b-chat --git-repos https://github.com/vercel/next.js.git',
  config: {
    organizationCount: 5,
    projectsPerOrg: 10,
    usersPerOrg: 5,
    environmentsPerProject: 2,
    secretsPerEnvironment: 3,
    documentsPerProject: 3,
    tasksPerProject: 5,
    filesPerProject: 4,
    repositoriesPerProject: 2,
    aiGeneration: {
      enabled: true,
      model: 'meta-llama/llama-2-7b-chat'
    },
    gitRepos: ['https://github.com/vercel/next.js.git']
  } as SeedConfig
}

/**
 * Export all examples as an array
 */
export const seedingExamples = [
  basicSeedingExample,
  largeSaleExample,
  aiPoweredExample,
  gitRepoExample,
  minimalSeedExample,
  combinedExample
]
