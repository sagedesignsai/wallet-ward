# Seeding Tool Documentation

## Overview

The seeding tool is a modular system designed to generate complete, realistic project data with proper relationships. It can create organizations, users, projects, environments, secrets, documents, tasks, files, and repositories with interconnected data.

## Architecture

### Modular Structure

The tool is organized into clear, separated concerns:

```
lib/seeding/
├── types.ts                 # Core type definitions
├── data-generator.ts        # Generates realistic mock data
├── database-seeder.ts       # Creates database records with relationships
├── repository-handler.ts    # Clones and processes git repos
├── ai-content-generator.ts  # AI-powered dynamic content (optional)
└── orchestrator.ts          # Coordinates all operations
```

### Component Responsibilities

**types.ts**
- `SeedConfig`: Configuration for seeding operation
- `SeedContext`: Tracks created entities and their IDs
- `GeneratedData`: Result of seeding operation
- `RepositoryData`: Extracted data from git repositories

**data-generator.ts**
- Generates realistic organization names, emails, project slugs
- Creates contextual titles and descriptions
- Produces mock secret values of various types
- Generates task titles and document content templates

**database-seeder.ts**
- Creates all database entities through Prisma
- Manages relationships between entities
- Maintains context about created IDs
- Handles errors gracefully per entity

**repository-handler.ts**
- Clones git repositories safely in temp directory
- Extracts relevant files (code, config, docs)
- Parses package.json and README for metadata
- Limits file sizes and types to prevent bloat
- Cleans up temporary files after processing

**ai-content-generator.ts**
- Uses Vercel AI SDK with OpenRouter provider
- Generates dynamic project descriptions
- Creates contextual document content
- Enriches repository data with better descriptions
- Generates technology tags

**orchestrator.ts**
- Orchestrates the complete seeding workflow
- Handles git repository processing
- Initializes AI generator if enabled
- Provides cleanup and error handling

## Usage

### CLI Usage

```bash
# Basic seeding with defaults
npx tsx scripts/seed.ts

# Seed with custom counts
npx tsx scripts/seed.ts --orgs 5 --projects 10 --users 8

# Enable AI content generation
npx tsx scripts/seed.ts --enable-ai --ai-model meta-llama/llama-2-7b-chat

# Process git repositories
npx tsx scripts/seed.ts --git-repos https://github.com/user/repo1.git,https://github.com/user/repo2.git

# Full example with all options
npx tsx scripts/seed.ts \
  --orgs 3 \
  --projects 5 \
  --users 6 \
  --enable-ai \
  --ai-model meta-llama/llama-2-7b-chat \
  --git-repos https://github.com/user/repo.git
```

### API Usage

```bash
# Check seed configuration
curl -X GET http://localhost:3000/api/admin/seed \
  -H "Authorization: Bearer YOUR_TOKEN"

# Execute seeding
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "organizationCount": 2,
    "projectsPerOrg": 3,
    "usersPerOrg": 4,
    "environmentsPerProject": 2,
    "secretsPerEnvironment": 3,
    "documentsPerProject": 3,
    "tasksPerProject": 5,
    "filesPerProject": 4,
    "repositoriesPerProject": 2,
    "aiGeneration": {
      "enabled": false
    }
  }'
```

### Programmatic Usage

```typescript
import { SeedOrchestrator } from '@/lib/seeding/orchestrator'
import type { SeedConfig } from '@/lib/seeding/types'

const orchestrator = new SeedOrchestrator({
  enableAI: true,
  aiApiKey: process.env.OPENROUTER_API_KEY
})

const config: SeedConfig = {
  organizationCount: 2,
  projectsPerOrg: 3,
  usersPerOrg: 4,
  environmentsPerProject: 2,
  secretsPerEnvironment: 3,
  documentsPerProject: 3,
  tasksPerProject: 5,
  filesPerProject: 4,
  repositoriesPerProject: 2,
  aiGeneration: { enabled: false },
  gitRepos: ['https://github.com/user/repo.git']
}

const result = await orchestrator.executeSeed(config)
console.log(result.stats)
```

## Configuration Options

```typescript
interface SeedConfig {
  // Entity counts
  organizationCount: number          // Number of organizations to create
  projectsPerOrg: number             // Projects per organization
  usersPerOrg: number                // Users per organization
  environmentsPerProject: number     // Environments per project
  secretsPerEnvironment: number      // Secrets per environment
  documentsPerProject: number        // Documents per project
  tasksPerProject: number            // Tasks per project
  filesPerProject: number            // Files per project
  repositoriesPerProject: number     // Repositories per project

  // AI Generation (optional)
  aiGeneration?: {
    enabled: boolean
    provider?: string
    model?: string
  }

  // Git Repository URLs to clone and process
  gitRepos?: string[]
}
```

## Data Model

### Generated Structure

```
Organization (1)
├── Members (N users per org with roles)
├── Projects (N per org)
│   ├── Environments (N per project)
│   │   └── Secrets (N per environment)
│   ├── Documents (N per project)
│   ├── Tasks (N per project, some assigned to users)
│   ├── Files (N per project)
│   └── Repositories (N per project)
└── Audit Logs (tracked automatically)
```

### Data Relationships

- Users have org-level roles (owner, admin, member, viewer)
- Projects are scoped to organizations
- Environments are scoped to projects
- Secrets belong to environment + project
- Documents are created by users, scoped to projects
- Tasks can be assigned to users within org
- Files have creator, type, and visibility settings
- Repositories are scoped to projects

## Advanced Features

### AI Content Generation

When enabled with `--enable-ai`, the tool uses the AI SDK to generate:

1. **Project Descriptions** - Context-aware descriptions based on project name
2. **Document Content** - Realistic documentation based on title and context
3. **Task Descriptions** - Actionable, detailed descriptions with acceptance criteria
4. **Repository Metadata** - Enhanced descriptions from existing repos
5. **Project Tags** - Technology-relevant tags based on project details

**Requirements:**
- Set `OPENROUTER_API_KEY` environment variable
- Sufficient API credits for your generation volume

### Git Repository Integration

The tool can clone and process public/private git repositories:

1. **Repository Cloning** - Uses git CLI for safe cloning
2. **File Extraction** - Extracts code, config, and documentation files
3. **Size Limiting** - Only includes files up to 1MB, max 50 files per repo
4. **Type Filtering** - Focuses on relevant file types (.ts, .js, .json, .md, .yaml, .sql)
5. **Metadata Parsing** - Extracts description from package.json or README
6. **Cleanup** - Removes temporary files after processing

## Performance Considerations

### Execution Time

- Basic seeding (2 orgs, 3 projects each): ~5-10 seconds
- With git repos (1 repo): +5-15 seconds per repo
- With AI generation: +2-5 seconds per generated item

### Database Load

- Each operation creates multiple records with relationships
- Prisma handles transaction management automatically
- Consider running during off-peak hours for large seeds

### Scaling Tips

1. Use reasonable counts (start with small numbers, increase gradually)
2. Run AI generation selectively (not on every field)
3. Process git repos separately if needed
4. Monitor database connections during execution

## Error Handling

The tool includes comprehensive error handling:

- Per-entity error tracking (doesn't fail entirely on one error)
- Graceful git clone failures (continues with other repos)
- AI generation fallbacks to static data
- Repository cleanup even if operations fail
- Detailed error logging and reporting

## Monitoring & Logging

The CLI and API provide detailed feedback:

```json
{
  "success": true,
  "message": "Seeding completed successfully",
  "stats": {
    "organizationsCreated": 2,
    "projectsCreated": 6,
    "usersCreated": 8,
    "environmentsCreated": 12,
    "secretsCreated": 36,
    "documentsCreated": 18,
    "tasksCreated": 30,
    "filesCreated": 24,
    "repositoriesCreated": 12
  },
  "errors": []
}
```

## Security Considerations

1. **Admin Only**: API endpoints require admin authorization
2. **No Real Credentials**: Generated secrets use mock values, never expose real data
3. **Safe Cloning**: Git repositories cloned to isolated temp directory
4. **File Limits**: Only extracts limited file count and size to prevent bloat
5. **Extension Filtering**: Only processes known-safe file types

## Extending the Tool

### Adding New Entity Types

1. Add generator methods to `DataGenerator`
2. Add creation logic to `DatabaseSeeder`
3. Update `SeedConfig` type with new counts
4. Update CLI with new arguments
5. Document in this file

### Custom AI Prompts

Modify `AIContentGenerator` to create domain-specific content:

```typescript
async generateCustomContent(input: string): Promise<string> {
  const prompt = `Your custom prompt: ${input}`
  const result = await generateText({
    model: this.model,
    prompt,
    maxTokens: 500
  })
  return result.text
}
```

### Integration with Other Systems

The orchestrator can be extended to:

1. Export data to external services
2. Trigger webhooks after seeding
3. Create agent sessions automatically
4. Generate audit trails
5. Notify users of test data creation

## Troubleshooting

### Git Clone Fails

```
Error cloning repository: fatal - repository not found
```

- Check repository URL is correct
- Ensure repo is public or provide credentials
- Check internet connectivity

### AI Generation Errors

```
Error generating content: API rate limit exceeded
```

- Check OPENROUTER_API_KEY is valid
- Verify sufficient credits available
- Reduce counts to use fewer API calls

### Database Connection Issues

```
Error creating organization: ECONNREFUSED
```

- Verify DATABASE_URL is set correctly
- Check database is running
- Ensure network access to database

## Next Steps

1. Set up proper authentication for the API endpoint
2. Add database transaction handling for rollback capability
3. Implement batch operations for better performance
4. Create seed templates for different scenarios
5. Add export/import functionality for seed data
