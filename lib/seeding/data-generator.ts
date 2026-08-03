/**
 * Generates realistic seed data for database entities
 */

import { nanoid } from 'nanoid'

export class DataGenerator {
  private adjectives = [
    'agile', 'brilliant', 'creative', 'dynamic', 'elegant',
    'fast', 'global', 'innovative', 'keen', 'leading'
  ]

  private nouns = [
    'Analytics', 'Bridge', 'Cloud', 'Dash', 'Engine',
    'Flow', 'Gateway', 'Hub', 'Interface', 'Jetstream'
  ]

  private descriptions = [
    'A modern cloud-native platform for distributed systems',
    'Enterprise-grade solution with real-time synchronization',
    'Secure, scalable infrastructure for microservices',
    'Next-generation automation framework',
    'AI-powered analytics and insights platform'
  ]

  generateUserId(): string {
    return nanoid()
  }

  generateOrganizationName(): string {
    const adj = this.adjectives[Math.floor(Math.random() * this.adjectives.length)]
    const noun = this.nouns[Math.floor(Math.random() * this.nouns.length)]
    return `${adj}-${noun}`
  }

  generateOrganizationSlug(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-')
  }

  generateProjectName(): string {
    const prefix = ['api', 'web', 'mobile', 'service', 'core', 'platform']
    const suffix = ['server', 'client', 'gateway', 'worker', 'engine']
    return `${prefix[Math.floor(Math.random() * prefix.length)]}-${suffix[Math.floor(Math.random() * suffix.length)]}`
  }

  generateProjectSlug(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  generateProjectDescription(): string {
    return this.descriptions[Math.floor(Math.random() * this.descriptions.length)]
  }

  generateEnvironmentName(): string {
    const envs = ['development', 'staging', 'production', 'testing', 'qa']
    return envs[Math.floor(Math.random() * envs.length)]
  }

  generateEmail(): string {
    return `user-${nanoid(8)}@example.com`
  }

  generateSecretName(): string {
    const prefixes = ['api', 'db', 'oauth', 'jwt', 'stripe', 'aws', 'github']
    const suffixes = ['token', 'key', 'secret', 'password', 'credential']
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}_${suffixes[Math.floor(Math.random() * suffixes.length)]}`
  }

  generateSecretValue(type: string): string {
    switch (type) {
      case 'api_token':
        return `sk_test_${nanoid(32)}`
      case 'password':
        return nanoid(24)
      case 'ssh_keypair':
        return `-----BEGIN RSA PRIVATE KEY-----\n${nanoid(64)}\n-----END RSA PRIVATE KEY-----`
      case 'json':
        return JSON.stringify({ 
          access_key: nanoid(16),
          secret_key: nanoid(32),
          region: 'us-east-1'
        })
      default:
        return nanoid(32)
    }
  }

  generateDocumentTitle(): string {
    const templates = [
      'API Documentation',
      'Architecture Overview',
      'Setup Guide',
      'Deployment Instructions',
      'Contributing Guidelines',
      'Security Policy',
      'Release Notes'
    ]
    return templates[Math.floor(Math.random() * templates.length)]
  }

  generateDocumentContent(): string {
    const templates = [
      '# Getting Started\n\nThis document provides an overview of the system architecture and how to get started with development.',
      '# API Reference\n\n## Endpoints\n\n- GET /api/users\n- POST /api/projects\n- DELETE /api/resources/{id}',
      '# Configuration Guide\n\nEnvironment variables required for deployment:\n- DATABASE_URL\n- API_TOKEN\n- FEATURE_FLAGS',
      '# Troubleshooting\n\nCommon issues and solutions:\n1. Connection timeouts\n2. Authentication failures\n3. Rate limiting'
    ]
    return templates[Math.floor(Math.random() * templates.length)]
  }

  generateTaskTitle(): string {
    const tasks = [
      'Implement authentication flow',
      'Optimize database queries',
      'Add error handling',
      'Write unit tests',
      'Review pull request',
      'Setup CI/CD pipeline',
      'Document API endpoints',
      'Performance monitoring'
    ]
    return tasks[Math.floor(Math.random() * tasks.length)]
  }

  generateTaskDescription(): string {
    const descriptions = [
      'This task involves implementing core functionality for the system',
      'Focus on improving performance and reducing latency',
      'Ensure comprehensive test coverage',
      'Document the implementation and add comments'
    ]
    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }

  generateFileName(): string {
    const names = [
      'package.json',
      'README.md',
      'schema.sql',
      'docker-compose.yml',
      'tsconfig.json',
      '.env.example',
      'Dockerfile'
    ]
    return names[Math.floor(Math.random() * names.length)]
  }

  generateMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'json': 'application/json',
      'md': 'text/markdown',
      'sql': 'text/plain',
      'yml': 'text/yaml',
      'ts': 'text/typescript',
      'tsx': 'text/typescript',
      'env': 'text/plain'
    }
    return mimeTypes[ext || ''] || 'application/octet-stream'
  }

  generateRepositoryDescription(): string {
    const descriptions = [
      'Core microservice for user management',
      'Real-time data processing pipeline',
      'Frontend application with React',
      'Backend API server',
      'Data analysis and reporting service'
    ]
    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }

  generateRandomStatus<T extends readonly any[]>(statuses: T): T[number] {
    return statuses[Math.floor(Math.random() * statuses.length)]
  }
}
