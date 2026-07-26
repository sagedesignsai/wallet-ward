# SAAS Integrations Guide

Complete guide for setting up and using SAAS integrations in Flowspace.

## Overview

Flowspace supports the following SAAS integrations:

- **Jira** - Project management and issue tracking
- **Notion** - Knowledge base and documentation
- **Airtable** - Database and spreadsheet management
- **Trello** - Kanban-style project management

All integrations use OAuth 2.0 for secure authentication and store encrypted tokens using AES-256-GCM encryption.

## Architecture

### Security Model

1. **OAuth Flow**: Standard OAuth 2.0 authorization code flow
2. **Token Storage**: Encrypted using organization-specific DEK (Data Encryption Key)
3. **Token Refresh**: Automatic refresh when tokens expire (within 5 minutes of expiry)
4. **Agent Access**: Tokens never exposed to agents - decrypted server-side only
5. **Audit Trail**: All integration actions logged to audit log

### Token Management

- Access tokens stored encrypted in `Integration.accessTokenEncrypted`
- Refresh tokens stored encrypted in `Integration.refreshTokenEncrypted`
- Token expiry tracked in `Integration.tokenExpiresAt`
- Last refresh tracked in `Integration.lastRefreshedAt`
- Scopes stored in `Integration.scopes[]`

## Setup Instructions

### 1. Jira Integration

#### Create Jira OAuth App

1. Go to [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Click "Create" → "OAuth 2.0 integration"
3. Configure your app:
   - **App name**: Flowspace
   - **Callback URL**: `https://your-domain.com/api/integrations/jira/callback`
4. Add permissions:
   - `read:jira-work` - Read Jira work data
   - `write:jira-work` - Create and update issues
   - `read:jira-user` - Read user information
   - `offline_access` - Refresh token support
5. Copy the **Client ID** and **Client Secret**

#### Environment Variables

```bash
JIRA_CLIENT_ID=your_client_id
JIRA_CLIENT_SECRET=your_client_secret
```

#### Features

- Create issues (tasks, bugs, stories, epics)
- Set issue properties (summary, description, priority, assignee)
- Add labels and link to projects
- Automatic cloud ID detection

#### AI Tool Usage

```typescript
// Create a Jira issue
await jiraCreateIssueTool.execute({
  projectId: "proj_123",
  summary: "Implement user authentication",
  description: "Add OAuth 2.0 authentication flow",
  issueType: "Task",
  priority: "High",
  jiraProjectKey: "PROJ",
  labels: ["backend", "security"]
})
```

### 2. Notion Integration

#### Create Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Configure your integration:
   - **Name**: Flowspace
   - **Associated workspace**: Select your workspace
   - **Type**: Public integration
4. Set capabilities:
   - Read content
   - Update content
   - Insert content
5. Add redirect URL: `https://your-domain.com/api/integrations/notion/callback`
6. Copy the **OAuth client ID** and **OAuth client secret**

#### Environment Variables

```bash
NOTION_CLIENT_ID=your_client_id
NOTION_CLIENT_SECRET=your_client_secret
```

#### Features

- Create pages in databases or as child pages
- Set page properties (title, rich text, dates)
- Add content blocks to pages
- Access workspace information

#### AI Tool Usage

```typescript
// Create a Notion page
await notionCreatePageTool.execute({
  projectId: "proj_123",
  parentId: "page_or_database_id",
  title: "Project Documentation",
  content: "This is the main documentation for the project.",
  properties: {
    Status: { select: { name: "In Progress" } }
  }
})
```

### 3. Airtable Integration

#### Create Airtable OAuth App

1. Go to [Airtable Developer Hub](https://airtable.com/create/oauth)
2. Click "Register new OAuth integration"
3. Configure your app:
   - **App name**: Flowspace
   - **Redirect URL**: `https://your-domain.com/api/integrations/airtable/callback`
4. Add scopes:
   - `data.records:read` - Read records
   - `data.records:write` - Create and update records
   - `schema.bases:read` - Read base schema
5. Copy the **Client ID** and **Client Secret**

#### Environment Variables

```bash
AIRTABLE_CLIENT_ID=your_client_id
AIRTABLE_CLIENT_SECRET=your_client_secret
```

#### Features

- Create records in tables
- Set field values (text, number, select, date, etc.)
- Read base schema
- Access multiple bases

#### AI Tool Usage

```typescript
// Create an Airtable record
await airtableCreateRecordTool.execute({
  projectId: "proj_123",
  baseId: "appXXXXXXXXXXXXXX",
  tableIdOrName: "Tasks",
  fields: {
    Name: "Implement feature X",
    Status: "In Progress",
    Priority: "High",
    "Due Date": "2024-12-31"
  }
})
```

### 4. Trello Integration

#### Create Trello Power-Up

1. Go to [Trello Power-Ups Admin](https://trello.com/power-ups/admin)
2. Click "New" → "Create Power-Up"
3. Configure your Power-Up:
   - **Name**: Flowspace
   - **Iframe connector URL**: `https://your-domain.com`
4. Get your API Key from [Trello API Key page](https://trello.com/app-key)
5. Note: Trello uses OAuth 1.0a (token-based authentication)

#### Environment Variables

```bash
TRELLO_API_KEY=your_api_key
```

#### Features

- Create cards in lists
- Set card properties (name, description, due date)
- Add labels and members
- Position cards (top/bottom)

#### AI Tool Usage

```typescript
// Create a Trello card
await trelloCreateCardTool.execute({
  projectId: "proj_123",
  listId: "list_id",
  name: "Implement user dashboard",
  description: "Create a dashboard with analytics",
  position: "top",
  dueDate: "2024-12-31T23:59:59Z",
  labelIds: ["label_id_1", "label_id_2"]
})
```

## Agent Proxy Tool

All SAAS integrations are accessible through the unified `agentProxyTool`:

```typescript
// Make authenticated API calls to any SAAS provider
await agentProxyTool.execute({
  integrationId: "int_123",
  service: "jira", // or "notion", "airtable", "trello"
  method: "GET",
  path: "/rest/api/3/issue/PROJ-123",
  body: null
})
```

### Supported Services

- `jira` - Base URL: `https://api.atlassian.com`
- `notion` - Base URL: `https://api.notion.com`
- `airtable` - Base URL: `https://api.airtable.com`
- `trello` - Base URL: `https://api.trello.com`

## Database Schema

### Integration Model

```prisma
model Integration {
  id                    String    @id @default(cuid())
  projectId             String
  provider              String    // "jira", "notion", "airtable", "trello"
  name                  String
  accessTokenEncrypted  String?
  refreshTokenEncrypted String?
  tokenExpiresAt        DateTime?
  lastRefreshedAt       DateTime?
  scopes                String[]
  metadata              Json?     // Provider-specific metadata
  enabled               Boolean   @default(true)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

### Metadata Structure

#### Jira
```json
{
  "cloudId": "cloud-id",
  "siteName": "Your Site",
  "siteUrl": "https://your-site.atlassian.net",
  "scope": "read:jira-work write:jira-work"
}
```

#### Notion
```json
{
  "workspaceId": "workspace-id",
  "workspaceName": "Your Workspace",
  "workspaceIcon": "icon-url",
  "botId": "bot-id"
}
```

#### Airtable
```json
{
  "userId": "user-id",
  "scope": "data.records:read data.records:write"
}
```

#### Trello
```json
{
  "username": "username",
  "fullName": "Full Name",
  "apiKey": "api-key"
}
```

## API Endpoints

### Connect Integration

```http
POST /api/integrations/{provider}/connect
Content-Type: application/json

{
  "projectId": "proj_123"
}

Response:
{
  "url": "https://oauth-provider.com/authorize?..."
}
```

### OAuth Callback

```http
GET /api/integrations/{provider}/callback?code=xxx&state=xxx
```

Redirects to: `/dashboard/projects/{projectId}?integration=connected`

### Health Check

```http
GET /api/v1/integrations/{integrationId}/health

Response:
{
  "healthy": true,
  "provider": "jira",
  "lastChecked": "2024-01-01T00:00:00Z",
  "tokenExpiry": "2024-12-31T23:59:59Z"
}
```

## Token Refresh

Tokens are automatically refreshed when:
1. Token expires within 5 minutes
2. API call returns 401 Unauthorized
3. Health check detects expired token

### Refresh Flow

```typescript
// Automatic refresh in getDecryptedToken()
if (shouldRefreshToken(integration)) {
  await refreshIntegrationToken(integration.id, organizationId)
}
```

### Supported Providers

- ✅ Jira (OAuth 2.0 with refresh tokens)
- ✅ Airtable (OAuth 2.0 with refresh tokens)
- ❌ Notion (tokens don't expire)
- ❌ Trello (OAuth 1.0a tokens don't expire)

## Sandbox Credential Injection

Integrations can be injected into Daytona sandboxes as environment variables:

```typescript
await injectIntegrationCredentials(sandboxId, integrationId, organizationId)
```

### Environment Variables Set

```bash
PROVIDER_TOKEN=decrypted_access_token
PROVIDER_API_URL=https://api.provider.com
PROVIDER_SCOPES=scope1,scope2,scope3
```

## Security Best Practices

1. **Never log tokens** - Tokens are sensitive credentials
2. **Use HTTPS only** - All OAuth flows require HTTPS
3. **Validate state tokens** - Prevent CSRF attacks
4. **Rotate tokens regularly** - Use refresh tokens when available
5. **Audit all actions** - Log integration usage to audit trail
6. **Limit scopes** - Request minimum required permissions
7. **Encrypt at rest** - All tokens encrypted with org-specific DEK

## Troubleshooting

### OAuth Flow Fails

1. Check callback URL matches exactly (including protocol)
2. Verify client ID and secret are correct
3. Ensure all required scopes are requested
4. Check OAuth app is enabled/published

### Token Refresh Fails

1. Verify refresh token is stored
2. Check token hasn't been revoked
3. Ensure client secret is correct
4. Review provider's token refresh documentation

### API Calls Fail

1. Check token hasn't expired
2. Verify required scopes are granted
3. Review provider's API documentation
4. Check rate limits haven't been exceeded

### Integration Not Found

1. Verify integration exists and is enabled
2. Check project ID is correct
3. Ensure user has access to project
4. Review integration permissions

## Testing

### Manual Testing

1. Create OAuth app in provider's developer console
2. Set environment variables
3. Connect integration through UI
4. Test specialized tools or agent proxy
5. Verify tokens are encrypted in database
6. Check audit logs for integration actions

### Integration Tests

```typescript
// Example integration test
describe("Jira Integration", () => {
  it("should create issue", async () => {
    const result = await jiraCreateIssueTool.execute({
      projectId: testProjectId,
      summary: "Test Issue",
      issueType: "Task",
      jiraProjectKey: "TEST"
    })
    expect(result.success).toBe(true)
    expect(result.issueKey).toMatch(/^TEST-\d+$/)
  })
})
```

## Migration

To add SAAS integrations to existing database:

```bash
# Run migration
npx prisma migrate deploy

# Or create new migration
npx prisma migrate dev --name add_saas_providers
```

## Support

For issues or questions:
1. Check provider's API documentation
2. Review audit logs for error details
3. Verify OAuth app configuration
4. Check environment variables are set correctly

## Resources

- [Jira Cloud REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Notion API](https://developers.notion.com/)
- [Airtable API](https://airtable.com/developers/web/api/introduction)
- [Trello API](https://developer.atlassian.com/cloud/trello/rest/)
