"use client"

import { useState } from "react"
import { XIcon } from "@phosphor-icons/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ApprovalCard, type ActionProposalDto } from "./approval-card"
import { Badge } from "@/components/ui/badge"

type ProposalModalProps = {
  trigger: React.ReactNode
  proposal: ActionProposalDto
  onApprove?: (proposalId: string, notes?: string) => Promise<void>
  onReject?: (proposalId: string, notes?: string) => Promise<void>
}

export function ProposalModal({
  trigger,
  proposal,
  onApprove,
  onReject,
}: ProposalModalProps) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const handleApprove = async () => {
    if (!onApprove) return
    setIsApproving(true)
    try {
      await onApprove(proposal.id, notes || undefined)
      setOpen(false)
      setNotes("")
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!onReject) return
    setIsRejecting(true)
    try {
      await onReject(proposal.id, notes || undefined)
      setOpen(false)
      setNotes("")
    } finally {
      setIsRejecting(false)
    }
  }

  const canApproveOrReject = proposal.status === "awaiting_approval"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Action Proposal</span>
            <Badge variant="outline" className="font-mono text-xs">
              {proposal.id}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Review the details and decide whether to approve or reject this action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payload Preview (if has payload) */}
          {proposal.payload && Object.keys(proposal.payload).length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Action Payload</Label>
              <div className="rounded-lg border bg-muted/50 p-3">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(proposal.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Main Card (reuse existing component) */}
          <ApprovalCard
            proposal={proposal}
            // Don't pass handlers here, we handle them in footer
            className="border-0 shadow-none"
          />

          {/* Additional Notes Input for Modal */}
          {canApproveOrReject && (
            <div className="space-y-2">
              <Label htmlFor="modal-notes" className="text-sm">
                Decision Notes (optional)
              </Label>
              <Textarea
                id="modal-notes"
                placeholder="Explain your decision..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        {canApproveOrReject && (
          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={isApproving || isRejecting}>
                Cancel
              </Button>
            </DialogClose>
            {onReject && (
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isApproving || isRejecting}
              >
                {isRejecting ? "Rejecting..." : "Reject"}
              </Button>
            )}
            {onApprove && (
              <Button
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
              >
                {isApproving ? "Approving..." : "Approve & Execute"}
              </Button>
            )}
          </DialogFooter>
        )}

        {/* Close button if already decided */}
        {!canApproveOrReject && (
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
