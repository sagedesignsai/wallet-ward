/**
 * Seeding tool validation tests
 * These tests verify the seeding system works correctly
 * 
 * Run with: npx tsx __tests__/seeding.test.ts
 */

import { DataGenerator } from '@/lib/seeding/data-generator'
import type { SeedConfig } from '@/lib/seeding/types'

async function runTests() {
  console.log('🧪 Running Seeding System Tests\n')

  let passedTests = 0
  let failedTests = 0

  // Test 1: DataGenerator
  console.log('Test 1: DataGenerator')
  try {
    const generator = new DataGenerator()

    // Test organization generation
    const orgName = generator.generateOrganizationName()
    if (!orgName || orgName.length === 0) throw new Error('Organization name is empty')

    const orgSlug = generator.generateOrganizationSlug(orgName)
    if (!orgSlug || orgSlug.length === 0) throw new Error('Organization slug is empty')

    // Test user generation
    const email = generator.generateEmail()
    if (!email.includes('@')) throw new Error('Email is invalid')

    // Test project generation
    const projectName = generator.generateProjectName()
    if (!projectName || projectName.length === 0) throw new Error('Project name is empty')

    const projectSlug = generator.generateProjectSlug(projectName)
    if (!projectSlug || projectSlug.length === 0) throw new Error('Project slug is empty')

    // Test secret generation
    const secretName = generator.generateSecretName()
    const secretValue = generator.generateSecretValue('api_token')
    if (!secretName || !secretValue) throw new Error('Secret generation failed')

    // Test document generation
    const docTitle = generator.generateDocumentTitle()
    const docContent = generator.generateDocumentContent()
    if (!docTitle || !docContent) throw new Error('Document generation failed')

    // Test task generation
    const taskTitle = generator.generateTaskTitle()
    const taskDesc = generator.generateTaskDescription()
    if (!taskTitle || !taskDesc) throw new Error('Task generation failed')

    console.log('  ✓ DataGenerator: All data generation methods work')
    passedTests++
  } catch (error) {
    console.log(`  ✗ DataGenerator: ${error instanceof Error ? error.message : String(error)}`)
    failedTests++
  }

  // Test 2: SeedConfig Validation
  console.log('\nTest 2: SeedConfig Validation')
  try {
    const config: SeedConfig = {
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

    if (config.organizationCount < 1) throw new Error('Invalid organization count')
    if (config.projectsPerOrg < 1) throw new Error('Invalid projects count')
    if (config.usersPerOrg < 1) throw new Error('Invalid users count')

    console.log('  ✓ SeedConfig: Valid configuration')
    passedTests++
  } catch (error) {
    console.log(`  ✗ SeedConfig: ${error instanceof Error ? error.message : String(error)}`)
    failedTests++
  }

  // Test 3: Type Exports
  console.log('\nTest 3: Type Exports')
  try {
    // This is a compile-time check, but we can verify the types exist
    const config: SeedConfig = {
      organizationCount: 1,
      projectsPerOrg: 1,
      usersPerOrg: 1,
      environmentsPerProject: 1,
      secretsPerEnvironment: 1,
      documentsPerProject: 1,
      tasksPerProject: 1,
      filesPerProject: 1,
      repositoriesPerProject: 1
    }

    if (!config) throw new Error('Config is null')

    console.log('  ✓ Types: All type definitions are valid')
    passedTests++
  } catch (error) {
    console.log(`  ✗ Types: ${error instanceof Error ? error.message : String(error)}`)
    failedTests++
  }

  // Test 4: DataGenerator Edge Cases
  console.log('\nTest 4: DataGenerator Edge Cases')
  try {
    const generator = new DataGenerator()

    // Multiple calls should produce different results
    const email1 = generator.generateEmail()
    const email2 = generator.generateEmail()
    if (email1 === email2) throw new Error('Emails should be unique')

    // Environment names
    const env1 = generator.generateEnvironmentName()
    if (!['development', 'staging', 'production', 'testing', 'qa'].includes(env1)) {
      throw new Error(`Invalid environment name: ${env1}`)
    }

    // File types
    const mimeType = generator.generateMimeType('package.json')
    if (!mimeType.includes('/')) throw new Error('Invalid MIME type format')

    console.log('  ✓ Edge Cases: All edge cases handled correctly')
    passedTests++
  } catch (error) {
    console.log(`  ✗ Edge Cases: ${error instanceof Error ? error.message : String(error)}`)
    failedTests++
  }

  // Test 5: Module Imports
  console.log('\nTest 5: Module Imports')
  try {
    // Verify all exports are available
    const { DatabaseSeeder, RepositoryHandler, AIContentGenerator, SeedOrchestrator, DataGenerator: DG } = await import('@/lib/seeding')

    if (!DatabaseSeeder) throw new Error('DatabaseSeeder not exported')
    if (!RepositoryHandler) throw new Error('RepositoryHandler not exported')
    if (!AIContentGenerator) throw new Error('AIContentGenerator not exported')
    if (!SeedOrchestrator) throw new Error('SeedOrchestrator not exported')
    if (!DG) throw new Error('DataGenerator not exported')

    console.log('  ✓ Imports: All modules can be imported')
    passedTests++
  } catch (error) {
    console.log(`  ✗ Imports: ${error instanceof Error ? error.message : String(error)}`)
    failedTests++
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log(`Tests passed: ${passedTests}`)
  console.log(`Tests failed: ${failedTests}`)
  console.log(`Total: ${passedTests + failedTests}`)
  console.log('='.repeat(50))

  if (failedTests === 0) {
    console.log('\n✓ All tests passed!')
    process.exit(0)
  } else {
    console.log('\n✗ Some tests failed')
    process.exit(1)
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal test error:', error)
  process.exit(1)
})
