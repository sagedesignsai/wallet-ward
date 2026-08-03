/**
 * Repository handler for cloning and processing git repositories
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { readdir, readFile, rm } from 'fs/promises'
import { join, relative } from 'path'
import type { RepositoryData, RepositoryFile } from './types'

const execAsync = promisify(exec)

export class RepositoryHandler {
  private tempDir = '/tmp/seed-repos'
  private maxFileSize = 1024 * 1024 // 1MB
  private includedExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.json',
    '.md', '.yml', '.yaml', '.sql', '.env'
  ]

  async cloneRepository(url: string, branch: string = 'main'): Promise<RepositoryData | null> {
    const repoName = url.split('/').pop()?.replace('.git', '') || 'unknown'
    const clonePath = join(this.tempDir, repoName)

    try {
      // Clone repository
      await execAsync(`git clone --depth 1 --branch ${branch} ${url} ${clonePath}`)

      // Extract repository data
      const files = await this.extractFiles(clonePath)
      
      // Parse repository metadata
      const description = await this.getRepositoryDescription(clonePath)

      // Cleanup
      await this.cleanup(clonePath)

      return {
        name: repoName,
        description,
        files
      }
    } catch (error) {
      console.error(`Error cloning repository ${url}:`, error)
      // Attempt cleanup even if cloning failed
      await this.cleanup(clonePath).catch(() => {})
      return null
    }
  }

  private async extractFiles(dirPath: string): Promise<RepositoryFile[]> {
    const files: RepositoryFile[] = []
    const fileCount = { max: 50 } // Limit files extracted

    const traverse = async (currentPath: string, depth: number = 0) => {
      if (depth > 3 || files.length >= fileCount.max) return

      try {
        const entries = await readdir(currentPath, { withFileTypes: true })

        for (const entry of entries) {
          if (files.length >= fileCount.max) break

          // Skip common non-essential directories
          if (entry.isDirectory()) {
            if (['.git', 'node_modules', '.next', 'dist', 'build', '__pycache__', '.venv'].includes(entry.name)) {
              continue
            }
            await traverse(join(currentPath, entry.name), depth + 1)
          } else {
            // Check file extension
            const hasValidExtension = this.includedExtensions.some(ext => entry.name.endsWith(ext))
            if (!hasValidExtension) continue

            const filePath = join(currentPath, entry.name)
            try {
              const stat = await readdir(currentPath, { withFileTypes: true })
                .then(entries => entries.find(e => e.name === entry.name))
              
              // Check file size
              if (!stat) continue
              
              const content = await readFile(filePath, 'utf-8').catch(() => '')
              
              const relativePath = relative(dirPath, filePath)
              files.push({
                path: relativePath,
                content: content.substring(0, 2000), // Limit content
                type: this.getFileType(entry.name)
              })
            } catch (error) {
              // Skip files that can't be read
              continue
            }
          }
        }
      } catch (error) {
        console.error(`Error traversing ${currentPath}:`, error)
      }
    }

    await traverse(dirPath)
    return files
  }

  private async getRepositoryDescription(dirPath: string): Promise<string> {
    try {
      // Try to read package.json
      const packagePath = join(dirPath, 'package.json')
      const packageContent = await readFile(packagePath, 'utf-8')
      const packageJson = JSON.parse(packageContent)
      return packageJson.description || 'Repository from GitHub'
    } catch {
      try {
        // Try to read README
        const readmePath = join(dirPath, 'README.md')
        const readmeContent = await readFile(readmePath, 'utf-8')
        return readmeContent.split('\n')[0].replace(/^#+\s*/, '')
      } catch {
        return 'Repository imported from GitHub'
      }
    }
  }

  private getFileType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    const typeMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'json': 'config',
      'md': 'document',
      'sql': 'database',
      'yml': 'config',
      'yaml': 'config',
      'env': 'config'
    }
    return typeMap[ext] || 'file'
  }

  private async cleanup(dirPath: string): Promise<void> {
    try {
      await rm(dirPath, { recursive: true, force: true })
    } catch (error) {
      console.error(`Error cleaning up ${dirPath}:`, error)
    }
  }

  async cleanupAll(): Promise<void> {
    await this.cleanup(this.tempDir)
  }
}
