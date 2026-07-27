# UI/UX Implementation Roadmap

**Date**: 2026-07-26  
**Status**: 📋 Planning  
**Timeline**: 3 Weeks  

---

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FLOWSPACE UI/UX ROADMAP                         │
└─────────────────────────────────────────────────────────────────────┘

Week 1: CRITICAL UX (Make it Usable)
├─ Dashboard: Pending Approvals Widget
├─ Proposals: Auto-refresh polling  
├─ Enhanced Approval Cards
└─ Notification Badges

Week 2: ADVANCED FEATURES (Power Users)
├─ Enhanced Filtering & Search
├─ Grouped & Timeline Views
├─ Bulk Actions
└─ Agent Hub Integration

Week 3: POLISH (Production Ready)
├─ Mobile Optimization
├─ Loading States & Errors
├─ Accessibility (a11y)
└─ Performance Tuning
```

---

## Phase 1: Critical UX (Week 1)

### Goal
Make approval workflow discoverable and eliminate friction

### Task 1.1: Dashboard Pending Approvals Widget (4h)

**What**: Add prominent widget showing proposals needing approval

**Files to Create**:
- `components/dashboard/pending-approvals-widget.tsx`
- `hooks/use-pending-approvals.ts`

**Files to Modify**:
- `app/dashboard/page.tsx` (add widget)

**Component Structure**:
```tsx
<Card className="border-amber-500/50 bg-amber-500/5">
  <CardHeader>
    <WarningIcon /> Pending Your Approval
    <Badge>{count}</Badge>
  </CardHeader>
  <CardContent>
    {proposals.slice(0, 5).map(p => (
      <CompactProposalRow 
        proposal={p}
        onQuickApprove={handleQuickApprove}
      />
    ))}
    <Button href="/dashboard/proposals">View All →</Button>
  </CardContent>
</Card>
```

**Acceptance Criteria**:
- [ ] Shows top 5 pending proposals
- [ ] Displays agent type, risk level, title
- [ ] "View All" navigates to proposals page
- [ ] Updates when new proposals arrive
- [ ] Hidden when no pending proposals

---

### Task 1.2: Auto-Refresh Polling (2h)

**What**: Automatically refresh proposals every 5 seconds

**Files to Modify**:
- `hooks/use-proposals.ts` (add polling logic)
- `app/dashboard/proposals/page.tsx` (show last updated)

**Implementation**:
```tsx
// hooks/use-proposals.ts
useEffect(() => {
  if (!enablePolling) return
  
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      fetchProposals({ silent: true })
    }
  }, 5000)
  
  return () => clearInterval(interval)
}, [enablePolling, fetchProposals])
```

**UI Additions**:
```tsx
<div className="text-xs text-muted-foreground">
  Last updated: <TimeAgo date={lastFetchedAt} />
  {isRefreshing && <SpinnerIcon className="ml-2 animate-spin" />}
</div>
```

**Acceptance Criteria**:
- [ ] Polls every 5 seconds when page visible
- [ ] Stops polling when page hidden
- [ ] Shows visual indicator during refresh
- [ ] Doesn't disrupt user interactions
- [ ] Displays "Last updated" timestamp

---

### Task 1.3: Enhanced Approval Cards (4h)

**What**: Show agent context, execution results, and failures

**Files to Modify**:
- `components/proposals/approval-card.tsx` (major enhancement)

**Files to Create**:
- `components/proposals/agent-context-section.tsx`
- `components/proposals/execution-result-section.tsx`
- `components/proposals/execution-failure-section.tsx`

**New Sections**:

**A. Agent Context**:
```tsx
<CardHeader>
  <div className="flex items-start gap-3">
    <AgentAvatar type={session.agentType} status={session.status} />
    <div>
      <h3>{getAgentName(session)}</h3>
      <Badge>{session.agentType}</Badge>
      <p>Session: {session.id.slice(0, 8)}</p>
      <p>Started <TimeAgo date={session.startedAt} /></p>
    </div>
  </div>
  <RiskBadge level={proposal.riskLevel} />
</CardHeader>
```

**B. Execution Result**:
```tsx
{proposal.status === "executed" && (
  <Alert variant="success">
    <CheckCircleIcon />
    <AlertTitle>Execution Successful</AlertTitle>
    <AlertDescription>
      {execution.deploymentUrl && (
        <Link href={execution.deploymentUrl}>
          View Deployment →
        </Link>
      )}
      <Collapsible>
        <CollapsibleTrigger>View Logs</CollapsibleTrigger>
        <CollapsibleContent>
          <CodeBlock>{execution.logs}</CodeBlock>
        </CollapsibleContent>
      </Collapsible>
    </AlertDescription>
  </Alert>
)}
```

**C. Failure Display**:
```tsx
{proposal.status === "failed" && (
  <Alert variant="destructive">
    <WarningIcon />
    <AlertTitle>Execution Failed</AlertTitle>
    <AlertDescription>
      <code>{error.message}</code>
      <Button onClick={handleRetry}>Retry</Button>
    </AlertDescription>
  </Alert>
)}
```

**Acceptance Criteria**:
- [ ] Shows agent avatar and session info
- [ ] Displays execution results for successful actions
- [ ] Shows error details for failures
- [ ] Includes retry button for failed actions
- [ ] Collapsible logs section
- [ ] Links to related resources (deployments, PRs, etc.)

---

### Task 1.4: Notification Badges (2h)

**What**: Show pending count in sidebar navigation

**Files to Modify**:
- `components/dashboard/dashboard-sidebar.tsx`
- `hooks/use-pending-approvals.ts` (create if not exists)

**Implementation**:
```tsx
// In sidebar
const { pendingCount } = usePendingApprovals()

// Update nav item
{
  label: "Proposals",
  href: "/dashboard/proposals",
  icon: CheckCircleIcon,
  badge: pendingCount > 0 ? pendingCount : null,
  urgent: pendingCount > 0
}
```

**Styling**:
```tsx
<Badge 
  variant={urgent ? "destructive" : "outline"}
  className={cn(
    "ml-auto h-5 px-2 text-xs font-bold",
    urgent && "animate-pulse"
  )}
>
  {badge}
</Badge>
```

**Acceptance Criteria**:
- [ ] Badge shows pending count in sidebar
- [ ] Badge pulses/highlights when urgent
- [ ] Updates in real-time
- [ ] Hidden when count is 0
- [ ] Also shows in dashboard header (optional)

---

## Phase 2: Advanced Features (Week 2)

### Task 2.1: Enhanced Filtering (4h)

**What**: Add filters for agent type, risk level, date range, search

**Files to Create**:
- `components/proposals/proposal-filters.tsx`
- `components/proposals/filters/agent-type-filter.tsx`
- `components/proposals/filters/risk-level-filter.tsx`
- `components/proposals/filters/date-range-filter.tsx`
- `components/proposals/filters/search-filter.tsx`

**Files to Modify**:
- `app/dashboard/proposals/page.tsx`
- `hooks/use-proposals.ts` (support filter params)

**UI Layout**:
```tsx
<ProposalsToolbar>
  <ProjectSelect />
  <StatusSelect />
  <AgentTypeSelect />
  <RiskLevelSelect />
  <DateRangePicker />
  <SearchInput placeholder="Search proposals..." />
  <Button onClick={clearFilters}>Clear</Button>
</ProposalsToolbar>
```

**Filter State**:
```tsx
const [filters, setFilters] = useState({
  projectId: undefined,
  status: "all",
  agentType: "all",
  riskLevel: "all",
  dateRange: { from: null, to: null },
  search: ""
})
```

**Acceptance Criteria**:
- [ ] All filters work correctly
- [ ] Filters persist in URL params
- [ ] Clear filters button works
- [ ] Active filters show count badge
- [ ] Mobile: Filters in bottom sheet
- [ ] Search highlights matching text

---

### Task 2.2: Grouped View (4h)

**What**: Group proposals by status with collapsible sections

**Files to Create**:
- `components/proposals/proposal-group.tsx`
- `components/proposals/compact-proposal-card.tsx`

**Files to Modify**:
- `app/dashboard/proposals/page.tsx`

**Structure**:
```tsx
<ProposalsContainer>
  <ProposalGroup 
    title="⏳ Awaiting Approval"
    count={pendingProposals.length}
    priority="high"
    defaultExpanded={true}
  >
    {pendingProposals.map(p => <ApprovalCard />)}
  </ProposalGroup>
  
  <ProposalGroup 
    title="✅ Executed"
    count={executedProposals.length}
    collapsible={true}
  >
    {executedProposals.map(p => <CompactCard />)}
  </ProposalGroup>
  
  <ProposalGroup title="❌ Rejected">
    {rejectedProposals.map(p => <CompactCard />)}
  </ProposalGroup>
</ProposalsContainer>
```

**Acceptance Criteria**:
- [ ] Groups render correctly
- [ ] Collapsible groups work
- [ ] Pending group always expanded
- [ ] Empty groups show placeholder
- [ ] Group counts update dynamically
- [ ] Smooth animations

---

### Task 2.3: Timeline View (6h)

**What**: Alternative view showing proposals chronologically

**Files to Create**:
- `components/proposals/proposal-timeline.tsx`
- `components/proposals/timeline-item.tsx`
- `components/proposals/view-mode-toggle.tsx`

**Files to Modify**:
- `app/dashboard/proposals/page.tsx`

**Layout**:
```tsx
<ViewModeToggle 
  value={viewMode}
  options={["list", "grid", "timeline"]}
  onChange={setViewMode}
/>

{viewMode === "timeline" && (
  <ProposalTimeline>
    {proposalsByDate.map(({ date, proposals }) => (
      <TimelineSection date={date}>
        {proposals.map(proposal => (
          <TimelineItem 
            proposal={proposal}
            showConnector={true}
          />
        ))}
      </TimelineSection>
    ))}
  </ProposalTimeline>
)}
```

**Visual Design**:
```
Today
  ├─ 10:45 AM ● Deploy to Production (Executed)
  └─ 09:30 AM ● Publish Newsletter (Awaiting)

Yesterday  
  ├─ 03:15 PM ● Delete Old Secrets (Rejected)
  └─ 01:20 PM ● Create GitHub PR (Executed)
```

**Acceptance Criteria**:
- [ ] Timeline renders chronologically
- [ ] Visual connectors between items
- [ ] Date headers (Today, Yesterday, etc.)
- [ ] Compact cards in timeline
- [ ] Smooth scrolling
- [ ] Works with filters

---

### Task 2.4: Bulk Actions (4h)

**What**: Select multiple proposals and approve/reject in batch

**Files to Create**:
- `components/proposals/bulk-actions-bar.tsx`
- `components/proposals/proposal-checkbox.tsx`
- `hooks/use-bulk-selection.ts`

**Files to Modify**:
- `components/proposals/approval-card.tsx` (add checkbox)
- `app/dashboard/proposals/page.tsx`

**UI**:
```tsx
{selectedProposals.length > 0 && (
  <BulkActionsBar>
    <span>{selectedProposals.length} selected</span>
    <Button onClick={handleBulkApprove}>
      Approve All
    </Button>
    <Button variant="destructive" onClick={handleBulkReject}>
      Reject All
    </Button>
    <Button variant="ghost" onClick={clearSelection}>
      Clear
    </Button>
  </BulkActionsBar>
)}
```

**Confirmation Dialog**:
```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogTitle>
      Approve {selectedCount} Proposals?
    </AlertDialogTitle>
    <AlertDialogDescription>
      This will execute the following actions:
      {selectedProposals.map(p => (
        <li>{p.title} ({p.riskLevel})</li>
      ))}
    </AlertDialogDescription>
    <AlertDialogAction onClick={confirmBulkApprove}>
      Approve All
    </AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

**Acceptance Criteria**:
- [ ] Checkbox selection works
- [ ] Bulk actions bar appears
- [ ] Confirmation dialog shows details
- [ ] Can approve/reject in batch
- [ ] Shows progress indicator
- [ ] Handles partial failures gracefully
- [ ] Clear selection after action

---

### Task 2.5: Agent Hub Integration (3h)

**What**: Connect agent sessions to their proposals

**Files to Modify**:
- `app/dashboard/agents/page.tsx`
- `components/proposals/proposal-session-filter.tsx`

**Agent Card Enhancement**:
```tsx
<AgentSessionCard session={session}>
  {/* Existing content */}
  
  {session.pendingProposals?.length > 0 && (
    <Alert variant="warning">
      <WarningIcon />
      <AlertTitle>Waiting for Approval</AlertTitle>
      <AlertDescription>
        {session.pendingProposals.length} action(s) need review.
        <Button asChild variant="link">
          <Link href={`/dashboard/proposals?session=${session.id}`}>
            Review Now →
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )}
</AgentSessionCard>
```

**Session Filter in Proposals**:
```tsx
// In proposals page
const sessionId = searchParams.get('session')

{sessionId && (
  <Alert>
    <InfoIcon />
    Showing proposals from session: {sessionId}
    <Button onClick={clearFilter}>Clear</Button>
  </Alert>
)}
```

**Acceptance Criteria**:
- [ ] Agent cards show pending proposals
- [ ] Link navigates with session filter
- [ ] Filter banner shows in proposals page
- [ ] Can clear session filter
- [ ] Works with other filters

---

## Phase 3: Polish & Production (Week 3)

### Task 3.1: Mobile Optimization (6h)

**What**: Make all features work smoothly on mobile

**Changes Across Files**:

**Responsive Layouts**:
```tsx
// Approval card
<Card className="lg:grid lg:grid-cols-3">
  <div className="lg:col-span-2">
    <ProposalDetails />
  </div>
  <div className="lg:col-span-1">
    <ProposalActions />
  </div>
</Card>

// Filters
<Sheet>
  <SheetTrigger className="lg:hidden">
    Filters ({count})
  </SheetTrigger>
  <SheetContent>
    <FilterPanel />
  </SheetContent>
</Sheet>
```

**Touch Targets**:
```tsx
// Ensure buttons are at least 44x44px
<Button className="min-h-[44px] min-w-[44px]" />
```

**Files to Modify**:
- All proposal components
- Dashboard widgets
- Filter controls

**Acceptance Criteria**:
- [ ] All interactions work on touch
- [ ] No horizontal scroll
- [ ] Filters accessible via sheet
- [ ] Cards stack properly
- [ ] Touch targets ≥44px
- [ ] Lighthouse mobile score >90

---

### Task 3.2: Loading States (3h)

**What**: Add skeleton loaders and progressive loading

**Files to Create**:
- `components/proposals/proposal-skeleton.tsx`
- `components/proposals/proposals-loading.tsx`

**Implementation**:
```tsx
{isLoading ? (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <ProposalSkeleton key={i} />
    ))}
  </div>
) : (
  <ProposalsList proposals={proposals} />
)}
```

**Empty States**:
```tsx
<Empty 
  icon={<CheckCircleIcon className="size-12" />}
  title="No proposals yet"
  description="When agents propose actions, they'll appear here."
  action={
    <Button onClick={openAgentChat}>
      Launch Agent
    </Button>
  }
/>
```

**Acceptance Criteria**:
- [ ] Skeleton screens match real layout
- [ ] Loading states for all async operations
- [ ] Empty states for all list views
- [ ] Progressive loading for large lists
- [ ] No layout shift during load

---

### Task 3.3: Error Handling (3h)

**What**: Graceful error handling with retry

**Files to Create**:
- `components/proposals/error-boundary.tsx`
- `components/proposals/error-state.tsx`

**Error UI**:
```tsx
<ErrorState
  title="Failed to load proposals"
  message={error.message}
  onRetry={handleRetry}
  actionLabel="Try Again"
/>
```

**Network Errors**:
```tsx
try {
  await approveProposal(id)
  toast.success("Approved successfully")
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    toast.error("Connection lost. Please try again.")
  } else {
    toast.error(error.message)
  }
}
```

**Acceptance Criteria**:
- [ ] Error boundaries catch React errors
- [ ] Network errors show retry button
- [ ] Toast notifications for actions
- [ ] Helpful error messages
- [ ] No blank screens on error

---

### Task 3.4: Accessibility (4h)

**What**: Ensure WCAG 2.1 AA compliance

**Checklist**:

**Keyboard Navigation**:
```tsx
<ApprovalCard
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter') openModal()
  }}
/>
```

**ARIA Labels**:
```tsx
<Button 
  aria-label={`Approve ${proposal.title}`}
  aria-describedby={`proposal-${proposal.id}-description`}
>
  Approve
</Button>
```

**Focus Management**:
```tsx
useEffect(() => {
  if (modalOpen) {
    modalRef.current?.focus()
  }
}, [modalOpen])
```

**Color Contrast**:
```tsx
// Ensure all text meets 4.5:1 ratio
<Badge className="bg-amber-600 text-white">
  {/* Passes contrast check */}
</Badge>
```

**Testing**:
```bash
# Run axe-core
npm run test:a11y

# Manual keyboard testing
# - Tab through all interactive elements
# - Enter/Space to activate
# - Escape to close modals
```

**Acceptance Criteria**:
- [ ] Full keyboard navigation
- [ ] Screen reader compatible
- [ ] ARIA labels on all controls
- [ ] Focus indicators visible
- [ ] No color-only indicators
- [ ] Zero axe violations

---

### Task 3.5: Performance Optimization (4h)

**What**: Optimize for speed and smooth interactions

**Optimizations**:

**Virtualized Lists**:
```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

const virtualizer = useVirtualizer({
  count: proposals.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 200,
})

// Render only visible items
{virtualizer.getVirtualItems().map(item => (
  <ApprovalCard proposal={proposals[item.index]} />
))}
```

**Optimistic Updates**:
```tsx
const approveProposal = async (id: string) => {
  // Update UI immediately
  setProposals(prev => 
    prev.map(p => 
      p.id === id 
        ? { ...p, status: 'approved' } 
        : p
    )
  )
  
  try {
    await api.approve(id)
  } catch (error) {
    // Rollback on error
    setProposals(original)
    toast.error("Failed to approve")
  }
}
```

**Memoization**:
```tsx
const filteredProposals = useMemo(() => 
  proposals.filter(matchesFilters),
  [proposals, filters]
)
```

**Code Splitting**:
```tsx
const ProposalModal = lazy(() => 
  import('./proposal-modal')
)
```

**Acceptance Criteria**:
- [ ] Large lists (100+) render smoothly
- [ ] Interactions feel instant (optimistic)
- [ ] Bundle size optimized
- [ ] Images lazy loaded
- [ ] No unnecessary re-renders
- [ ] Lighthouse performance >90

---

## Timeline Summary

```
Week 1 (12 hours)
├─ Day 1-2: Dashboard widget + Auto-refresh
├─ Day 3-4: Enhanced cards + Badges
└─ Day 5:   Buffer + Testing

Week 2 (21 hours)
├─ Day 1-2: Filtering + Search
├─ Day 3:   Grouped view
├─ Day 4:   Timeline view
├─ Day 5:   Bulk actions + Integration
└─ Weekend: Buffer

Week 3 (20 hours)
├─ Day 1-2: Mobile optimization
├─ Day 3:   Loading + Error states
├─ Day 4:   Accessibility
├─ Day 5:   Performance
└─ Weekend: Final QA
```

**Total Estimated Effort**: 53 hours (2-3 weeks for 1 developer)

---

## Success Metrics

**Week 1 Targets**:
- [ ] Pending approvals widget on dashboard
- [ ] Auto-refresh working
- [ ] Enhanced cards deployed
- [ ] Badges showing counts

**Week 2 Targets**:
- [ ] All filters functional
- [ ] Grouped view preferred by users
- [ ] Timeline view complete
- [ ] Bulk actions working

**Week 3 Targets**:
- [ ] Mobile Lighthouse score >90
- [ ] Zero accessibility violations
- [ ] Performance Lighthouse >90
- [ ] Production ready

---

**Status**: 📋 Ready to Start  
**Next**: Begin Phase 1, Task 1.1
