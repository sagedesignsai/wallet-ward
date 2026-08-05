"use client"

import { use, useEffect } from "react"
import Link from "next/link"
import { WarningIcon, CheckCircleIcon } from "@phosphor-icons/react"

import { useDashboardConfig } from "@/hooks/use-dashboard-config"
import { useProposal } from "@/hooks/use-proposal"
import { ProposalDetail } from "@/components/proposals/proposal-detail"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"

export default function ProposalDetailPage({
  params,
}: {
  params: Promise<{ proposalId: string }>
}) {
  const { proposalId } = use(params)
  return <ProposalDetailInner proposalId={proposalId} />
}

function ProposalDetailInner({ proposalId }: { proposalId: string }) {
  const { setConfig } = useDashboardConfig()
  const {
    proposal,
    isLoading,
    isActing,
    error,
    approveProposal,
    rejectProposal,
  } = useProposal(proposalId)

  useEffect(() => {
    if (proposal) {
      setConfig({
        title: proposal.title,
        description: "Review and approve agent-proposed action",
        breadcrumbs: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Proposals", href: "/dashboard/proposals" },
          { label: proposal.title },
        ],
      })
    }
  }, [proposal, setConfig])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    )
  }

  if (error || !proposal) {
    return (
      <Empty className="rounded-lg border border-border/40 bg-card py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {error ? (
              <WarningIcon className="size-4" />
            ) : (
              <CheckCircleIcon className="size-4" />
            )}
          </EmptyMedia>
          <EmptyTitle>Proposal not found</EmptyTitle>
          <EmptyDescription>
            {error ?? "This proposal may have been deleted."}
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" size="sm" asChild className="mt-4">
          <Link href="/dashboard/proposals">Back to Proposals</Link>
        </Button>
      </Empty>
    )
  }

  return (
    <ProposalDetail
      proposal={proposal}
      isActing={isActing}
      onApprove={
        proposal.status === "awaiting_approval" ? approveProposal : undefined
      }
      onReject={
        proposal.status === "awaiting_approval" ? rejectProposal : undefined
      }
    />
  )
}
