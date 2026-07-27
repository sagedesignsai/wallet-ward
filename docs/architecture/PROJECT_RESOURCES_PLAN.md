# Project Resources Implementation Plan

## Overview
Transform Flowspace projects into complete development workspaces by adding Git repository management and file/artifact storage capabilities.

## Strategic Alignment

### Autonomous Operations Engine Vision
1. **Autonomous Runtimes** - Agents access code context from repos
2. **Secure Vault** - Git credentials stored securely
3. **Augmentation Hub** - Git/file operations as tools

### Value Proposition
- **Before**: Secrets manager with basic project organization
- **After**: Complete development operations platform with version control and artifact management

---

## Phase 1: Git Repository Integration

### 1.1 Database Schema

```prisma
model Repository {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  // Repository Info
  name        String
  description String?
  provider    String   // github, gitlab, bitbucket, custom
  url         String   // https://github.com/org/repo
  branch      String   @default("main")
  
  // Access Control
  accessType  String   // public, private
  credentialId String? // Reference to secret in vault
  
  // Metadata
  lastSyncAt  DateTime?
  syncStatus  String?  // synced, syncing, error
  metadata    Json?    // stars, forks, language, etc.
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  
  @@index([projectId])
  @@index([provider])
}

model RepositoryWebhook {
  id           String     @id @default(cuid())
  repositoryId String
  repository   Repository @relation(fields: [repositoryId], references: [id], onDelete: Cascade)
  
  event        String     // push, pull_request, release
  url          String
  secret       String
  enabled      Boolean    @default(true)
  
  createdAt    DateTime   @default(now())
  
  @@index([repositoryId])
}
```

### 1.2 API Endpoints

```typescript
// Repository Management
POST   /api/v1/projects/:projectId/repositories
GET    /api/v1/projects/:projectId/repositories
GET    /api/v1/projects/:projectId/repositories/:repoId
PATCH  /api/v1/projects/:projectId/repositories/:repoId
DELETE /api/v1/projects/:projectId/repositories/:repoId

// Repository Operations
POST   /api/v1/projects/:projectId/repositories/:repoId/sync
GET    /api/v1/projects/:projectId/repositories/:repoId/branches
GET    /api/v1/projects/:projectId/repositories/:repoId/commits
GET    /api/v1/projects/:projectId/repositories/:repoId/tree/:path

// Webhook Management
POST   /api/v1/projects/:projectId/repositories/:repoId/webhooks
GET    /api/v1/projects/:projectId/repositories/:repoId/webhooks
DELETE /api/v1/projects/:projectId/repositories/:repoId/webhooks/:webhookId
```

### 1.3 UI Components

```typescript
// Pages
app/dashboard/projects/[projectId]/repositories/
├── page.tsx                    // List all repos
├── new/page.tsx               // Add new repo
└── [repoId]/
    ├── page.tsx               // Repo details
    ├── branches/page.tsx      // Branch management
    ├── commits/page.tsx       // Commit history
    └── settings/page.tsx      // Repo settings

// Components
components/repositories/
├── repository-card.tsx         // Repo display card
├── repository-form.tsx         // Add/edit repo form
├── repository-provider-icon.tsx // GitHub/GitLab icons
├── repository-stats.tsx        // Stars, forks, etc.
├── branch-selector.tsx         // Branch dropdown
├── commit-list.tsx            // Commit history
└── file-tree.tsx              // Repository file browser
```

### 1.4 Integration Points

**Daytona Workspace Integration**
```typescript
// When creating agent session, clone repo to workspace
async function createAgentSession(projectId: string, agentType: string) {
  const repos = await getProjectRepositories(projectId);
  const workspace = await daytona.createWorkspace({
    projectId,
    repositories: repos.map(r => ({
      url: r.url,
      branch: r.branch,
      credentials: await vault.getCredential(r.credentialId)
    }))
  });
  // Agent now has full repo context
}
```

**AI Agent Tool Integration**
```typescript
// New tools for agents
tools: [
  {
    name: "read_repository_file",
    description: "Read a file from linked repository",
    parameters: { repoId, filePath }
  },
  {
    name: "search_repository",
    description: "Search code in repository",
    parameters: { repoId, query, filePattern }
  },
  {
    name: "get_repository_structure",
    description: "Get repository directory structure",
    parameters: { repoId, path }
  }
]
```

### 1.5 Security Considerations

**Credential Storage**
- Git credentials stored as secrets in Secure Vault
- Support for: SSH keys, Personal Access Tokens, OAuth tokens
- Zero-leak pattern: agents never see raw credentials
- Server-side git operations with credential injection

**Access Control**
- Repository access tied to project permissions
- Read-only by default for agents
- Write operations require HITL approval
- Audit log for all git operations

**Webhook Security**
- HMAC signature verification
- IP allowlisting for webhook sources
- Rate limiting per repository

---

## Phase 2: File & Artifact Storage

### 2.1 Database Schema

```prisma
model ProjectFile {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  // File Info
  name        String
  path        String   // folder/subfolder/file.ext
  type        String   // artifact, document, config, asset
  mimeType    String
  size        Int      // bytes
  
  // Storage
  storageId   String   // Appwrite storage file ID
  url         String?  // Public URL if applicable
  
  // Versioning
  version     Int      @default(1)
  parentId    String?  // Previous version
  parent      ProjectFile? @relation("FileVersions", fields: [parentId], references: [id])
  versions    ProjectFile[] @relation("FileVersions")
  
  // Metadata
  tags        String[] // searchable tags
  metadata    Json?    // custom metadata
  
  // Access
  visibility  String   @default("private") // private, project, public
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?
  createdBy   User?    @relation(fields: [createdById], references: [id])
  
  @@index([projectId])
  @@index([type])
  @@index([path])
}

model FileShare {
  id        String      @id @default(cuid())
  fileId    String
  file      ProjectFile @relation(fields: [fileId], references: [id], onDelete: Cascade)
  
  token     String      @unique
  expiresAt DateTime?
  maxDownloads Int?
  downloads Int         @default(0)
  
  createdAt DateTime    @default(now())
  createdById String?
  createdBy User?       @relation(fields: [createdById], references: [id])
  
  @@index([fileId])
  @@index([token])
}
```

### 2.2 API Endpoints

```typescript
// File Management
POST   /api/v1/projects/:projectId/files/upload
GET    /api/v1/projects/:projectId/files
GET    /api/v1/projects/:projectId/files/:fileId
GET    /api/v1/projects/:projectId/files/:fileId/download
PATCH  /api/v1/projects/:projectId/files/:fileId
DELETE /api/v1/projects/:projectId/files/:fileId

// File Operations
GET    /api/v1/projects/:projectId/files/:fileId/versions
POST   /api/v1/projects/:projectId/files/:fileId/restore/:version
POST   /api/v1/projects/:projectId/files/:fileId/share
GET    /api/v1/projects/:projectId/files/search

// Folder Operations
POST   /api/v1/projects/:projectId/files/folder
GET    /api/v1/projects/:projectId/files/tree
```

### 2.3 UI Components

```typescript
// Pages
app/dashboard/projects/[projectId]/files/
├── page.tsx                    // File browser
├── upload/page.tsx            // Upload interface
└── [fileId]/
    ├── page.tsx               // File details
    ├── preview/page.tsx       // File preview
    └── versions/page.tsx      // Version history

// Components
components/files/
├── file-browser.tsx           // Tree view + list view
├── file-upload-zone.tsx       // Drag & drop upload
├── file-card.tsx              // File display card
├── file-preview.tsx           // Preview modal
├── file-version-list.tsx      // Version history
├── file-share-dialog.tsx      // Share link generator
└── file-type-icon.tsx         // File type icons
```

### 2.4 Storage Strategy

**Appwrite Storage Integration**
```typescript
// File upload flow
async function uploadFile(projectId: string, file: File) {
  // 1. Upload to Appwrite Storage
  const storageFile = await appwrite.storage.createFile(
    BUCKET_ID,
    ID.unique(),
    file
  );
  
  // 2. Create database record
  const projectFile = await db.projectFile.create({
    data: {
      projectId,
      name: file.name,
      storageId: storageFile.$id,
      size: file.size,
      mimeType: file.type,
      // ... other fields
    }
  });
  
  // 3. Generate preview if applicable
  if (isImage(file.type)) {
    await generateThumbnail(projectFile.id);
  }
  
  return projectFile;
}
```

**File Types & Organization**
```typescript
enum FileType {
  ARTIFACT = "artifact",    // Build outputs, binaries
  DOCUMENT = "document",    // PDFs, docs
  CONFIG = "config",        // Configuration files
  ASSET = "asset",          // Images, videos
  CODE = "code",            // Source code snippets
  DATA = "data"             // JSON, CSV, etc.
}

// Folder structure
/projects/:projectId/files/
├── artifacts/
│   ├── builds/
│   └── releases/
├── documents/
├── configs/
└── assets/
```

---

## Phase 3: Advanced Features

### 3.1 Agent Write Access (with HITL)

**Git Operations via Proposals**
```typescript
// Agent proposes code change
const proposal = await createProposal({
  type: "git_commit",
  action: {
    repositoryId: "repo_123",
    branch: "feature/agent-update",
    files: [
      { path: "src/utils.ts", content: "..." }
    ],
    message: "feat: add utility function"
  },
  reasoning: "Added helper function for data processing"
});

// After approval, execute git operation
await executeGitCommit(proposal.action);
```

**File Generation via Proposals**
```typescript
// Agent proposes file creation
const proposal = await createProposal({
  type: "file_create",
  action: {
    projectId: "proj_123",
    path: "docs/api-reference.md",
    content: "...",
    type: "document"
  },
  reasoning: "Generated API documentation from code analysis"
});
```

### 3.2 CI/CD Integration

**Build Artifact Storage**
```typescript
// Webhook from CI/CD pipeline
POST /api/v1/projects/:projectId/files/artifact
{
  "name": "app-v1.2.3.tar.gz",
  "type": "artifact",
  "buildId": "build_456",
  "metadata": {
    "version": "1.2.3",
    "commit": "abc123",
    "branch": "main"
  }
}
```

**Automated Workflows**
```typescript
// On git push webhook
async function onGitPush(event: GitPushEvent) {
  // 1. Trigger build
  const build = await triggerBuild(event.repository);
  
  // 2. Store artifacts
  await storeArtifacts(build.outputs);
  
  // 3. Notify agents
  await notifyAgents({
    type: "repository_updated",
    repositoryId: event.repository.id,
    commit: event.commit
  });
}
```

### 3.3 Version Control for Documents

**Document Versioning**
```typescript
// Track document changes like git
interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  diff: string;        // Diff from previous version
  author: string;
  message: string;     // Commit-like message
  createdAt: Date;
}

// Restore previous version
async function restoreDocumentVersion(docId: string, version: number) {
  const targetVersion = await getDocumentVersion(docId, version);
  await updateDocument(docId, targetVersion.content);
}
```

---

## Implementation Timeline

### Week 1-2: Phase 1 Foundation
- [ ] Database schema migration
- [ ] Basic API endpoints (CRUD)
- [ ] Repository list/detail pages
- [ ] GitHub/GitLab provider integration

### Week 3-4: Phase 1 Advanced
- [ ] Daytona workspace integration
- [ ] Agent tools for repo access
- [ ] Webhook support
- [ ] Commit history UI

### Week 5-6: Phase 2 Foundation
- [ ] File storage schema
- [ ] Appwrite storage integration
- [ ] File upload/download API
- [ ] File browser UI

### Week 7-8: Phase 2 Advanced
- [ ] File versioning
- [ ] File sharing
- [ ] Preview generation
- [ ] Search functionality

### Week 9-10: Phase 3
- [ ] Agent write proposals
- [ ] CI/CD webhooks
- [ ] Document versioning
- [ ] Advanced workflows

---

## Success Metrics

### User Engagement
- % of projects with linked repositories
- Average files per project
- Agent tool usage for repo operations

### Platform Value
- Reduction in context switching (stay in Flowspace)
- Increase in agent effectiveness (with code context)
- User retention improvement

### Technical Performance
- File upload/download speed
- Repository sync latency
- Storage costs per project

---

## Risk Mitigation

### Storage Costs
- **Risk**: Large files increase storage costs
- **Mitigation**: File size limits, compression, lifecycle policies

### Git Credential Security
- **Risk**: Credential leakage
- **Mitigation**: Zero-leak pattern, encrypted storage, audit logs

### Performance
- **Risk**: Large repos slow down operations
- **Mitigation**: Shallow clones, lazy loading, caching

### Complexity
- **Risk**: Feature creep, maintenance burden
- **Mitigation**: Phased rollout, MVP first, user feedback

---

## Open Questions

1. **Repository Limits**: How many repos per project?
2. **File Size Limits**: Max file size for uploads?
3. **Storage Quotas**: Per-project or per-organization?
4. **Git Providers**: Support all providers or start with GitHub?
5. **Pricing Impact**: How does this affect pricing tiers?

---

## Next Steps

1. **Review & Approve Plan**: Stakeholder alignment
2. **Create Detailed Specs**: Technical specifications per phase
3. **Design UI/UX**: Mockups for all new pages
4. **Set Up Infrastructure**: Appwrite storage buckets, webhooks
5. **Begin Phase 1**: Start with database schema migration
