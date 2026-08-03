# Seeding Tool - Quick Reference

## Overview

The seeding tool generates complete, realistic project data with proper relationships for testing and development.

## Quick Start

```bash
# Basic seeding (2 orgs, 3 projects each)
npx tsx scripts/seed.ts

# With custom counts
npx tsx scripts/seed.ts --orgs 5 --projects 10 --users 8

# With AI generation (requires OPENROUTER_API_KEY)
npx tsx scripts/seed.ts --enable-ai

# With git repositories
npx tsx scripts/seed.ts --git-repos https://github.com/user/repo.git

# Combine all options
npx tsx scripts/seed.ts \
  --orgs 5 \
  --projects 10 \
  --enable-ai \
  --ai-model meta-llama/llama-2-7b-chat \
  --git-repos https://github.com/user/repo.git
```

## CLI Arguments

| Argument | Type | Default | Description |
|----------|------|---------|-------------|
| `--orgs` | number | 2 | Number of organizations |
| `--projects` | number | 3 | Projects per organization |
| `--users` | number | 4 | Users per organization |
| `--environments` | number | 2 | Environments per project |
| `--secrets` | number | 3 | Secrets per environment |
| `--documents` | number | 3 | Documents per project |
| `--tasks` | number | 5 | Tasks per project |
| `--files` | number | 4 | Files per project |
| `--repos` | number | 2 | Repositories per project |
| `--enable-ai` | flag | false | Enable AI content generation |
| `--ai-model` | string | meta-llama/llama-2-7b-chat | AI model to use |
| `--git-repos` | string | - | Comma-separated git URLs to clone |

## What Gets Created

For each organization:
- N users with org-level roles (owner, member)
- N projects with:
  - N environments (dev, staging, prod, etc.)
  - N secrets per environment
  - N documents
  - N tasks (some assigned to users)
  - N files (code, config, docs)
  - N repositories

## Data Model

```
Organization
├── Users (2-8)
├── Projects (1-20)
│   ├── Environments (1-5)
│   │   └── Secrets (1-10)
│   ├── Documents (1-10)
│   ├── Tasks (1-20, some assigned to users)
│   ├── Files (1-10)
│   └── Repositories (1-5)
└── Audit Logs (automatic)
```

## Programmatic Usage

```typescript
import { SeedOrchestrator } from '@/lib/seeding'
import type { SeedConfig } from '@/lib/seeding/types'

const orchestrator = new SeedOrchestrator({
  enableAI: true,
  aiApiKey: process.env.OPENROUTER_API_KEY
})

const config: SeedConfig = {
  organizationCount: 3,
  projectsPerOrg: 5,
  usersPerOrg: 4,
  environmentsPerProject: 2,
  secretsPerEnvironment: 3,
  documentsPerProject: 3,
  tasksPerProject: 5,
  filesPerProject: 4,
  repositoriesPerProject: 2
}

const result = await orchestrator.executeSeed(config)
console.log(result.stats)
```

## API Usage

```bash
# Check configuration
curl http://localhost:3000/api/admin/seed

# Execute seeding
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Content-Type: application/json" \
  -d '{
    "organizationCount": 2,
    "projectsPerOrg": 3,
    "usersPerOrg": 4,
    "environmentsPerProject": 2,
    "secretsPerEnvironment": 3,
    "documentsPerProject": 3,
    "tasksPerProject": 5,
    "filesPerProject": 4,
    "repositoriesPerProject": 2
  }'
```

## AI Generation

When enabled with `--enable-ai`:

- **Project descriptions** - AI-generated context-aware descriptions
- **Document content** - Realistic markdown documentation
- **Task descriptions** - Actionable, detailed task specifications
- **Repository enrichment** - Enhanced repo descriptions
- **Project tags** - Technology-relevant categorization

**Requirements:**
- Set `OPENROUTER_API_KEY` environment variable
- Sufficient API credits for generation volume

## Git Integration

Clone and process repositories:

```bash
npx tsx scripts/seed.ts --git-repos \
  https://github.com/vercel/next.js.git,\
  https://github.com/facebook/react.git
```

**Features:**
- Safe cloning to isolated temp directory
- Extracts code, config, documentation files
- Parses package.json and README metadata
- Limits file count (50) and size (1MB per file)
- Automatic cleanup after processing

## Performance

| Scale | Time | Notes |
|-------|------|-------|
| Basic (2 orgs, 3 projects) | ~5-10s | No AI |
| Medium (5 orgs, 10 projects) | ~15-30s | No AI |
| Large (10+ orgs, 20+ projects) | ~30-60s | No AI |
| With 1 git repo | +5-15s | Clone + extract |
| With AI generation | +2-5s per item | Depends on API |

## Output Example

```
🌱 Starting seed operation...
Configuration: { organizationCount: 2, projectsPerOrg: 3, ... }
💾 Seeding database...
✓ Seeding complete!

📊 Results:
  Organizations created: 2
  Users created: 8
  Projects created: 6
  Environments created: 12
  Secrets created: 36
  Documents created: 18
  Tasks created: 30
  Files created: 24
  Repositories created: 12
```

## Common Scenarios

### Testing Dashboard
```bash
npx tsx scripts/seed.ts --orgs 2 --projects 3 --users 5
```

### Full Integration Test
```bash
npx tsx scripts/seed.ts \
  --orgs 3 \
  --projects 5 \
  --enable-ai \
  --git-repos https://github.com/vercel/next.js.git
```

### Minimal Quick Test
```bash
npx tsx scripts/seed.ts \
  --orgs 1 --projects 1 --users 2 \
  --environments 1 --secrets 1 \
  --documents 1 --tasks 1 \
  --files 1 --repos 1
```

### Stress Test
```bash
npx tsx scripts/seed.ts \
  --orgs 20 \
  --projects 50 \
  --users 10 \
  --environments 3 \
  --secrets 5
```

## Troubleshooting

**No data appears?**
- Check DATABASE_URL is set correctly
- Ensure database is running
- Check Prisma migrations are up to date

**Git clone fails?**
- Verify repository URL is correct
- Check internet connectivity
- Ensure git is installed

**AI generation fails?**
- Check OPENROUTER_API_KEY is set
- Verify API key is valid
- Check remaining API credits

**TypeErrors?**
- Run `pnpm db:generate` to regenerate Prisma client
- Run `pnpm typecheck` to verify types

## Module Structure

```
lib/seeding/
├── types.ts                    # Type definitions
├── data-generator.ts          # Data generation
├── database-seeder.ts         # Database operations
├── repository-handler.ts      # Git operations
├── ai-content-generator.ts    # AI operations
├── orchestrator.ts            # Main orchestrator
├── examples.ts                # Usage examples
├── index.ts                   # Module exports
└── README.md                  # Full documentation
```

## Environment Variables

```
# AI generation (optional)
OPENROUTER_API_KEY=your-api-key

# Database connection (required)
DATABASE_URL=postgresql://user:pass@localhost/db
```

## Next Steps

1. Try basic seeding: `npx tsx scripts/seed.ts`
2. Check generated data in your database
3. Explore variations with different counts
4. Enable AI for richer content
5. Integrate git repositories for real data
