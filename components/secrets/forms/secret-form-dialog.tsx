"use client"

import { useState, useCallback } from "react"
import {
  KeyIcon,
  LockKeyIcon,
  ShieldCheckIcon,
  CertificateIcon,
  FileJsIcon,
  FileIcon,
  NoteIcon,
} from "@phosphor-icons/react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { EnvVarForm } from "./env-var-form"
import { PasswordForm } from "./password-form"
import { ApiTokenForm } from "./api-token-form"
import { SshKeypairForm } from "./ssh-keypair-form"
import { CertificateForm } from "./certificate-form"
import { JsonForm } from "./json-form"
import { FileForm } from "./file-form"
import { NoteForm } from "./note-form"
import type { SecretType, SecretFormOutput } from "./types"

type SecretFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: SecretFormOutput) => Promise<void>
  defaultType?: SecretType
}

const secretTypes = [
  {
    value: "env_var" as const,
    label: "Environment Variable",
    icon: KeyIcon,
    description: "Store environment configuration",
  },
  {
    value: "password" as const,
    label: "Password",
    icon: LockKeyIcon,
    description: "User passwords and credentials",
  },
  {
    value: "api_token" as const,
    label: "API Token",
    icon: ShieldCheckIcon,
    description: "API keys and access tokens",
  },
  {
    value: "ssh_keypair" as const,
    label: "SSH Key",
    icon: KeyIcon,
    description: "SSH public/private key pairs",
  },
  {
    value: "certificate" as const,
    label: "Certificate",
    icon: CertificateIcon,
    description: "SSL/TLS certificates",
  },
  {
    value: "json" as const,
    label: "JSON",
    icon: FileJsIcon,
    description: "JSON configuration files",
  },
  {
    value: "file" as const,
    label: "File",
    icon: FileIcon,
    description: "Binary files and documents",
  },
  {
    value: "note" as const,
    label: "Note",
    icon: NoteIcon,
    description: "Secure text notes",
  },
]

export function SecretFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultType = "env_var",
}: SecretFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isSubmitting) {
        onOpenChange(nextOpen)
      } else {
        onOpenChange(nextOpen)
      }
    },
    [isSubmitting, onOpenChange]
  )

  const handleSubmit = useCallback(
    async (data: SecretFormOutput) => {
      setIsSubmitting(true)
      try {
        await onSubmit(data)
        handleOpenChange(false)
      } catch (err) {
        throw err
      } finally {
        setIsSubmitting(false)
      }
    },
    [onSubmit, handleOpenChange]
  )

  const handleCancel = useCallback(() => {
    handleOpenChange(false)
  }, [handleOpenChange])

  const selectedTypeInfo = secretTypes.find((t) => t.value === defaultType)
  const Icon = selectedTypeInfo?.icon || KeyIcon

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" />
            </div>
            <div>
              <DialogTitle>New Secret</DialogTitle>
              <DialogDescription>
                Add a new {selectedTypeInfo?.label.toLowerCase()} to this environment
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {defaultType === "env_var" && (
          <EnvVarForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}
        {defaultType === "password" && (
          <PasswordForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}
        {defaultType === "api_token" && (
          <ApiTokenForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}
        {defaultType === "ssh_keypair" && (
          <SshKeypairForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}
        {defaultType === "certificate" && (
          <CertificateForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}
        {defaultType === "json" && (
          <JsonForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}
        {defaultType === "file" && (
          <FileForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}
        {defaultType === "note" && (
          <NoteForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
