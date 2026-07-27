"use client"

import { useState, useCallback, useRef } from "react"
import { useDropzone } from "react-dropzone"
import {
  PlusIcon,
  TrashIcon,
  UploadIcon,
  KeyIcon,
  FileTextIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Secret } from "@/hooks/use-secrets"

type EnvVar = {
  id: string
  key: string
  value: string
  error?: string
}

type EnvVarBulkImportProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (vars: Array<{ name: string; value: string }>) => Promise<void>
  existingSecretNames?: string[]
}

function parseDotenv(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    value = value
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
    result[key] = value
  }
  return result
}

function validateEnvVarKey(key: string): string | undefined {
  if (!key.trim()) return "Key is required"
  if (!/^[A-Za-z0-9._/-]+$/.test(key)) {
    return "Only letters, numbers, dots, underscores, slashes, and hyphens allowed"
  }
  return undefined
}

export function EnvVarBulkImport({
  open,
  onOpenChange,
  onImport,
  existingSecretNames = [],
}: EnvVarBulkImportProps) {
  const [envVars, setEnvVars] = useState<EnvVar[]>([
    { id: crypto.randomUUID(), key: "", value: "" },
  ])
  const [pasteContent, setPasteContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importStats, setImportStats] = useState<{
    total: number
    new: number
    duplicates: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setEnvVars([{ id: crypto.randomUUID(), key: "", value: "" }])
    setPasteContent("")
    setError(null)
    setImportStats(null)
    setIsSubmitting(false)
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) reset()
      onOpenChange(nextOpen)
    },
    [onOpenChange, reset]
  )

  const addEnvVar = useCallback(() => {
    setEnvVars((prev) => [
      ...prev,
      { id: crypto.randomUUID(), key: "", value: "" },
    ])
  }, [])

  const removeEnvVar = useCallback((id: string) => {
    setEnvVars((prev) => prev.filter((v) => v.id !== id))
  }, [])

  const updateEnvVar = useCallback(
    (id: string, field: "key" | "value", value: string) => {
      setEnvVars((prev) =>
        prev.map((v) => {
          if (v.id !== id) return v
          const updated = { ...v, [field]: value }
          if (field === "key") {
            updated.error = validateEnvVarKey(value)
          }
          return updated
        })
      )
      if (error) setError(null)
    },
    [error]
  )

  const handleFileChange = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      try {
        const content = await file.text()
        const parsed = parseDotenv(content)
        const newVars = Object.entries(parsed).map(([key, value]) => ({
          id: crypto.randomUUID(),
          key,
          value,
          error: validateEnvVarKey(key),
        }))

        if (newVars.length === 0) {
          setError("No valid environment variables found in file")
          return
        }

        setEnvVars(newVars)
        setError(null)

        // Calculate stats
        const duplicates = newVars.filter((v) =>
          existingSecretNames.includes(v.key)
        ).length
        setImportStats({
          total: newVars.length,
          new: newVars.length - duplicates,
          duplicates,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to read file")
      }
    },
    [existingSecretNames]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileChange,
    accept: {
      "text/plain": [".env", ".txt"],
    },
    multiple: false,
  })

  const handleParsePaste = useCallback(() => {
    if (!pasteContent.trim()) {
      setError("Please paste some content first")
      return
    }

    try {
      const parsed = parseDotenv(pasteContent)
      const newVars = Object.entries(parsed).map(([key, value]) => ({
        id: crypto.randomUUID(),
        key,
        value,
        error: validateEnvVarKey(key),
      }))

      if (newVars.length === 0) {
        setError("No valid environment variables found")
        return
      }

      setEnvVars(newVars)
      setError(null)

      // Calculate stats
      const duplicates = newVars.filter((v) =>
        existingSecretNames.includes(v.key)
      ).length
      setImportStats({
        total: newVars.length,
        new: newVars.length - duplicates,
        duplicates,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse content")
    }
  }, [pasteContent, existingSecretNames])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Validate all entries
      const validVars = envVars.filter(
        (v) => v.key.trim() && v.value && !v.error
      )

      if (validVars.length === 0) {
        setError("Please add at least one valid environment variable")
        return
      }

      // Check for duplicate keys within the input
      const keys = validVars.map((v) => v.key.trim())
      const duplicateKeys = keys.filter(
        (key, index) => keys.indexOf(key) !== index
      )
      if (duplicateKeys.length > 0) {
        setError(
          `Duplicate keys found: ${[...new Set(duplicateKeys)].join(", ")}`
        )
        return
      }

      setIsSubmitting(true)
      setError(null)

      try {
        await onImport(
          validVars.map((v) => ({ name: v.key.trim(), value: v.value }))
        )
        handleOpenChange(false)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to import variables"
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [envVars, onImport, handleOpenChange]
  )

  const validCount = envVars.filter(
    (v) => v.key.trim() && v.value && !v.error
  ).length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UploadIcon className="size-4" />
            </div>
            <div>
              <DialogTitle>Bulk Import Environment Variables</DialogTitle>
              <DialogDescription>
                Import multiple environment variables at once
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="manual" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">
              <KeyIcon className="size-3.5" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="upload">
              <UploadIcon className="size-3.5" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="paste">
              <FileTextIcon className="size-3.5" />
              Paste Content
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="manual"
            className="mt-4 min-h-0 flex-1 overflow-y-auto"
          >
            <div className="flex flex-col gap-3 pr-1">
              {envVars.map((envVar, index) => (
                <div
                  key={envVar.id}
                  className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-3"
                >
                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor={`key-${envVar.id}`} className="text-xs">
                        Key
                      </Label>
                      <Input
                        id={`key-${envVar.id}`}
                        placeholder="DATABASE_URL"
                        value={envVar.key}
                        onChange={(e) =>
                          updateEnvVar(envVar.id, "key", e.target.value)
                        }
                        className={cn(
                          "font-mono text-xs",
                          envVar.error && "border-destructive"
                        )}
                        disabled={isSubmitting}
                      />
                      {envVar.error && (
                        <p className="text-[0.625rem] text-destructive">
                          {envVar.error}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor={`value-${envVar.id}`} className="text-xs">
                        Value
                      </Label>
                      <Input
                        id={`value-${envVar.id}`}
                        type="password"
                        placeholder="Enter value"
                        value={envVar.value}
                        onChange={(e) =>
                          updateEnvVar(envVar.id, "value", e.target.value)
                        }
                        className="font-mono text-xs"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  {envVars.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeEnvVar(envVar.id)}
                      disabled={isSubmitting}
                      className="mt-6 text-muted-foreground hover:text-destructive"
                    >
                      <TrashIcon className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEnvVar}
                disabled={isSubmitting}
                className="w-fit"
              >
                <PlusIcon className="size-3.5" />
                Add Variable
              </Button>
            </div>
          </TabsContent>

          <TabsContent
            value="upload"
            className="mt-4 min-h-0 flex-1 overflow-y-auto"
          >
            <div className="flex flex-col gap-4 pr-1">
              {!importStats ? (
                <div
                  {...getRootProps()}
                  className={cn(
                    "cursor-pointer rounded-lg border-2 border-dashed bg-muted/20 p-6 text-center transition-all",
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-border"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UploadIcon className="size-5" />
                    </div>
                    <div>
                      {isDragActive ? (
                        <>
                          <p className="text-sm font-medium text-primary">
                            Drop your .env file here
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Release to upload
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">
                            Drag & drop .env file here
                          </p>
                          <p className="text-xs text-muted-foreground">
                            or click to select
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-border/60 bg-card p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="size-4 text-green-600" />
                        <span className="text-sm font-medium">
                          File parsed successfully
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setImportStats(null)}
                        disabled={isSubmitting}
                      >
                        Change file
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Total:</span>{" "}
                        <span className="font-medium">{importStats.total}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">New:</span>{" "}
                        <span className="font-medium text-green-600">
                          {importStats.new}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Duplicates:
                        </span>{" "}
                        <span className="font-medium text-amber-600">
                          {importStats.duplicates}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-card">
                    <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
                      <p className="text-xs font-medium">
                        Preview ({validCount} valid)
                      </p>
                    </div>
                    <div className="max-h-64 space-y-2 overflow-y-auto p-2">
                      {envVars.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-start gap-2 rounded-lg border border-border/40 bg-muted/30 p-2"
                        >
                          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                            <div className="flex min-w-0 items-center gap-2">
                              {v.error ? (
                                <WarningCircleIcon className="size-3 shrink-0 text-destructive" />
                              ) : (
                                <CheckCircleIcon className="size-3 shrink-0 text-green-600" />
                              )}
                              <span className="truncate font-mono text-xs font-medium">
                                {v.key || "(empty)"}
                              </span>
                              {existingSecretNames.includes(v.key) && (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 text-[0.625rem]"
                                >
                                  exists
                                </Badge>
                              )}
                            </div>
                            <span className="truncate font-mono text-xs text-muted-foreground">
                              {v.value ? "••••••" : "(empty)"}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeEnvVar(v.id)}
                            disabled={isSubmitting}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <TrashIcon className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="paste" className="mt-4">
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="paste-content">Paste .env file contents</Label>
                <Textarea
                  id="paste-content"
                  placeholder={`DATABASE_URL=postgres://localhost/mydb\nAPI_KEY=secret123\nPORT=3000`}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  className="resize-none font-mono text-xs"
                  rows={8}
                  disabled={isSubmitting}
                />
                <p className="text-[0.625rem] text-muted-foreground">
                  Paste your .env file contents. Lines starting with # are
                  ignored.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleParsePaste}
                disabled={!pasteContent.trim() || isSubmitting}
                variant="secondary"
              >
                <FileTextIcon className="size-3.5" />
                Parse Content
              </Button>

              {importStats && (
                <div className="rounded-lg border border-border/60 bg-card p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircleIcon className="size-4 text-green-600" />
                    <span className="text-sm font-medium">
                      Content parsed successfully
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Total:</span>{" "}
                      <span className="font-medium">{importStats.total}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">New:</span>{" "}
                      <span className="font-medium text-green-600">
                        {importStats.new}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duplicates:</span>{" "}
                      <span className="font-medium text-amber-600">
                        {importStats.duplicates}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {envVars.length > 0 && envVars[0].key && (
                <div className="rounded-lg border border-border/60 bg-card">
                  <div className="border-b border-border/40 px-3 py-2">
                    <p className="text-xs font-medium">
                      Preview ({validCount} valid)
                    </p>
                  </div>
                  <div className="max-h-48 overflow-y-auto p-2">
                    {envVars.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-muted/30"
                      >
                        {v.error ? (
                          <WarningCircleIcon className="size-3 shrink-0 text-destructive" />
                        ) : (
                          <CheckCircleIcon className="size-3 shrink-0 text-green-600" />
                        )}
                        <span className="truncate font-mono font-medium">
                          {v.key || "(empty)"}
                        </span>
                        {existingSecretNames.includes(v.key) && (
                          <Badge variant="outline" className="text-[0.625rem]">
                            exists
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={validCount === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Importing...
              </>
            ) : (
              <>
                <UploadIcon className="size-3.5" />
                Import {validCount} Variable{validCount !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
