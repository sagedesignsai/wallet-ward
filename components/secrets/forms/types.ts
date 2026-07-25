export type SecretType =
  | "env_var"
  | "password"
  | "api_token"
  | "ssh_keypair"
  | "certificate"
  | "json"
  | "file"
  | "note"

export type SecretFormOutput = {
  name: string
  value: string
  description?: string
  type: SecretType
  metadata?: Record<string, unknown>
}

export type SecretFormProps = {
  onSubmit: (data: SecretFormOutput) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  initialValues?: Partial<SecretFormOutput>
}

export type ValidationError = {
  field: string
  message: string
}
