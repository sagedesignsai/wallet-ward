"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import {
  KeyIcon,
  FolderIcon,
  StackSimpleIcon,
  LockKeyIcon,
  ShieldCheckIcon,
  CertificateIcon,
  FileJsIcon,
  FileIcon,
  NoteIcon,
  WarningCircleIcon,
  FolderOpenIcon,
} from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProjectStore } from "@/stores/project-store"
import {
  useGlobalSecrets,
  type GlobalSecret,
  type GlobalSecretWithValue,
} from "@/hooks/use-global-secrets"
import { StatCard } from "@/components/dashboard/stat-card"
import { TimeAgo } from "@/components/dashboard/time-ago"
import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/data-table"
import { GlobalSecretsToolbar } from "@/components/secrets/global-secrets-toolbar"
import { SecretExpandPanel } from "@/components/secrets/secret-expand-panel"
import { SecretRowActions } from "@/components/projects/secret-row-actions"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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

export default function GlobalSecretsPage() {
  const { setConfig } = useDashboardConfig()
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const {
    secrets: allSecrets,
    filtered,
    isLoading,
    error,
    filters,
    activeFilterCount,
    projects,
    environments,
    types,
    setFilter,
    clearFilters,
    revealValue,
    deleteSecret,
    refetch,
  } = useGlobalSecrets()

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  )

  // Filter secrets to only show current project
  const secrets = useMemo(() => {
    if (!activeProjectId) return allSecrets
    return allSecrets.filter((s) => s.projectId === activeProjectId)
  }, [allSecrets, activeProjectId])

  const [revealedSecrets, setRevealedSecrets] = useState<
    Record<string, GlobalSecretWithValue>
  >({})
  const [expandedSecretId, setExpandedSecretId] = useState<string | null>(null)

  useEffect(() => {
    setConfig({
      description: activeProject
        ? `Secrets in ${activeProject.name}`
        : "Project secrets and keys",
      breadcrumbs: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Secrets & Keys" },
      ],
    })
  }, [setConfig, activeProject])

  const handleReveal = useCallback(
    async (secretId: string): Promise<GlobalSecretWithValue | null> => {
      const result = await revealValue(secretId)
      if (result) {
        setRevealedSecrets((prev) => ({ ...prev, [secretId]: result }))
        setExpandedSecretId(secretId)
      }
      return result
    },
    [revealValue]
  )

  const handleCloseExpand = useCallback(() => {
    setExpandedSecretId(null)
  }, [])

  // Stats
  const distinctProjects = useMemo(() => {
    const set = new Set<string>()
    for (const s of secrets) set.add(s.projectId)
    return set.size
  }, [secrets])

  const distinctEnvironments = useMemo(() => {
    const set = new Set<string>()
    for (const s of secrets) set.add(s.environmentId)
    return set.size
  }, [secrets])

  const distinctTypes = useMemo(() => {
    const set = new Set<string>()
    for (const s of secrets) set.add(s.type)
    return set.size
  }, [secrets])

  const columns: DataTableColumn<GlobalSecret & Record<string, unknown>>[] =
    useMemo(
      () => [
        {
          key: "name",
          header: "Secret",
          className: "w-[280px]",
          render: (row) => {
            const secret = row as unknown as GlobalSecret
            const Icon = typeIcon(secret.type)
            return (
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-6 shrink-0 items-center justify-center rounded bg-muted/60 text-muted-foreground">
                  <Icon className="size-3" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium text-foreground">
                      {secret.name}
                    </span>
                    <Badge variant={typeBadgeVariant(secret.type)}>
                      {typeLabel(secret.type)}
                    </Badge>
                  </div>
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
          key: "project",
          header: "Project",
          className: "w-[160px]",
          render: (row) => {
            const secret = row as unknown as GlobalSecret
            return (
              <Link
                href={`/dashboard/projects/${secret.projectId}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <FolderIcon className="size-3 shrink-0" />
                <span className="truncate">{secret.project.name}</span>
              </Link>
            )
          },
        },
        {
          key: "environment",
          header: "Environment",
          className: "w-[160px]",
          render: (row) => {
            const secret = row as unknown as GlobalSecret
            return (
              <Link
                href={`/dashboard/projects/${secret.projectId}/environments/${secret.environmentId}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <StackSimpleIcon className="size-3 shrink-0" />
                <span className="truncate">{secret.environment.name}</span>
              </Link>
            )
          },
        },
        {
          key: "updatedAt",
          header: "Updated",
          className: "w-[100px]",
          render: (row) => {
            const secret = row as unknown as GlobalSecret
            return <TimeAgo date={secret.updatedAt} />
          },
        },
        {
          key: "actions",
          header: "",
          className: "w-[40px] text-right",
          render: (row) => {
            const secret = row as unknown as GlobalSecret
            return (
              <SecretRowActions
                secret={secret}
                revealedValue={revealedSecrets[secret.id] ?? null}
                onReveal={handleReveal}
                onDelete={deleteSecret}
              />
            )
          },
        },
      ],
      [revealedSecrets, handleReveal, deleteSecret]
    )

  return (
    <div className="flex flex-col gap-5">
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

      {/* Page Header */}

      {/* Stats Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Secrets"
          value={isLoading ? "—" : secrets.length}
          icon={<KeyIcon className="size-4" />}
          description="Across all projects"
        />
        <StatCard
          label="Projects"
          value={isLoading ? "—" : distinctProjects}
          icon={<FolderIcon className="size-4" />}
          description={
            distinctProjects === 1
              ? "1 project"
              : `${distinctProjects} projects`
          }
        />
        <StatCard
          label="Environments"
          value={isLoading ? "—" : distinctEnvironments}
          icon={<StackSimpleIcon className="size-4" />}
          description={
            distinctEnvironments === 1
              ? "1 environment"
              : `${distinctEnvironments} environments`
          }
        />
        <StatCard
          label="Secret Types"
          value={isLoading ? "—" : distinctTypes}
          icon={<KeyIcon className="size-4" />}
          description={
            distinctTypes === 1
              ? "1 type in use"
              : `${distinctTypes} types in use`
          }
        />
      </div>

      {/* Toolbar + Table */}
      <div className="flex flex-col gap-2.5">
        <GlobalSecretsToolbar
          filters={filters}
          activeFilterCount={activeFilterCount}
          projects={projects}
          environments={environments}
          types={types}
          onFilterChange={setFilter}
          onClearFilters={clearFilters}
        />

        {!isLoading && secrets.length === 0 && !error ? (
          <Empty className="rounded-lg border border-border/60 bg-card py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpenIcon className="size-4" />
              </EmptyMedia>
              <EmptyTitle>No secrets yet</EmptyTitle>
              <EmptyDescription>
                Create your first secret within a project to get started.
              </EmptyDescription>
            </EmptyHeader>
            <Button asChild className="mt-2">
              <Link href="/dashboard/projects">
                <FolderIcon />
                Go to Projects
              </Link>
            </Button>
          </Empty>
        ) : (
          <div className="flex flex-col gap-2">
            <DataTable
              columns={columns as DataTableColumn<Record<string, unknown>>[]}
              data={filtered as (GlobalSecret & Record<string, unknown>)[]}
              isLoading={isLoading}
              loadingRows={5}
              keyExtractor={(s) => String((s as unknown as GlobalSecret).id)}
              emptyTitle={
                activeFilterCount > 0
                  ? "No secrets match your filters"
                  : "No secrets found"
              }
              emptyDescription={
                activeFilterCount > 0
                  ? "Try adjusting or clearing your filters."
                  : "No secrets are available to display."
              }
              emptyIcon={
                activeFilterCount > 0 ? <WarningCircleIcon /> : <KeyIcon />
              }
            />

            {/* Inline expand panel below the table */}
            {expandedSecretId && revealedSecrets[expandedSecretId] && (
              <SecretExpandPanel
                secret={revealedSecrets[expandedSecretId].secret}
                revealedValue={revealedSecrets[expandedSecretId]}
                onClose={handleCloseExpand}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
