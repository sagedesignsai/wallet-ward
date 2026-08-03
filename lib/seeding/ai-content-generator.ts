/**
 * AI-powered content generator
 * Uses AI SDK for dynamic, contextual data generation
 */

import { generateText } from 'ai'
import type { LanguageModel } from 'ai'
import type { RepositoryData } from './types'

export class AIContentGenerator {
  private model: LanguageModel

  constructor(model: LanguageModel) {
    this.model = model
  }

  async generateProjectDescription(projectName: string, repositoryData?: RepositoryData): Promise<string> {
    const context = repositoryData
      ? `The project is related to a repository named "${repositoryData.name}" which does: ${repositoryData.description}`
      : `The project is named: ${projectName}`

    const prompt = `Generate a concise, professional 2-3 sentence project description for a software project. ${context}. The description should be suitable for a project management dashboard.`

    try {
      const result = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7
      })
      return result.text
    } catch (error) {
      console.error('Error generating project description:', error)
      return `Professional project: ${projectName}`
    }
  }

  async generateDocumentContent(title: string, context?: Record<string, string>): Promise<string> {
    const contextStr = context
      ? Object.entries(context)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')
      : ''

    const prompt = `Generate a realistic markdown document with the title "${title}".
${contextStr ? `Context:\n${contextStr}` : ''}

The document should:
- Start with a markdown header
- Include 2-3 sections with realistic content
- Be suitable for a software project documentation
- Be between 150-300 words

Return ONLY the markdown content, no additional text.`

    try {
      const result = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7
      })
      return result.text
    } catch (error) {
      console.error('Error generating document content:', error)
      return `# ${title}\n\nThis is an auto-generated document section.\n\n## Overview\n\nPlaceholder content for demonstration.`
    }
  }

  async generateTaskDescriptions(taskTitle: string, projectContext?: Record<string, string>): Promise<string> {
    const contextStr = projectContext
      ? Object.entries(projectContext)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')
      : ''

    const prompt = `Generate a detailed, actionable task description for: "${taskTitle}".
${contextStr ? `Project context:\n${contextStr}` : ''}

The description should:
- Be 1-2 paragraphs
- Include acceptance criteria if applicable
- Be practical and specific
- Be suitable for a task management system

Return ONLY the description, no additional text.`

    try {
      const result = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7
      })
      return result.text
    } catch (error) {
      console.error('Error generating task description:', error)
      return `Complete the following task: ${taskTitle}`
    }
  }

  async enrichRepositoryData(repoData: RepositoryData): Promise<RepositoryData> {
    try {
      // Enhance description
      const enhancedDescription = await generateText({
        model: this.model,
        prompt: `Improve this repository description to be more informative and professional: "${repoData.description}". Keep it to 1-2 sentences.`,
        temperature: 0.7
      })

      return {
        ...repoData,
        description: enhancedDescription.text
      }
    } catch (error) {
      console.error('Error enriching repository data:', error)
      return repoData
    }
  }

  async generateProjectTags(projectName: string, description: string): Promise<string[]> {
    const prompt = `Given a project named "${projectName}" with description "${description}", generate 5 relevant technology/category tags. 
Return ONLY a JSON array of strings, like: ["tag1", "tag2", "tag3", "tag4", "tag5"]`

    try {
      const result = await generateText({
        model: this.model,
        prompt,
        temperature: 0.7
      })

      const parsed = JSON.parse(result.text)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('Error generating tags:', error)
      return ['auto-generated', 'seed-data']
    }
  }
}
