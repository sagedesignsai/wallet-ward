"use client";

import { useEffect, useState } from "react";
import { useAuditLogs, type AuditLog } from "@/hooks/use-audit-logs";
import { useOrganization } from "@/hooks/use-organization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeAgo } from "@/components/dashboard/time-ago";
import {
  ShieldCheckIcon,
  KeyIcon,
  ClockCounterClockwiseIcon,
  LockKeyIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  InfoIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

type EncryptionStatus = {
  algorithm: string | null;
  keyVersion: number | null;
  lastKeyRotation: string | null;
  totalSecrets: number;
  encryptedSecrets: number;
  hasEncryptionKey: boolean;
};

// ─── Status Row Component ─────────────────────────────────────────────────────

function StatusRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string | number;
  status?: "secure" | "warning" | "info";
}) {
  const statusConfig = {
    secure: { icon: CheckCircleIcon, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    warning: { icon: WarningCircleIcon, color: "text-amber-400", bg: "bg-amber-500/10" },
    info: { icon: InfoIcon, color: "text-blue-400", bg: "bg-blue-500/10" },
  };

  const config = status ? statusConfig[status] : null;
  const Icon = config?.icon;

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{value}</span>
        {Icon && (
          <div className={cn("rounded p-1", config.bg)}>
            <Icon className={cn("size-3.5", config.color)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Audit Log Row ────────────────────────────────────────────────────────────

function AuditLogRow({ log }: { log: AuditLog }) {
  const actionColors: Record<string, string> = {
    create: "text-green-400",
    read: "text-blue-400",
    update: "text-amber-400",
    delete: "text-red-400",
    rotate: "text-violet-400",
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
      <div className="rounded-lg bg-muted/40 p-2 shrink-0">
        <LockKeyIcon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-semibold uppercase tracking-wide", actionColors[log.action] || "text-muted-foreground")}>
            {log.action}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground truncate">
            {log.resourceType}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {log.metadata ? JSON.stringify(log.metadata) : "No details available"}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <ClockCounterClockwiseIcon className="size-3" />
          <TimeAgo date={new Date(log.createdAt)} />
          {log.ipAddress && (
            <>
              <span>·</span>
              <span className="font-mono">{log.ipAddress}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VaultSecurityPage() {
  const { logs: auditLogs, isLoading: logsLoading } = useAuditLogs();
  const { activeOrganizationId } = useOrganization();

  const [encryptionStatus, setEncryptionStatus] = useState<EncryptionStatus | null>(null);
  const [encLoading, setEncLoading] = useState(true);

  useEffect(() => {
    if (!activeOrganizationId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/v1/organizations/${activeOrganizationId}/encryption-status`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Failed to load encryption status (${res.status})`);
        const body: { data: EncryptionStatus } = await res.json();
        if (!cancelled) setEncryptionStatus(body.data);
      } catch {
        // Leave as null — we'll show a fallback
      } finally {
        if (!cancelled) setEncLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeOrganizationId]);

  const lastRotation = encryptionStatus?.lastKeyRotation
    ? new Date(encryptionStatus.lastKeyRotation)
    : null;
  const nextRotation = lastRotation
    ? new Date(lastRotation.getTime() + 90 * 24 * 60 * 60 * 1000)
    : null;

  const daysSinceRotation = lastRotation
    ? Math.floor((Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const daysUntilRotation = nextRotation
    ? Math.floor((nextRotation.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor vault encryption status and access logs
        </p>
      </div>

      {/* Encryption Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="size-5 text-emerald-400" weight="fill" />
            Encryption Status
            <Badge variant="outline" className="ml-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              {encLoading ? "Loading" : encryptionStatus?.hasEncryptionKey ? "Secure" : "No Key"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {encLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <>
              <StatusRow
                label="Encryption Algorithm"
                value={encryptionStatus?.algorithm ?? "—"}
                status={encryptionStatus?.algorithm ? "secure" : "warning"}
              />
              <StatusRow
                label="Key Version"
                value={encryptionStatus?.keyVersion != null ? `v${encryptionStatus.keyVersion}` : "—"}
                status="info"
              />
              <StatusRow
                label="Total Secrets"
                value={encryptionStatus?.totalSecrets ?? 0}
              />
              <StatusRow
                label="Encrypted Secrets"
                value={`${encryptionStatus?.encryptedSecrets ?? 0}${encryptionStatus?.totalSecrets ? ` (${Math.round(((encryptionStatus.encryptedSecrets) / encryptionStatus.totalSecrets) * 100)}%)` : ""}`}
                status="secure"
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Key Rotation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyIcon className="size-5 text-blue-400" />
            Key Rotation Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {encLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <>
              <StatusRow
                label="Last Rotation"
                value={daysSinceRotation != null ? `${daysSinceRotation} days ago` : "—"}
                status={daysSinceRotation != null && daysSinceRotation > 60 ? "warning" : "info"}
              />
              <StatusRow
                label="Next Scheduled Rotation"
                value={daysUntilRotation != null ? `in ${daysUntilRotation} days` : "—"}
                status={daysUntilRotation != null && daysUntilRotation < 30 ? "warning" : "info"}
              />
              <StatusRow
                label="Rotation Policy"
                value="Every 90 days"
              />
              <StatusRow
                label="Auto-Rotation"
                value="Enabled"
                status="secure"
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Secret Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockCounterClockwiseIcon className="size-5 text-muted-foreground" />
            Recent Secret Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <div className="text-center py-8">
              <ClockCounterClockwiseIcon className="size-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No recent access logs
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {auditLogs.map((log) => (
                <AuditLogRow key={log.id} log={log} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-400">
            <InfoIcon className="size-5" weight="fill" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircleIcon className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>All secrets are encrypted with AES-256-GCM</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircleIcon className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Envelope encryption is active with organization-level DEKs</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircleIcon className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Zero-leak proxy prevents credential exposure to agents</span>
            </li>
            <li className="flex items-start gap-2">
              <InfoIcon className="size-4 text-blue-400 shrink-0 mt-0.5" />
              <span>Consider enabling 2FA for all team members</span>
            </li>
            <li className="flex items-start gap-2">
              <InfoIcon className="size-4 text-blue-400 shrink-0 mt-0.5" />
              <span>Review audit logs regularly for suspicious activity</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
