/**
 * Main seed orchestrator
 * Coordinates all seeding operations
 */

import { DatabaseSeeder } from './database-seeder'
import { RepositoryHandler } from './repository-handler'
import { AIContentGenerator } from './ai-content-generator'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { SeedConfig, GeneratedData } from './types'

export class SeedOrchestrator {
  private dbSeeder: DatabaseSeeder
  private repoHandler: RepositoryHandler
  private aiGenerator?: AIContentGenerator

  constructor(config?: { enableAI?: boolean; aiModel?: string; aiApiKey?: string }) {
    this.dbSeeder = new DatabaseSeeder()
    this.repoHandler = new RepositoryHandler()

    // Initialize AI generator if enabled and credentials provided
    if (config?.enableAI && config?.aiApiKey) {
      try {
        const provider = createOpenAICompatible({
          name: 'openrouter',
          apiKey: config.aiApiKey,
          baseURL: 'https://openrouter.ai/api/v1'
        } as any)

        const model = provider.languageModel(config.aiModel || 'meta-llama/llama-2-7b-chat')
        this.aiGenerator = new AIContentGenerator(model)
      } catch (error) {
        console.warn('Failed to initialize AI generator:', error)
      }
    }
  }

  async executeSeed(config: SeedConfig): Promise<GeneratedData> {
    console.log('🌱 Starting seed operation...')
    console.log(`Configuration:`, config)

    // Step 1: Handle git repositories if provided
    if (config.gitRepos && config.gitRepos.length > 0) {
      console.log(`📦 Processing ${config.gitRepos.length} repositories...`)
      try {
        for (const repoUrl of config.gitRepos) {
          const repoData = await this.repoHandler.cloneRepository(repoUrl)
          if (repoData && this.aiGenerator) {
            const enriched = await this.aiGenerator.enrichRepositoryData(repoData)
            console.log(`✓ Processed: ${enriched.name}`)
          }
        }
      } catch (error) {
        console.error('Error processing repositories:', error)
      } finally {
        await this.repoHandler.cleanupAll()
      }
    }

    // Step 2: Seed database with entities
    console.log('💾 Seeding database...')
    const result = await this.dbSeeder.seed(config)

    // Step 3: AI enrichment (optional)
    if (this.aiGenerator && config.aiGeneration?.enabled) {
      console.log('🤖 Enriching with AI-generated content...')
      // This would involve querying the database and enriching specific records
      // Implementation depends on specific needs
    }

    console.log('✓ Seeding complete!')
    return result
  }

  async cleanupRepositories(): Promise<void> {
    await this.repoHandler.cleanupAll()
  }
}

/**
 * Quick seed function for CLI usage
 */
export async function quickSeed(config: SeedConfig) {
  const orchestrator = new SeedOrchestrator({
    enableAI: config.aiGeneration?.enabled || false,
    aiApiKey: process.env.OPENROUTER_API_KEY
  })

  try {
    const result = await orchestrator.executeSeed(config)
    return result
  } finally {
    await orchestrator.cleanupRepositories()
  }
}
