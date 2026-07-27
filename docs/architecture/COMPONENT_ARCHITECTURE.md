# Component Architecture Reference

**Purpose**: Quick reference for building UI components in the approval workflow system

---

## Component Hierarchy

```
Dashboard
├── PendingApprovalsWidget
│   ├── CompactProposalRow
│   └── Badge (pending count)
├── ActivityFeed
│   ├── AgentSessionCard
│   ├── ProposalAlertCard
│   └── ExecutionSummaryCard
└── VaultHealthCard

Proposals Page
├── ProposalsToolbar
│   ├── ProjectSelect
│   ├── StatusSelect
│   ├── AgentTypeFilter
│   ├── RiskLevelFilter
│   ├── DateRangePicker
│   ├── SearchInput
│   └── ViewModeToggle
├── BulkActionsBar (conditional)
├── ProposalsContainer
│   ├── ProposalGroup (List View)
│   │   └── ApprovalCard[]
│   ├── ProposalTimeline (Timeline View)
│   │   └── TimelineItem[]
│   └── ProposalGrid (Grid View)
│       └── CompactProposalCard[]
└── ProposalModal (detailed view)

ApprovalCard
├── AgentContextSection
│   ├── AgentAvatar
│   └── AgentMetadata
├── ProposalDetails
│   ├── Title & Description
│   ├── RiskBadge
│   ├── ActionTypeLabel
│   └── PayloadPreview
├── ExecutionResultSection (if executed)
│   ├── ResultHeader
│   ├── DeploymentLinks
│   └── LogsCollapsible
├── ExecutionFailureSection (if failed)
│   ├── ErrorAlert
│   └── RetryButton
└── ApprovalActions
    ├── NotesTextarea
    ├── ApproveButton
    └── RejectButton

Agent Hub
├── AgentPersonaCards[]
└── AgentSessionCard
    ├── SessionStatus
    ├── PendingProposalsAlert (NEW)
    └── SandboxPreview
```

---

## New Components to Build

### 1. PendingApprovalsWidget
**Location**: `components/dashboard/pending-approvals-widget.tsx`

**Props**:
```typescript
interface PendingApprovalsWidgetProps {
  organizationId: string
  limit?: number  // default 5
  compact?: boolean
}
```

**State**:
```typescript
const [proposals, setProposals] = useState<ActionProposalDto[]>([])
const [isLoading, setIsLoading] = useState(true)
```

**Features**:
- Auto-refresh every 10 seconds
- Click proposal → navigate to proposals page with ID
- "Quick approve" button (optional)
- Animated entry when new proposal arrives

---

### 2. CompactProposalRow
**Location**: `components/proposals/compact-proposal-row.tsx`

**Props**:
```typescript
interface CompactProposalRowProps {
  proposal: ActionProposalDto
  onClick?: () => void
  showQuickActions?: boolean
  className?: string
}
```

**Layout**:
```
[Icon] [Title]                    [Risk] [Time]
       [Agent Type] [Target]
```

**Size**: ~60px height (compact)

---

### 3. AgentAvatar
**Location**: `components/agents/agent-avatar.tsx`

**Props**:
```typescript
interface AgentAvatarProps {
  type: "coding" | "content" | "ops" | "research"
  size?: "sm" | "md" | "lg"  // 32px, 48px, 64px
  status?: "idle" | "running" | "awaiting_approval" | "completed"
  showStatus?: boolean
  className?: string
}
```

**Visual**:
- Circle with agent icon
- Color based on type (blue/violet/amber/emerald)
- Status indicator (dot) in bottom-right
- Animated pulse when running

---

### 4. AgentContextSection
**Location**: `components/proposals/agent-context-section.tsx`

**Props**:
```typescript
interface AgentContextSectionProps {
  agentSession: AgentSessionDto | null
  proposal: ActionProposalDto
}
```

**Shows**:
- Agent avatar + name
- Agent type badge
- Session ID (short)
- Started timestamp
- Link to agent session (if exists)

---

### 5. ExecutionResultSection
**Location**: `components/proposals/execution-result-section.tsx`

**Props**:
```typescript
interface ExecutionResultSectionProps {
  result: ExecutionResult
  proposal: ActionProposalDto
  collapsible?: boolean
}
```

**Displays**:
- Success banner
- Deployment URL (if applicable)
- Commit SHA (if applicable)
- Execution duration
- Logs (collapsible)

---

### 6. ExecutionFailureSection
**Location**: `components/proposals/execution-failure-section.tsx`

**Props**:
```typescript
interface ExecutionFailureSectionProps {
  error: ExecutionError
  proposal: ActionProposalDto
  onRetry?: () => void
}
```

**Shows**:
- Error alert
- Error message (formatted)
- Stack trace (collapsible, dev only)
- Retry button
- "Contact support" link

---

### 7. ProposalGroup
**Location**: `components/proposals/proposal-group.tsx`

**Props**:
```typescript
interface ProposalGroupProps {
  title: string
  count: number
  priority?: "normal" | "high"
  defaultExpanded?: boolean
  collapsible?: boolean
  children: React.ReactNode
}
```

**Features**:
- Collapsible header
- Count badge
- Priority highlighting (high = amber border)
- Smooth expand/collapse animation

---

### 8. ProposalTimeline
**Location**: `components/proposals/proposal-timeline.tsx`

**Props**:
```typescript
interface ProposalTimelineProps {
  proposals: ActionProposalDto[]
  groupBy?: "date" | "agent" | "project"
  compact?: boolean
}
```

**Layout**:
```
Today
  10:45 ●─── Deploy to Production
  09:30 ●─── Publish Newsletter
         │
Yesterday
  15:20 ●─── Delete Old Secrets
```

---

### 9. BulkActionsBar
**Location**: `components/proposals/bulk-actions-bar.tsx`

**Props**:
```typescript
interface BulkActionsBarProps {
  selectedCount: number
  onApproveAll: () => Promise<void>
  onRejectAll: () => Promise<void>
  onClear: () => void
  disabled?: boolean
}
```

**Position**: Sticky at bottom of viewport

**Features**:
- Slide-in animation
- Loading states during bulk operations
- Progress indicator
- Error handling

---

### 10. ProposalFilters
**Location**: `components/proposals/proposal-filters.tsx`

**Props**:
```typescript
interface ProposalFiltersProps {
  filters: ProposalFilters
  onChange: (filters: ProposalFilters) => void
  projects: ProjectDto[]
  mobile?: boolean
}
```

**State Shape**:
```typescript
interface ProposalFilters {
  projectId?: string
  status?: ProposalStatus | "all"
  agentType?: AgentType | "all"
  riskLevel?: ProposalRiskLevel | "all"
  dateRange?: { from: Date | null; to: Date | null }
  search?: string
}
```

---

## Shared Components

### RiskBadge (Already Created)
**Location**: `components/proposals/risk-badge.tsx`

**Usage**:
```tsx
<RiskBadge level="high" size="sm" />
```

**Colors**:
- low: green
- medium: yellow
- high: orange
- critical: red

---

### TimeAgo (Already Exists)
**Location**: `components/dashboard/time-ago.tsx`

**Usage**:
```tsx
<TimeAgo date={proposal.createdAt} />
```

---

### Badge (shadcn/ui)
**Location**: `components/ui/badge.tsx`

**Variants**:
- default, secondary, destructive, outline

**Usage**:
```tsx
<Badge variant="outline">{count}</Badge>
```

---

### Alert (shadcn/ui)
**Location**: `components/ui/alert.tsx`

**Variants**:
- default, destructive

**Usage**:
```tsx
<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>...</AlertDescription>
</Alert>
```

---

## Hooks

### usePendingApprovals
**Location**: `hooks/use-pending-approvals.ts`

**Returns**:
```typescript
{
  proposals: ActionProposalDto[]
  count: number
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}
```

**Features**:
- Auto-polling (every 10s)
- Org-scoped
- Cached with SWR or React Query

---

### useBulkSelection
**Location**: `hooks/use-bulk-selection.ts`

**Returns**:
```typescript
{
  selected: Set<string>
  isSelected: (id: string) => boolean
  toggle: (id: string) => void
  selectAll: () => void
  clear: () => void
  selectedItems: T[]
}
```

**Usage**:
```tsx
const { selected, toggle, selectedItems } = useBulkSelection(proposals)
```

---

### useProposalFilters
**Location**: `hooks/use-proposal-filters.ts`

**Returns**:
```typescript
{
  filters: ProposalFilters
  setFilter: (key: string, value: any) => void
  clearFilters: () => void
  activeFiltersCount: number
}
```

**Features**:
- Syncs with URL search params
- Persists on page reload

---

## Styling Conventions

### Color Palette

**Agent Types**:
```typescript
const AGENT_COLORS = {
  coding: {
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
  },
  content: {
    text: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
  },
  ops: {
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
  },
  research: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
  },
}
```

**Risk Levels**:
```typescript
const RISK_COLORS = {
  low: {
    text: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-950",
    border: "border-green-500/25",
  },
  medium: {
    text: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-950",
    border: "border-yellow-500/25",
  },
  high: {
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-950",
    border: "border-orange-500/25",
  },
  critical: {
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-950",
    border: "border-red-500/25",
  },
}
```

**Status Colors**:
```typescript
const STATUS_COLORS = {
  awaiting_approval: "text-yellow-400",
  approved: "text-green-400",
  rejected: "text-red-400",
  executed: "text-blue-400",
  failed: "text-red-400",
}
```

---

### Spacing Scale

```typescript
// Use Tailwind's spacing scale
gap-2   // 8px
gap-3   // 12px
gap-4   // 16px
gap-6   // 24px

p-3     // 12px padding
p-4     // 16px padding
p-6     // 24px padding
```

---

### Typography Scale

```typescript
// Headings
text-3xl font-bold  // Page title
text-xl font-bold   // Section title
text-lg font-semibold // Card title
text-sm font-medium // Labels

// Body
text-sm             // Default body
text-xs             // Metadata, timestamps
text-[10px]         // Micro labels
```

---

### Border Radius

```typescript
rounded-lg    // 8px - Cards
rounded-md    // 6px - Buttons
rounded-xl    // 12px - Large cards
rounded-2xl   // 16px - Dashboard sections
```

---

## Animation Standards

### Transitions
```typescript
// Default transition
transition-colors duration-200

// Hover effects
hover:bg-muted/30 transition-colors

// State changes
data-[state=open]:animate-in
data-[state=closed]:animate-out
```

### Loading States
```typescript
// Spinner
<SpinnerIcon className="animate-spin" />

// Pulse
<div className="animate-pulse bg-muted h-4 w-32 rounded" />

// Skeleton
<Skeleton className="h-64 w-full" />
```

### Entry Animations
```typescript
// Slide in from bottom
animate-in slide-in-from-bottom-5 duration-300

// Fade in
animate-in fade-in duration-200
```

---

## Responsive Breakpoints

```typescript
// Mobile first
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Laptops
xl: 1280px  // Desktops
2xl: 1536px // Large screens
```

**Usage**:
```tsx
<div className="
  flex flex-col gap-2
  lg:flex-row lg:gap-4
  xl:gap-6
">
```

---

## Accessibility Requirements

### Keyboard Navigation
```typescript
// All interactive elements must support:
- Tab / Shift+Tab (focus)
- Enter / Space (activate)
- Escape (close/cancel)
- Arrow keys (navigation within component)
```

### ARIA Labels
```typescript
<Button 
  aria-label="Approve proposal: Deploy to production"
  aria-describedby="proposal-description-123"
/>
```

### Focus Indicators
```typescript
// Always visible focus ring
focus:ring-2 focus:ring-primary focus:ring-offset-2
```

### Color Contrast
```typescript
// Minimum 4.5:1 for normal text
// Minimum 3:1 for large text (18px+)

// Test with:
npm run test:a11y
```

---

## Testing Strategy

### Component Tests
```typescript
// Test rendering
it('renders proposal card with correct data', () => {
  render(<ApprovalCard proposal={mockProposal} />)
  expect(screen.getByText(mockProposal.title)).toBeInTheDocument()
})

// Test interactions
it('calls onApprove when approve button clicked', async () => {
  const onApprove = jest.fn()
  render(<ApprovalCard proposal={mockProposal} onApprove={onApprove} />)
  await userEvent.click(screen.getByRole('button', { name: /approve/i }))
  expect(onApprove).toHaveBeenCalledWith(mockProposal.id)
})
```

### Integration Tests
```typescript
// Test full workflow
it('approves proposal and shows success message', async () => {
  render(<ProposalsPage />)
  await userEvent.click(screen.getByText(/approve/i))
  await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
  await waitFor(() => {
    expect(screen.getByText(/approved successfully/i)).toBeInTheDocument()
  })
})
```

---

## Performance Guidelines

### Memoization
```typescript
const filteredProposals = useMemo(
  () => proposals.filter(matchesFilters),
  [proposals, filters]
)

const MemoizedCard = memo(ApprovalCard)
```

### Lazy Loading
```typescript
const ProposalModal = lazy(() => import('./proposal-modal'))

// Use with Suspense
<Suspense fallback={<Skeleton />}>
  <ProposalModal />
</Suspense>
```

### Virtualization
```typescript
// For lists with 100+ items
import { useVirtualizer } from '@tanstack/react-virtual'

const virtualizer = useVirtualizer({
  count: proposals.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 200,
})
```

---

## File Structure

```
components/
├── dashboard/
│   ├── pending-approvals-widget.tsx (NEW)
│   ├── activity-feed.tsx (NEW)
│   └── ...
├── proposals/
│   ├── approval-card.tsx (EXISTS)
│   ├── compact-proposal-row.tsx (NEW)
│   ├── agent-context-section.tsx (NEW)
│   ├── execution-result-section.tsx (NEW)
│   ├── execution-failure-section.tsx (NEW)
│   ├── proposal-group.tsx (NEW)
│   ├── proposal-timeline.tsx (NEW)
│   ├── bulk-actions-bar.tsx (NEW)
│   ├── proposal-filters.tsx (NEW)
│   └── index.ts
├── agents/
│   ├── agent-avatar.tsx (NEW)
│   └── ...
└── ui/ (shadcn/ui components)

hooks/
├── use-proposals.ts (EXISTS)
├── use-pending-approvals.ts (NEW)
├── use-bulk-selection.ts (NEW)
├── use-proposal-filters.ts (NEW)
└── ...
```

---

**Last Updated**: 2026-07-26  
**Status**: Reference Guide  
**Next**: Start building Phase 1 components
