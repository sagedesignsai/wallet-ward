import type { RepositoryProvider, RepositoryAccessType } from "@prisma/client"

export type RepositoryFormOutput = {
  name: string
  url: string
  description?: string
  provider: RepositoryProvider
  branch?: string
  accessType: RepositoryAccessType
}

export type RepositoryFormProps = {
  onSubmit: (data: RepositoryFormOutput) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  initialValues?: Partial<RepositoryFormOutput>
  /**
   * Overrides the auto-detected edit mode (auto: true when `initialValues.url`
   * is set). The create page passes `false` so a pre-filled form still shows
   * the "Connect Repository" action instead of "Save Changes".
   */
  isEditing?: boolean
}

/** A project-level integration (GitHub, GitLab, ...) from the integrations API. */
export type ProjectIntegration = {
  id: string
  projectId: string
  provider: string
  name: string
  metadata: unknown
  enabled: boolean
  createdAt: string
  updatedAt: string
}

/** A repository row from the GitHub API (`/user/repos`), passed through by the GitHub integration route. */
export type GitHubRepo = {
  id: number
  name: string
  full_name: string
  html_url: string
  clone_url: string
  private: boolean
  default_branch: string
  description: string | null
  fork: boolean
  updated_at: string
}
