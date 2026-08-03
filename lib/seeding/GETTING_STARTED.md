# Getting Started with the Seeding Tool

## What is This?

A powerful, modular seeding tool that generates complete, realistic project data with proper relationships for testing and development.

## Quick Start (30 seconds)

```bash
# Generate test data right now
npx tsx scripts/seed.ts

# Watch for output like:
# 🌱 Starting seed operation...
# 💾 Seeding database...
# ✓ Seeding complete!
# 
# 📊 Results:
#   Organizations created: 2
#   Users created: 8
#   Projects created: 6
#   ... and more
```

That's it! Your database now has realistic test data.

## What Just Happened?

The command created:
- 2 organizations
- 8 users (4 per org)
- 6 projects (3 per org)
- 12 environments
- 36 secrets
- 18 documents
- 30 tasks
- 24 files
- 12 repositories

All with proper relationships and realistic data.

## Next: Customize It

### More Organizations
```bash
npx tsx scripts/seed.ts --orgs 10
```

### Larger Scale
```bash
npx tsx scripts/seed.ts --orgs 5 --projects 20 --users 8
```

### AI-Powered Content
```bash
# Set environment variable first
export OPENROUTER_API_KEY=your-api-key

# Then run with AI enabled
npx tsx scripts/seed.ts --enable-ai
```

### With Real GitHub Repos
```bash
npx tsx scripts/seed.ts --git-repos https://github.com/vercel/next.js.git
```

### Everything Combined
```bash
npx tsx scripts/seed.ts \
  --orgs 5 \
  --projects 10 \
  --enable-ai \
  --git-repos https://github.com/vercel/next.js.git,https://github.com/facebook/react.git
```

## Usage Patterns

### 1. CLI (Easiest)
```bash
npx tsx scripts/seed.ts [options]
```
See all options: `npx tsx scripts/seed.ts --help`

### 2. API (For Apps)
```typescript
const response = await fetch('http://localhost:3000/api/admin/seed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organizationCount: 2,
    projectsPerOrg: 3,
    usersPerOrg: 4,
    // ... more options
  })
})

const result = await response.json()
```

### 3. Programmatic (In Your Code)
```typescript
import { SeedOrchestrator } from '@/lib/seeding'

const orchestrator = new SeedOrchestrator({
  enableAI: true,
  aiApiKey: process.env.OPENROUTER_API_KEY
})

const result = await orchestrator.executeSeed({
  organizationCount: 2,
  projectsPerOrg: 3,
  // ... more options
})

console.log(result.stats)
```

## Module Structure

```
lib/seeding/
├── types.ts                 # Type definitions
├── data-generator.ts        # Generates realistic data
├── database-seeder.ts       # Creates DB records
├── repository-handler.ts    # Clones git repos
├── ai-content-generator.ts  # AI-powered content
├── orchestrator.ts          # Coordinates everything
├── index.ts                 # Clean exports
├── examples.ts              # Usage examples
├── README.md                # Full documentation
├── QUICK_REFERENCE.md       # Command reference
├── GETTING_STARTED.md       # This file
└── IMPLEMENTATION_SUMMARY.md # Technical details
```

## Common Tasks

### Testing a Feature
```bash
# Create minimal data set
npx tsx scripts/seed.ts --orgs 1 --projects 1 --users 2
```

### Demo/Screenshot
```bash
# Create realistic-looking data
npx tsx scripts/seed.ts --orgs 3 --projects 5 --enable-ai
```

### Integration Testing
```bash
# Create larger dataset
npx tsx scripts/seed.ts --orgs 5 --projects 10 --users 5
```

### Load Testing
```bash
# Create big dataset
npx tsx scripts/seed.ts --orgs 20 --projects 50 --users 10
```

## Troubleshooting

### No data appears?
1. Check database is running: `npx tsx scripts/seed.ts`
2. Check DATABASE_URL is set correctly
3. Run migrations if needed

### Want to clear data?
```bash
# Run a query to delete seeded data
# In your database client, delete records from the tables
# Or reset the database completely
```

### Want more AI content?
```bash
# Make sure OPENROUTER_API_KEY is set
export OPENROUTER_API_KEY=sk-...

# Then run with --enable-ai
npx tsx scripts/seed.ts --enable-ai
```

### Performance too slow?
```bash
# Reduce counts
npx tsx scripts/seed.ts --orgs 2 --projects 3

# Or skip AI
npx tsx scripts/seed.ts --orgs 10  # no AI, faster
```

## File Sizes & Performance

| File | Size | Purpose |
|------|------|---------|
| `data-generator.ts` | 176 lines | Generates realistic data |
| `database-seeder.ts` | 282 lines | Creates DB records |
| `repository-handler.ts` | 153 lines | Clones git repos |
| `ai-content-generator.ts` | 136 lines | AI content generation |
| `orchestrator.ts` | 95 lines | Coordinates everything |
| `script/seed.ts` | 168 lines | CLI tool |
| **Total** | **~2600 lines** | Complete seeding system |

## What Data Gets Created?

Each organization includes:
```
Organization
  ├── Users (with org roles)
  └── Projects
      ├── Environments (dev, staging, prod)
      ├── Secrets (with encryption)
      ├── Documents (markdown)
      ├── Tasks (with assignments)
      ├── Files (code, config, docs)
      └── Repositories (git repos)
```

All relationships are properly maintained with foreign keys and constraints.

## Advanced Features

### AI Generation
When enabled, the tool generates:
- Context-aware project descriptions
- Realistic documentation
- Actionable task specifications
- Enhanced repository descriptions
- Relevant technology tags

### Git Integration
Clone and process repositories:
- Safely clones to temp directory
- Extracts relevant files (code, config, docs)
- Parses metadata from package.json
- Automatically cleans up

### Error Resilience
- Continues if one entity fails
- Reports detailed error logs
- Graceful fallbacks if AI unavailable
- Safe cleanup even on errors

## Next Steps

1. **Try it now:** `npx tsx scripts/seed.ts`
2. **Check data:** Open your database client, query the tables
3. **Explore options:** `npx tsx scripts/seed.ts --help`
4. **Use in tests:** Import and use in your test suite
5. **Read full docs:** See `README.md` for comprehensive documentation

## Quick Reference

```bash
# Basic
npx tsx scripts/seed.ts

# 5 orgs, 10 projects
npx tsx scripts/seed.ts --orgs 5 --projects 10

# With AI (requires OPENROUTER_API_KEY)
npx tsx scripts/seed.ts --enable-ai

# With git repos
npx tsx scripts/seed.ts --git-repos https://github.com/user/repo.git

# Minimal data for quick test
npx tsx scripts/seed.ts --orgs 1 --projects 1

# All options
npx tsx scripts/seed.ts --help
```

## That's It!

The seeding tool is ready to use. Start with the quick start command above and explore from there. See the full documentation in `README.md` for advanced features.

Happy testing! 🚀
