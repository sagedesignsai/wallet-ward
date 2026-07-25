"use client"

import { useState, useCallback, useMemo } from "react"
import {
  CertificateIcon,
  EyeIcon,
  EyeSlashIcon,
  WarningCircleIcon,
  CheckCircleIcon,
  CalendarIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SecretFormProps } from "./types"

function validatePEM(content: string): boolean {
  return (
    content.includes("BEGIN CERTIFICATE") &&
    content.includes("END CERTIFICATE")
  )
}

export function CertificateForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialValues,
}: SecretFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "")
  const [certificate, setCertificate] = useState(initialValues?.value ?? "")
  const [privateKey, setPrivateKey] = useState("")
  const [chain, setChain] = useState("")
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  )
  const [showCert, setShowCert] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isValidCert = useMemo(
    () => certificate.trim() && validatePEM(certificate),
    [certificate]
  )

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {}

    const trimmedName = name.trim()
    if (!trimmedName) {
      newErrors.name = "Certificate name is required"
    } else if (!/^[A-Za-z0-9._/-]+$/.test(trimmedName)) {
      newErrors.name =
        "Only letters, numbers, dots, underscores, slashes, and hyphens allowed"
    }

    if (!certificate.trim()) {
      newErrors.certificate = "Certificate is required"
    } else if (!validatePEM(certificate)) {
      newErrors.certificate =
        "Invalid PEM format. Should contain BEGIN/END CERTIFICATE markers."
    }

    if (privateKey.trim() && !privateKey.includes("PRIVATE KEY")) {
      newErrors.privateKey = "Invalid private key format"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, certificate, privateKey])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validate()) return

      const metadata: Record<string, unknown> = {}
      if (privateKey.trim()) {
        metadata.hasPrivateKey = true
      }
      if (chain.trim()) {
        metadata.hasChain = true
      }

      // Combine certificate, key, and chain
      let combinedValue = certificate.trim()
      if (privateKey.trim()) {
        combinedValue += `\n---PRIVATE-KEY---\n${privateKey.trim()}`
      }
      if (chain.trim()) {
        combinedValue += `\n---CHAIN---\n${chain.trim()}`
      }

      await onSubmit({
        name: name.trim(),
        value: combinedValue,
        description: description.trim() || undefined,
        type: "certificate",
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      })
    },
    [name, certificate, privateKey, chain, description, validate, onSubmit]
  )

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="rounded-lg border border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20 px-3 py-2">
        <p className="text-xs text-green-900 dark:text-green-100">
          <CertificateIcon className="inline size-3 mr-1" />
          Store SSL/TLS certificates, private keys, and certificate chains in PEM
          format. Keep private keys secure.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cert-name">
          Certificate Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="cert-name"
          placeholder="e.g., api.example.com, wildcard_cert"
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
        <div className="flex items-center justify-between">
          <Label htmlFor="cert-value">
            Certificate (PEM) <span className="text-destructive">*</span>
          </Label>
          {certificate && (
            <div className="flex items-center gap-1 text-xs">
              {isValidCert ? (
                <>
                  <CheckCircleIcon className="size-3 text-green-600" />
                  <span className="text-green-600">Valid PEM</span>
                </>
              ) : (
                <>
                  <WarningCircleIcon className="size-3 text-amber-600" />
                  <span className="text-amber-600">Invalid format</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <Textarea
            id="cert-value"
            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
            value={certificate}
            onChange={(e) => {
              setCertificate(e.target.value)
              if (errors.certificate) {
                setErrors((prev) => ({ ...prev, certificate: "" }))
              }
            }}
            className="pr-10 font-mono text-[0.625rem] resize-none"
            rows={8}
            disabled={isSubmitting}
            aria-invalid={!!errors.certificate}
            spellCheck={false}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowCert((s) => !s)}
            tabIndex={-1}
            aria-label={showCert ? "Hide certificate" : "Show certificate"}
          >
            {showCert ? (
              <EyeSlashIcon className="size-3.5" />
            ) : (
              <EyeIcon className="size-3.5" />
            )}
          </Button>
        </div>
        {errors.certificate && (
          <p className="text-xs text-destructive">{errors.certificate}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cert-key">
          Private Key{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <div className="relative">
          <Textarea
            id="cert-key"
            placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
            value={privateKey}
            onChange={(e) => {
              setPrivateKey(e.target.value)
              if (errors.privateKey) {
                setErrors((prev) => ({ ...prev, privateKey: "" }))
              }
            }}
            className="pr-10 font-mono text-[0.625rem] resize-none"
            rows={6}
            disabled={isSubmitting}
            aria-invalid={!!errors.privateKey}
            spellCheck={false}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowKey((s) => !s)}
            tabIndex={-1}
            aria-label={showKey ? "Hide private key" : "Show private key"}
          >
            {showKey ? (
              <EyeSlashIcon className="size-3.5" />
            ) : (
              <EyeIcon className="size-3.5" />
            )}
          </Button>
        </div>
        {errors.privateKey && (
          <p className="text-xs text-destructive">{errors.privateKey}</p>
        )}
        {!showKey && privateKey && (
          <div className="flex items-start gap-1.5 text-[0.625rem] text-amber-600 dark:text-amber-500">
            <WarningCircleIcon className="size-3 mt-0.5 shrink-0" />
            <span>
              Private key is hidden for security. Click the eye icon to reveal.
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cert-chain">
          Certificate Chain{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="cert-chain"
          placeholder="Intermediate certificates (if required)"
          value={chain}
          onChange={(e) => setChain(e.target.value)}
          className="font-mono text-[0.625rem] resize-none"
          rows={4}
          disabled={isSubmitting}
          spellCheck={false}
        />
        <p className="text-[0.625rem] text-muted-foreground">
          Include intermediate/chain certificates if needed for validation
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cert-description">
          Description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="cert-description"
          placeholder="Domain name, purpose, expiry date, etc."
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
            "Create Certificate"
          )}
        </Button>
      </div>
    </form>
  )
}
