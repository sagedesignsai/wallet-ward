-- CreateEnum
CREATE TYPE "SecretType" AS ENUM ('password', 'env_var', 'ssh_keypair', 'api_token', 'certificate', 'json', 'file', 'note');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'done');

-- CreateEnum
CREATE TYPE "RepositoryProvider" AS ENUM ('github', 'gitlab', 'bitbucket', 'custom');

-- CreateEnum
CREATE TYPE "RepositoryAccessType" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "RepositorySyncStatus" AS ENUM ('synced', 'syncing', 'error', 'never_synced');

-- CreateEnum
CREATE TYPE "WebhookEvent" AS ENUM ('push', 'pull_request', 'release', 'tag', 'issue', 'commit_comment');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('artifact', 'document', 'config', 'asset', 'code', 'data', 'other');

-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('private', 'project', 'public');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('idle', 'running', 'awaiting_approval', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('coding', 'content', 'ops', 'research');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('awaiting_approval', 'approved', 'rejected', 'executed', 'failed');

-- CreateEnum
CREATE TYPE "ProposalRiskLevel" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('organization_create', 'project_create', 'project_update', 'project_delete', 'environment_create', 'environment_update', 'environment_delete', 'secret_create', 'secret_update', 'secret_delete', 'secret_reveal', 'secret_export', 'secret_import', 'secret_version_create', 'document_create', 'document_update', 'document_delete', 'task_create', 'task_update', 'task_delete', 'integration_create', 'integration_delete', 'agent_proxy_call', 'proposal_create', 'proposal_approve', 'proposal_reject', 'proposal_execute');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "two_factor_enabled" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "verified" BOOLEAN DEFAULT true,
    "failed_verification_count" INTEGER DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "two_factor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,
    "active_organization_id" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviter_id" TEXT NOT NULL,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apikey" (
    "id" TEXT NOT NULL,
    "config_id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT,
    "start" TEXT,
    "reference_id" TEXT NOT NULL,
    "prefix" TEXT,
    "key" TEXT NOT NULL,
    "refill_interval" INTEGER,
    "refill_amount" INTEGER,
    "last_refill_at" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rate_limit_enabled" BOOLEAN NOT NULL DEFAULT true,
    "rate_limit_time_window" INTEGER,
    "rate_limit_max" INTEGER,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "remaining" INTEGER,
    "last_request" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "permissions" TEXT,
    "metadata" TEXT,

    CONSTRAINT "apikey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_encryption_key" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "wrapped_dek" TEXT NOT NULL,
    "wrap_iv" TEXT NOT NULL,
    "wrap_auth_tag" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'aes-256-gcm',
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_encryption_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environment" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secret" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "environment_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "SecretType" NOT NULL DEFAULT 'env_var',
    "metadata" JSONB,
    "current_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secret_version" (
    "id" TEXT NOT NULL,
    "secret_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "auth_tag" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'aes-256-gcm',
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "content_type" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "secret_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'todo',
    "assignee_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "access_token_encrypted" TEXT,
    "refresh_token_encrypted" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "last_refreshed_at" TIMESTAMP(3),
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "provider" "RepositoryProvider" NOT NULL DEFAULT 'github',
    "url" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "accessType" "RepositoryAccessType" NOT NULL DEFAULT 'private',
    "credential_id" TEXT,
    "last_sync_at" TIMESTAMP(3),
    "sync_status" "RepositorySyncStatus" NOT NULL DEFAULT 'never_synced',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository_webhook" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "event" "WebhookEvent" NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repository_webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_file" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "type" "FileType" NOT NULL DEFAULT 'other',
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storage_id" TEXT NOT NULL,
    "url" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parent_id" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "visibility" "FileVisibility" NOT NULL DEFAULT 'private',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "project_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_share" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "max_downloads" INTEGER,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,

    CONSTRAINT "file_share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_session" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AgentType" NOT NULL DEFAULT 'coding',
    "status" "AgentStatus" NOT NULL DEFAULT 'idle',
    "prompt" TEXT,
    "daytona_sandbox_id" TEXT,
    "sandbox_url" TEXT,
    "current_task" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_proposal" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "agent_session_id" TEXT,
    "created_by_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "riskLevel" "ProposalRiskLevel" NOT NULL DEFAULT 'medium',
    "actionType" TEXT NOT NULL,
    "targetSystem" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'awaiting_approval',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "approved_by_id" TEXT,
    "approval_notes" TEXT,
    "rejection_notes" TEXT,
    "executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "actor_type" TEXT NOT NULL DEFAULT 'user',
    "action" "AuditAction" NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "two_factor_user_id_idx" ON "two_factor"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "account"("user_id");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE INDEX "member_user_id_idx" ON "member"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_organization_id_user_id_key" ON "member"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "invitation_organization_id_idx" ON "invitation"("organization_id");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "invitation"("email");

-- CreateIndex
CREATE INDEX "apikey_config_id_idx" ON "apikey"("config_id");

-- CreateIndex
CREATE INDEX "apikey_reference_id_idx" ON "apikey"("reference_id");

-- CreateIndex
CREATE INDEX "apikey_key_idx" ON "apikey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "organization_encryption_key_organization_id_key" ON "organization_encryption_key"("organization_id");

-- CreateIndex
CREATE INDEX "project_organization_id_idx" ON "project"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_organization_id_slug_key" ON "project"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "environment_project_id_idx" ON "environment"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "environment_project_id_slug_key" ON "environment"("project_id", "slug");

-- CreateIndex
CREATE INDEX "secret_project_id_idx" ON "secret"("project_id");

-- CreateIndex
CREATE INDEX "secret_environment_id_idx" ON "secret"("environment_id");

-- CreateIndex
CREATE UNIQUE INDEX "secret_environment_id_name_key" ON "secret"("environment_id", "name");

-- CreateIndex
CREATE INDEX "secret_version_secret_id_idx" ON "secret_version"("secret_id");

-- CreateIndex
CREATE UNIQUE INDEX "secret_version_secret_id_version_key" ON "secret_version"("secret_id", "version");

-- CreateIndex
CREATE INDEX "document_project_id_idx" ON "document"("project_id");

-- CreateIndex
CREATE INDEX "task_project_id_idx" ON "task"("project_id");

-- CreateIndex
CREATE INDEX "task_assignee_id_idx" ON "task"("assignee_id");

-- CreateIndex
CREATE INDEX "task_project_id_status_idx" ON "task"("project_id", "status");

-- CreateIndex
CREATE INDEX "integration_project_id_idx" ON "integration"("project_id");

-- CreateIndex
CREATE INDEX "integration_project_id_provider_idx" ON "integration"("project_id", "provider");

-- CreateIndex
CREATE INDEX "repository_project_id_idx" ON "repository"("project_id");

-- CreateIndex
CREATE INDEX "repository_provider_idx" ON "repository"("provider");

-- CreateIndex
CREATE INDEX "repository_project_id_provider_idx" ON "repository"("project_id", "provider");

-- CreateIndex
CREATE INDEX "repository_webhook_repository_id_idx" ON "repository_webhook"("repository_id");

-- CreateIndex
CREATE INDEX "repository_webhook_repository_id_event_idx" ON "repository_webhook"("repository_id", "event");

-- CreateIndex
CREATE INDEX "project_file_project_id_idx" ON "project_file"("project_id");

-- CreateIndex
CREATE INDEX "project_file_project_id_type_idx" ON "project_file"("project_id", "type");

-- CreateIndex
CREATE INDEX "project_file_path_idx" ON "project_file"("path");

-- CreateIndex
CREATE INDEX "project_file_storage_id_idx" ON "project_file"("storage_id");

-- CreateIndex
CREATE UNIQUE INDEX "file_share_token_key" ON "file_share"("token");

-- CreateIndex
CREATE INDEX "file_share_file_id_idx" ON "file_share"("file_id");

-- CreateIndex
CREATE INDEX "file_share_token_idx" ON "file_share"("token");

-- CreateIndex
CREATE INDEX "file_share_expires_at_idx" ON "file_share"("expires_at");

-- CreateIndex
CREATE INDEX "agent_session_project_id_idx" ON "agent_session"("project_id");

-- CreateIndex
CREATE INDEX "agent_session_project_id_status_idx" ON "agent_session"("project_id", "status");

-- CreateIndex
CREATE INDEX "action_proposal_project_id_idx" ON "action_proposal"("project_id");

-- CreateIndex
CREATE INDEX "action_proposal_status_idx" ON "action_proposal"("status");

-- CreateIndex
CREATE INDEX "action_proposal_created_at_idx" ON "action_proposal"("created_at");

-- CreateIndex
CREATE INDEX "audit_log_organization_id_created_at_idx" ON "audit_log"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_resource_type_resource_id_idx" ON "audit_log"("resource_type", "resource_id");

-- AddForeignKey
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_encryption_key" ADD CONSTRAINT "organization_encryption_key_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environment" ADD CONSTRAINT "environment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret" ADD CONSTRAINT "secret_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret" ADD CONSTRAINT "secret_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secret_version" ADD CONSTRAINT "secret_version_secret_id_fkey" FOREIGN KEY ("secret_id") REFERENCES "secret"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration" ADD CONSTRAINT "integration_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository" ADD CONSTRAINT "repository_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_webhook" ADD CONSTRAINT "repository_webhook_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_file" ADD CONSTRAINT "project_file_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_file" ADD CONSTRAINT "project_file_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "project_file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_share" ADD CONSTRAINT "file_share_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "project_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_session" ADD CONSTRAINT "agent_session_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_proposal" ADD CONSTRAINT "action_proposal_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_proposal" ADD CONSTRAINT "action_proposal_agent_session_id_fkey" FOREIGN KEY ("agent_session_id") REFERENCES "agent_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_proposal" ADD CONSTRAINT "action_proposal_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_proposal" ADD CONSTRAINT "action_proposal_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
