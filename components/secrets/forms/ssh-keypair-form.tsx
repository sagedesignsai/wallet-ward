"use client"

import { useState, useCallback } from "react"
import {
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CopyIcon,
  CheckIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SecretFormProps } from "./types"

export function SshKeypairForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialValues,
}: SecretFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "")
  const [privateKey, setPrivateKey] = useState(initialValues?.value ?? "")
  const [publicKey, setPublicKey] = useState("")
  const [passphrase, setPassphrase] = useState("")
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  )
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showPublicKey, setShowPublicKey] = useState(false)
  const [copiedPrivate, setCopiedPrivate] = useState(false)
  const [copiedPublic, setCopiedPublic] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}

    const trimmedName = name.trim()
    if (!trimmedName) {
      newErrors.name = "Key name is required"
    } else if (!/^[A-Za-z0-9._/-]+$/.test(trimmedName)) {
      newErrors.name =
        "Only letters, numbers, dots, underscores, slashes, and hyphens allowed"
    }

    if (!privateKey.trim()) {
      newErrors.privateKey = "Private key is required"
    } else if (
      !privateKey.includes("BEGIN") ||
      !privateKey.includes("PRIVATE KEY")
    ) {
      newErrors.privateKey =
        "Invalid private key format. Should be PEM format starting with BEGIN."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, privateKey])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validate()) return

      const metadata: Record<string, unknown> = {}
      if (publicKey.trim()) {
        metadata.publicKey = publicKey.trim()
      }
      if (passphrase) {
        metadata.hasPassphrase = true
      }

      // Store both keys in the value, separated by a delimiter
      const combinedValue = publicKey.trim()
        ? `${privateKey.trim()}\n---PUBLIC-KEY---\n${publicKey.trim()}`
        : privateKey.trim()

      await onSubmit({
        name: name.trim(),
        value: combinedValue,
        description: description.trim() || undefined,
        type: "ssh_keypair",
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      })
    },
    [name, privateKey, publicKey, passphrase, description, validate, onSubmit]
  )

  const handleCopyPrivate = useCallback(async () => {
    if (!privateKey) return
    try {
      await navigator.clipboard.writeText(privateKey)
      setCopiedPrivate(true)
      setTimeout(() => setCopiedPrivate(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }, [privateKey])

  const handleCopyPublic = useCallback(async () => {
    if (!publicKey) return
    try {
      await navigator.clipboard.writeText(publicKey)
      setCopiedPublic(true)
      setTimeout(() => setCopiedPublic(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }, [publicKey])

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="rounded-lg border border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20 px-3 py-2">
        <p className="text-xs text-purple-900 dark:text-purple-100">
          <KeyIcon className="inline size-3 mr-1" />
          Store SSH key pairs securely. Private keys should be in PEM format (e.g.,
          RSA, ED25519). Never share your private key.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ssh-name">
          Key Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="ssh-name"
          placeholder="e.g., github_deploy_key, production_server"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) {
              setErrors((prev) => ({ ...prev, name: "" }))
            }
          }}
          autoFocus
          className="font-mono"
          disabled={isSubmitting}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ssh-private">
          Private Key <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Textarea
            id="ssh-private"
            placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
            value={privateKey}
            onChange={(e) => {
              setPrivateKey(e.target.value)
              if (errors.privateKey) {
                setErrors((prev) => ({ ...prev, privateKey: "" }))
              }
            }}
            className="pr-20 font-mono text-[0.625rem] resize-none"
            rows={8}
            disabled={isSubmitting}
            aria-invalid={!!errors.privateKey}
            spellCheck={false}
          />
          <div className="absolute right-2 top-2 flex gap-0.5">
            {privateKey && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleCopyPrivate}
                tabIndex={-1}
                aria-label="Copy private key"
              >
                {copiedPrivate ? (
                  <CheckIcon className="size-3.5 text-green-600" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowPrivateKey((s) => !s)}
              tabIndex={-1}
              aria-label={showPrivateKey ? "Hide private key" : "Show private key"}
            >
              {showPrivateKey ? (
                <EyeSlashIcon className="size-3.5" />
              ) : (
                <EyeIcon className="size-3.5" />
              )}
            </Button>
          </div>
        </div>
        {errors.privateKey && (
          <p className="text-xs text-destructive">{errors.privateKey}</p>
        )}
        {!showPrivateKey && privateKey && (
          <div className="flex items-start gap-1.5 text-[0.625rem] text-amber-600 dark:text-amber-500">
            <WarningCircleIcon className="size-3 mt-0.5 shrink-0" />
            <span>
              Private key is hidden for security. Click the eye icon to reveal.
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ssh-public">
          Public Key{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <div className="relative">
          <Textarea
            id="ssh-public"
            placeholder="ssh-ed25519 AAAA... user@host"
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            className="pr-20 font-mono text-[0.625rem] resize-none"
            rows={4}
            disabled={isSubmitting}
            spellCheck={false}
          />
          {publicKey && (
            <div className="absolute right-2 top-2 flex gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleCopyPublic}
                tabIndex={-1}
                aria-label="Copy public key"
              >
                {copiedPublic ? (
                  <CheckIcon className="size-3.5 text-green-600" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowPublicKey((s) => !s)}
                tabIndex={-1}
                aria-label={showPublicKey ? "Hide public key" : "Show public key"}
              >
                {showPublicKey ? (
                  <EyeSlashIcon className="size-3.5" />
                ) : (
                  <EyeIcon className="size-3.5" />
                )}
              </Button>
            </div>
          )}
        </div>
        <p className="text-[0.625rem] text-muted-foreground">
          Store the public key for easy reference and deployment
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ssh-passphrase">
          Passphrase{" "}
          <span className="text-muted-foreground font-normal">(if protected)</span>
        </Label>
        <Input
          id="ssh-passphrase"
          type="password"
          placeholder="Enter passphrase if key is encrypted"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          disabled={isSubmitting}
          className="font-mono text-xs"
        />
        <p className="text-[0.625rem] text-muted-foreground">
          If your private key is passphrase-protected, note it here
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ssh-description">
          Description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="ssh-description"
          placeholder="What server or service is this key for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          rows={3}
          className="resize-none text-xs"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Creating...
            </>
          ) : (
            "Create SSH Key"
          )}
        </Button>
      </div>
    </form>
  )
}
