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
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProject } from "@/hooks/use-project"
import { useSecrets, type SecretWithValue } from "@/hooks/use-secrets"
import { PageHeader } from "@/components/dashboard/page-header"
import { TimeAgo } from "@/components/dashboard/time-ago"
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table"
import { DataTableToolbar } from "@/components/dashboard/data-table-toolbar"
import { SensitiveValue } from "@/components/dashboard/sensitive-value"
import { SecretRowActions } from "@/components/projects/secret-row-actions"
import { CreateSecretDialog } from "@/components/projects/create-secret-dialog"
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

  return (
    <SecretsInner projectId={projectId} environmentId={environmentId} />
  )
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
  const [revealedSecrets, setRevealedSecrets] = useState<
    Record<string, SecretWithValue>
  >({})

  const environment = project?.environments?.find(
    (e) => e.id === environmentId
  )

  useEffect(() => {
    if (project && environment) {
      setConfig({
        title: environment.name,
        description: `Secrets in ${environment.name}`,
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
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted/60 text-muted-foreground">
                <Icon className="size-3" />
              </div>
              <div className="min-w-0">
                <span className="font-medium text-foreground truncate block">
                  {secret.name}
                </span>
                {secret.description && (
                  <span className="text-[0.625rem] text-muted-foreground truncate block">
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
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
          <button
            onClick={refetch}
            className="ml-2 font-medium underline underline-offset-2 hover:text-destructive/80 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <PageHeader
        title="Secrets"
        description={`${secrets.length} secret${secrets.length !== 1 ? "s" : ""} in ${environment?.name ?? "this environment"}`}
        icon={<KeyIcon />}
        actions={
          <Button
            size="default"
            onClick={() => setCreateOpen(true)}
            className="shadow-md shadow-primary/10 transition-shadow hover:shadow-lg hover:shadow-primary/20"
          >
            <PlusIcon />
            Add Secret
          </Button>
        }
      />

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
          emptyTitle={
            search ? "No matching secrets" : "No secrets yet"
          }
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
                    className="flex-1 min-w-0"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateSecretDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => refetch()}
        createSecret={createSecret}
      />
    </div>
  )
}
