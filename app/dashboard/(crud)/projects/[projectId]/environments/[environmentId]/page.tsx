"use client"

import { useEffect, useState, useMemo, useCallback, use } from "react"
import {
  KeyIcon,
  PlusIcon,
  WarningCircleIcon,
  ShieldCheckIcon,
  LockKeyIcon,
  CertificateIcon,
  FileJsIcon,
  FileIcon,
  NoteIcon,
  EyeIcon,
  EyeSlashIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useSecrets, type SecretWithValue } from "@/hooks/use-secrets"
import { TimeAgo } from "@/components/dashboard/time-ago"
import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/data-table"
import { DataTableToolbar } from "@/components/dashboard/data-table-toolbar"
import { SensitiveValue } from "@/components/dashboard/sensitive-value"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { SecretRowActions } from "@/components/projects/secret-row-actions"
import { SecretFormDialog } from "@/components/secrets/forms"
import type { SecretType } from "@/components/secrets/forms"
import { EnvVarBulkImport } from "@/components/projects/env-var-bulk-import"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Secret } from "@/hooks/use-secrets"

type SecretsPageProps = {
  params: Promise<{ projectId: string; environmentId: string }>
}

function typeBadgeVariant(
  type: string
): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "password":
      return "destructive"
    case "api_token":
      return "default"
    case "env_var":
      return "secondary"
    case "ssh_keypair":
      return "outline"
    case "certificate":
      return "outline"
    default:
      return "secondary"
  }
}

function typeIcon(type: string) {
  switch (type) {
    case "password":
      return LockKeyIcon
    case "api_token":
      return ShieldCheckIcon
    case "ssh_keypair":
      return KeyIcon
    case "certificate":
      return CertificateIcon
    case "json":
      return FileJsIcon
    case "file":
      return FileIcon
    case "note":
      return NoteIcon
    default:
      return KeyIcon
  }
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    env_var: "Env Var",
    password: "Password",
    api_token: "API Token",
    ssh_keypair: "SSH Key",
    certificate: "Certificate",
    json: "JSON",
    file: "File",
    note: "Note",
  }
  return labels[type] ?? type
}

export default function SecretsPage({ params }: SecretsPageProps) {
  const { projectId, environmentId } = use(params)

  return <SecretsInner projectId={projectId} environmentId={environmentId} />
}

function SecretsInner({
  projectId,
  environmentId,
}: {
  projectId: string
  environmentId: string
}) {
  const { setConfig } = useDashboardConfig()
  const { project } = useProject(projectId)
  const {
    secrets,
    isLoading,
    error,
    refetch,
    createSecret,
    deleteSecret,
    revealValue,
  } = useSecrets(projectId, environmentId)

  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<SecretType>("env_var")
  const [revealedSecrets, setRevealedSecrets] = useState<
    Record<string, SecretWithValue>
  >({})

  const handleSelectType = useCallback((type: SecretType) => {
    setSelectedType(type)
    setCreateOpen(true)
  }, [])

  const handleCloseDialog = useCallback((open: boolean) => {
    setCreateOpen(open)
    // Reset type when closing
    if (!open) {
      setSelectedType("env_var")
    }
  }, [])

  const environment = project?.environments?.find((e) => e.id === environmentId)

  useEffect(() => {
    if (project && environment) {
      setConfig({
        description: `Secrets in ${environment.name}`,
        actions: (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="default"
                className="shadow-md shadow-primary/10 transition-shadow hover:shadow-lg hover:shadow-primary/20"
              >
                <PlusIcon />
                Add Secret
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  Select Secret Type
                </p>
              </div>
              <DropdownMenuSeparator />

              <DropdownMenuItem onSelect={() => handleSelectType("env_var")}>
                <KeyIcon className="mr-2 size-3.5" />
                <div className="flex flex-col">
                  <span className="font-medium">Environment Variable</span>
                  <span className="text-[0.625rem] text-muted-foreground">
                    App configuration
                  </span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => handleSelectType("password")}>
                <LockKeyIcon className="mr-2 size-3.5" />
                <div className="flex flex-col">
                  <span className="font-medium">Password</span>
                  <span className="text-[0.625rem] text-muted-foreground">
                    With strength indicator
                  </span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => handleSelectType("api_token")}>
                <ShieldCheckIcon className="mr-2 size-3.5" />
                <div className="flex flex-col">
                  <span className="font-medium">API Token</span>
                  <span className="text-[0.625rem] text-muted-foreground">
                    Keys & access tokens
                  </span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => handleSelectType("ssh_keypair")}
              >
                <KeyIcon className="mr-2 size-3.5" />
                <div className="flex flex-col">
                  <span className="font-medium">SSH Key</span>
                  <span className="text-[0.625rem] text-muted-foreground">
                    Public/private keypair
                  </span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => handleSelectType("certificate")}
              >
                <CertificateIcon className="mr-2 size-3.5" />
                <div className="flex flex-col">
                  <span className="font-medium">Certificate</span>
                  <span className="text-[0.625rem] text-muted-foreground">
                    SSL/TLS certificates
                  </span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => handleSelectType("json")}>
                <FileJsIcon className="mr-2 size-3.5" />
                <div className="flex flex-col">
                  <span className="font-medium">JSON</span>
                  <span className="text-[0.625rem] text-muted-foreground">
                    Config files & structured data
                  </span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => handleSelectType("file")}>
                <FileIcon className="mr-2 size-3.5" />
                <div className="flex flex-col">
                  <span className="font-medium">File</span>
                  <span className="text-[0.625rem] text-muted-foreground">
                    Binary files & documents
                  </span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => handleSelectType("note")}>
                <NoteIcon className="mr-2 size-3.5" />
                <div className="flex flex-col">
                  <span className="font-medium">Note</span>
                  <span className="text-[0.625rem] text-muted-foreground">
                    Secure text documentation
                  </span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onSelect={() => setBulkImportOpen(true)}>
                <UploadSimpleIcon className="mr-2 size-3.5" />
                <div className="flex flex-col">
                  <span className="font-medium">Bulk Import</span>
                  <span className="text-[0.625rem] text-muted-foreground">
                    Upload or paste .env file
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projects", href: "/dashboard/projects" },
          {
            label: project.name,
            href: `/dashboard/projects/${projectId}`,
          },
          {
            label: "Environments",
            href: `/dashboard/projects/${projectId}/environments`,
          },
          { label: environment.name },
        ],
      })
    }
  }, [project, environment, projectId, setConfig])

  const handleReveal = useCallback(
    async (secretId: string): Promise<SecretWithValue | null> => {
      const result = await revealValue(secretId)
      if (result) {
        setRevealedSecrets((prev) => ({ ...prev, [secretId]: result }))
      }
      return result
    },
    [revealValue]
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return secrets
    const q = search.toLowerCase()
    return secrets.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    )
  }, [secrets, search])

  const columns: DataTableColumn<Secret>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Secret",
        className: "w-[260px]",
        render: (secret) => {
          const Icon = typeIcon(secret.type)
          return (
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted/60 text-muted-foreground">
                <Icon className="size-3" />
              </div>
              <div className="min-w-0">
                <span className="block truncate font-medium text-foreground">
                  {secret.name}
                </span>
                {secret.description && (
                  <span className="block truncate text-[0.625rem] text-muted-foreground">
                    {secret.description}
                  </span>
                )}
              </div>
            </div>
          )
        },
      },
      {
        key: "type",
        header: "Type",
        className: "w-[100px]",
        render: (secret) => (
          <Badge variant={typeBadgeVariant(secret.type)}>
            {typeLabel(secret.type)}
          </Badge>
        ),
      },
      {
        key: "version",
        header: "Version",
        className: "w-[80px]",
        render: (secret) => (
          <span className="font-mono text-[0.625rem] text-muted-foreground tabular-nums">
            v{secret.currentVersion}
          </span>
        ),
      },
      {
        key: "updatedAt",
        header: "Updated",
        className: "w-[100px]",
        render: (secret) => <TimeAgo date={secret.updatedAt} />,
      },
      {
        key: "actions",
        header: "",
        className: "w-[40px] text-right",
        render: (secret) => (
          <SecretRowActions
            secret={secret}
            revealedValue={revealedSecrets[secret.id] ?? null}
            onReveal={handleReveal}
            onDelete={deleteSecret}
          />
        ),
      },
    ],
    [revealedSecrets, handleReveal, deleteSecret]
  )

  // Loading state
  if (!project) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-7 w-48 rounded" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="flex animate-in flex-col gap-4 duration-300 fade-in">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
          <button
            onClick={refetch}
            className="ml-2 font-medium underline underline-offset-2 transition-colors hover:text-destructive/80"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <DataTableToolbar
          searchPlaceholder="Search secrets..."
          searchValue={search}
          onSearchChange={setSearch}
        />

        <DataTable
          columns={columns}
          data={filtered as (Secret & Record<string, unknown>)[]}
          isLoading={isLoading}
          loadingRows={5}
          keyExtractor={(s) => s.id}
          emptyTitle={search ? "No matching secrets" : "No secrets yet"}
          emptyDescription={
            search
              ? `No secrets found for "${search}". Try a different search term.`
              : "Add your first secret to this environment to get started."
          }
          emptyIcon={<KeyIcon />}
        />

        {/* Revealed values panel */}
        {Object.keys(revealedSecrets).length > 0 && !isLoading && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-muted-foreground">
              Revealed Values
            </h3>
            <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card p-2">
              {Object.entries(revealedSecrets).map(([secretId, svw]) => (
                <div
                  key={secretId}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/30"
                >
                  <span className="w-32 shrink-0 truncate text-xs font-medium text-foreground">
                    {svw.secret.name}
                  </span>
                  <SensitiveValue
                    value={svw.value}
                    className="min-w-0 flex-1"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <SecretFormDialog
        open={createOpen}
        onOpenChange={handleCloseDialog}
        defaultType={selectedType}
        onSubmit={async (data) => {
          const secret = await createSecret({
            name: data.name,
            value: data.value,
            description: data.description,
            type: data.type,
            metadata: data.metadata,
          })
          if (secret) {
            refetch()
          }
        }}
      />

      <EnvVarBulkImport
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        existingSecretNames={secrets.map((s) => s.name)}
        onImport={async (vars) => {
          await Promise.all(
            vars.map((v) =>
              createSecret({ name: v.name, value: v.value, type: "env_var" })
            )
          )
          refetch()
        }}
      />
    </div>
  )
}
