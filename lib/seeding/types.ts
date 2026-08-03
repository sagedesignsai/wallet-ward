/**
 * Core types for the seeding system
 */

export interface SeedConfig {
  organizationCount: number
  projectsPerOrg: number
  usersPerOrg: number
  environmentsPerProject: number
  secretsPerEnvironment: number
  documentsPerProject: number
  tasksPerProject: number
  filesPerProject: number
  repositoriesPerProject: number
  aiGeneration?: {
    enabled: boolean
    provider?: string
    model?: string
  }
  gitRepos?: string[]
}

export interface SeedContext {
  organizationIds: string[]
  userIds: string[]
  projectIds: Map<string, string[]>
  environmentIds: Map<string, string[]>
  secretIds: Map<string, string[]>
}

export interface GeneratedData {
  success: boolean
  message: string
  stats: {
    organizationsCreated: number
    projectsCreated: number
    usersCreated: number
    environmentsCreated: number
    secretsCreated: number
    documentsCreated: number
    tasksCreated: number
    filesCreated: number
    repositoriesCreated: number
  }
  errors: string[]
}

export interface RepositoryData {
  name: string
  description: string
  files: RepositoryFile[]
}

export interface RepositoryFile {
  path: string
  content: string
  type: string
}
