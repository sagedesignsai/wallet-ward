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
}
