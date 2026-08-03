/**
 * Database seeding service
 * Handles creation of all entities with proper relationships
 */

import { prisma } from '@/lib/db'
import { DataGenerator } from './data-generator'
import type { SeedConfig, SeedContext, GeneratedData } from './types'
import { nanoid } from 'nanoid'
import { SecretType } from '@prisma/client'

export class DatabaseSeeder {
  private generator: DataGenerator
  private context: SeedContext

  constructor() {
    this.generator = new DataGenerator()
    this.context = {
      organizationIds: [],
      userIds: [],
      projectIds: new Map(),
      environmentIds: new Map(),
      secretIds: new Map()
    }
  }

  async seed(config: SeedConfig): Promise<GeneratedData> {
    const stats = {
      organizationsCreated: 0,
      projectsCreated: 0,
      usersCreated: 0,
      environmentsCreated: 0,
      secretsCreated: 0,
      documentsCreated: 0,
      tasksCreated: 0,
      filesCreated: 0,
      repositoriesCreated: 0
    }

    const errors: string[] = []

    try {
      // Create organizations
      for (let i = 0; i < config.organizationCount; i++) {
        try {
          const org = await this.createOrganization()
          this.context.organizationIds.push(org.id)
          stats.organizationsCreated++

          // Create users for this organization
          const userIds: string[] = []
          for (let j = 0; j < config.usersPerOrg; j++) {
            const user = await this.createUser()
            this.context.userIds.push(user.id)
            userIds.push(user.id)
            stats.usersCreated++

            // Add as member to organization
            await prisma.member.create({
              data: {
                organizationId: org.id,
                userId: user.id,
                role: j === 0 ? 'owner' : 'member'
              }
            })
          }

          // Create projects for this organization
          const projectIds: string[] = []
          for (let j = 0; j < config.projectsPerOrg; j++) {
            const project = await this.createProject(org.id)
            projectIds.push(project.id)
            stats.projectsCreated++

            // Create environments for this project
            const envIds: string[] = []
            for (let k = 0; k < config.environmentsPerProject; k++) {
              const env = await this.createEnvironment(project.id)
              envIds.push(env.id)
              stats.environmentsCreated++

              // Create secrets for this environment
              for (let m = 0; m < config.secretsPerEnvironment; m++) {
                await this.createSecret(project.id, env.id)
                stats.secretsCreated++
              }
            }
            this.context.environmentIds.set(project.id, envIds)

            // Create documents for this project
            for (let k = 0; k < config.documentsPerProject; k++) {
              await this.createDocument(project.id, userIds[0])
              stats.documentsCreated++
            }

            // Create tasks for this project
            for (let k = 0; k < config.tasksPerProject; k++) {
              await this.createTask(project.id, userIds[Math.floor(Math.random() * userIds.length)])
              stats.tasksCreated++
            }

            // Create files for this project
            for (let k = 0; k < config.filesPerProject; k++) {
              await this.createProjectFile(project.id, userIds[0])
              stats.filesCreated++
            }

            // Create repositories for this project
            for (let k = 0; k < config.repositoriesPerProject; k++) {
              await this.createRepository(project.id)
              stats.repositoriesCreated++
            }
          }
          this.context.projectIds.set(org.id, projectIds)
        } catch (error) {
          errors.push(`Error creating organization ${i}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      return {
        success: errors.length === 0,
        message: `Seeding completed successfully. ${errors.length} errors encountered.`,
        stats,
        errors
      }
    } catch (error) {
      return {
        success: false,
        message: `Fatal error during seeding: ${error instanceof Error ? error.message : String(error)}`,
        stats,
        errors: [
          ...errors,
          error instanceof Error ? error.message : String(error)
        ]
      }
    }
  }

  private async createOrganization() {
    const name = this.generator.generateOrganizationName()
    return prisma.organization.create({
      data: {
        id: nanoid(),
        name,
        slug: this.generator.generateOrganizationSlug(name)
      }
    })
  }

  private async createUser() {
    const email = this.generator.generateEmail()
    return prisma.user.create({
      data: {
        id: nanoid(),
        name: email.split('@')[0],
        email,
        emailVerified: true
      }
    })
  }

  private async createProject(organizationId: string) {
    const name = this.generator.generateProjectName()
    return prisma.project.create({
      data: {
        id: nanoid(),
        organizationId,
        name,
        slug: this.generator.generateProjectSlug(name),
        description: this.generator.generateProjectDescription()
      }
    })
  }

  private async createEnvironment(projectId: string) {
    const name = this.generator.generateEnvironmentName()
    const existingCount = await prisma.environment.count({
      where: { projectId }
    })

    return prisma.environment.create({
      data: {
        id: nanoid(),
        projectId,
        name: existingCount > 0 ? `${name}-${existingCount}` : name,
        slug: `${name.toLowerCase()}-${nanoid(4)}`
      }
    })
  }

  private async createSecret(projectId: string, environmentId: string) {
    const secretType = this.generator.generateRandomStatus(['password', 'env_var', 'api_token'] as const)
    const name = this.generator.generateSecretName()
    
    const secret = await prisma.secret.create({
      data: {
        id: nanoid(),
        projectId,
        environmentId,
        name,
        type: secretType as SecretType,
        description: `Auto-generated ${secretType} secret`
      }
    })

    // Create initial version
    await prisma.secretVersion.create({
      data: {
        id: nanoid(),
        secretId: secret.id,
        version: 1,
        ciphertext: nanoid(64),
        iv: nanoid(16),
        authTag: nanoid(16),
        algorithm: 'aes-256-gcm'
      }
    })

    return secret
  }

  private async createDocument(projectId: string, userId: string) {
    return prisma.document.create({
      data: {
        id: nanoid(),
        projectId,
        title: this.generator.generateDocumentTitle(),
        content: this.generator.generateDocumentContent(),
        createdById: userId
      }
    })
  }

  private async createTask(projectId: string, assigneeId?: string) {
    const statuses = ['todo', 'in_progress', 'done'] as const
    return prisma.task.create({
      data: {
        id: nanoid(),
        projectId,
        title: this.generator.generateTaskTitle(),
        description: this.generator.generateTaskDescription(),
        status: this.generator.generateRandomStatus(statuses),
        assigneeId
      }
    })
  }

  private async createProjectFile(projectId: string, userId: string) {
    const fileName = this.generator.generateFileName()
    return prisma.projectFile.create({
      data: {
        id: nanoid(),
        projectId,
        name: fileName,
        path: `/files/${fileName}`,
        type: 'artifact',
        mimeType: this.generator.generateMimeType(fileName),
        size: Math.floor(Math.random() * 1000000) + 1000,
        storageId: nanoid(),
        version: 1,
        tags: ['auto-generated', 'seed-data'],
        createdById: userId
      }
    })
  }

  private async createRepository(projectId: string) {
    const name = this.generator.generateProjectName()
    return prisma.repository.create({
      data: {
        id: nanoid(),
        projectId,
        name: `${name}-repo`,
        description: this.generator.generateRepositoryDescription(),
        provider: 'github',
        url: `https://github.com/example/${name}-repo`,
        branch: 'main',
        accessType: 'private'
      }
    })
  }
}
