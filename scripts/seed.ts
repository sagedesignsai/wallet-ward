#!/usr/bin/env node

/**
 * Seed CLI - Execute seeding operations
 * Usage: npx tsx scripts/seed.ts [options]
 */

import { quickSeed } from '@/lib/seeding/orchestrator'
import type { SeedConfig } from '@/lib/seeding/types'

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2)

  // Default configuration
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

  // Parse CLI arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--orgs':
        config.organizationCount = parseInt(args[++i], 10)
        break
      case '--projects':
        config.projectsPerOrg = parseInt(args[++i], 10)
        break
      case '--users':
        config.usersPerOrg = parseInt(args[++i], 10)
        break
      case '--environments':
        config.environmentsPerProject = parseInt(args[++i], 10)
        break
      case '--secrets':
        config.secretsPerEnvironment = parseInt(args[++i], 10)
        break
      case '--documents':
        config.documentsPerProject = parseInt(args[++i], 10)
        break
      case '--tasks':
        config.tasksPerProject = parseInt(args[++i], 10)
        break
      case '--files':
        config.filesPerProject = parseInt(args[++i], 10)
        break
      case '--repos':
        config.repositoriesPerProject = parseInt(args[++i], 10)
        break
      case '--enable-ai':
        config.aiGeneration!.enabled = true
        break
      case '--ai-model':
        config.aiGeneration!.model = args[++i]
        break
      case '--git-repos':
        config.gitRepos = args[++i].split(',').map(url => url.trim())
        break
      case '--help':
        printHelp()
        process.exit(0)
    }
  }

  console.log('🚀 Seed CLI\n')
  console.log('Configuration:')
  console.log(`  Organizations: ${config.organizationCount}`)
  console.log(`  Projects per org: ${config.projectsPerOrg}`)
  console.log(`  Users per org: ${config.usersPerOrg}`)
  console.log(`  Environments per project: ${config.environmentsPerProject}`)
  console.log(`  Secrets per environment: ${config.secretsPerEnvironment}`)
  console.log(`  Documents per project: ${config.documentsPerProject}`)
  console.log(`  Tasks per project: ${config.tasksPerProject}`)
  console.log(`  Files per project: ${config.filesPerProject}`)
  console.log(`  Repositories per project: ${config.repositoriesPerProject}`)
  if (config.aiGeneration?.enabled) {
    console.log(`  AI Generation: enabled (${config.aiGeneration.model || 'default'})`)
  }
  if (config.gitRepos?.length) {
    console.log(`  Git repos: ${config.gitRepos.length}`)
  }
  console.log()

  try {
    const result = await quickSeed(config)

    console.log('\n📊 Results:')
    console.log(`  Organizations created: ${result.stats.organizationsCreated}`)
    console.log(`  Users created: ${result.stats.usersCreated}`)
    console.log(`  Projects created: ${result.stats.projectsCreated}`)
    console.log(`  Environments created: ${result.stats.environmentsCreated}`)
    console.log(`  Secrets created: ${result.stats.secretsCreated}`)
    console.log(`  Documents created: ${result.stats.documentsCreated}`)
    console.log(`  Tasks created: ${result.stats.tasksCreated}`)
    console.log(`  Files created: ${result.stats.filesCreated}`)
    console.log(`  Repositories created: ${result.stats.repositoriesCreated}`)

    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors (${result.errors.length}):`)
      result.errors.forEach(error => console.log(`  - ${error}`))
      process.exit(1)
    } else {
      console.log('\n✓ Seeding completed successfully!')
      process.exit(0)
    }
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

function printHelp() {
  console.log(`
Seed CLI - Generate complete test data for your project

USAGE:
  npx tsx scripts/seed.ts [OPTIONS]

OPTIONS:
  --orgs NUM                Number of organizations to create (default: 2)
  --projects NUM            Projects per organization (default: 3)
  --users NUM               Users per organization (default: 4)
  --environments NUM        Environments per project (default: 2)
  --secrets NUM             Secrets per environment (default: 3)
  --documents NUM           Documents per project (default: 3)
  --tasks NUM               Tasks per project (default: 5)
  --files NUM               Files per project (default: 4)
  --repos NUM               Repositories per project (default: 2)
  --enable-ai               Enable AI-powered content generation
  --ai-model MODEL          AI model to use (requires --enable-ai)
  --git-repos URL1,URL2     Clone and process git repositories
  --help                    Show this help message

EXAMPLES:
  # Quick seed with defaults
  npx tsx scripts/seed.ts

  # Seed with custom counts
  npx tsx scripts/seed.ts --orgs 5 --projects 10 --users 8

  # Enable AI content generation
  npx tsx scripts/seed.ts --enable-ai --ai-model meta-llama/llama-2-7b-chat

  # Process git repositories
  npx tsx scripts/seed.ts --git-repos https://github.com/user/repo1.git,https://github.com/user/repo2.git

  # Full example
  npx tsx scripts/seed.ts --orgs 3 --projects 5 --enable-ai --git-repos https://github.com/user/repo.git
  `)
}

main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
