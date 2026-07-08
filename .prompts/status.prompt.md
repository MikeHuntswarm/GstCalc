# Status Check

## Trigger

When user says: `status`, `where are we`, `what's the status`, `project status`, `show progress`

## Prerequisites

Reference: `.claude/skills/project-agent/SKILL.md` (Mode 5: Session Continuity)

## Action Sequence

### Step 1: Load Project State

```bash
# Read machine-readable state
cat .project-state.json

# Fallback: parse PROJECT_PLAN.md if no JSON
```

**Parse these fields:**

- `projectName` - Display name
- `currentPhase` / `totalPhases` - Progress tracking
- `phases[currentPhase-1].name` - Current phase name
- `phases[currentPhase-1].tasks` - Task list with status
- `lastSession` - Previous session context
- `securityDebt` - Outstanding security issues
- `cicd.failedRuns` - Failed workflow tracking

### Step 2: Calculate Progress

```
# Phase progress
completedTasks = count(phases[current].tasks where status == "completed")
totalTasks = count(phases[current].tasks)
phaseProgress = (completedTasks / totalTasks) * 100

# Overall progress
completedPhases = currentPhase - 1
overallProgress = ((completedPhases + phaseProgress/100) / totalPhases) * 100

# Progress bar (10 chars)
filledBars = floor(phaseProgress / 10)
progressBar = "█" × filledBars + "░" × (10 - filledBars)
```

### Step 3: Check CI/CD Status

```bash
# Get recent workflow runs
gh run list --limit 5 --json status,conclusion,name,createdAt 2>/dev/null

# Count failures
failedCount = count(runs where conclusion == "failure")
inProgressCount = count(runs where status == "in_progress")
```

### Step 4: Identify Next Tasks

```
nextTasks = phases[current].tasks
  .filter(t => t.status == "pending")
  .slice(0, 3)
```

## Output Format

```
┌─────────────────────────────────────────────────┐
│ 📊 PROJECT STATUS: [projectName]                │
├─────────────────────────────────────────────────┤
│ Phase [currentPhase] of [totalPhases]: [name]   │
│ Progress: [██████████] 100% | Overall: XX%      │
├─────────────────────────────────────────────────┤
│ LAST SESSION: [lastSession.date]                │
│ • Completed: [list or "None"]                   │
│ • In Progress: [task or "None"]                 │
├─────────────────────────────────────────────────┤
│ NEXT UP:                                        │
│ 1. [X.Y] [First pending task]                   │
│ 2. [X.Y] [Second pending task]                  │
│ 3. [X.Y] [Third pending task]                   │
├─────────────────────────────────────────────────┤
│ CI/CD: [✓ All passing / ⚠️ X failed / 🔄 Running]│
│ BLOCKERS: [None / list items]                   │
│ SECURITY DEBT: [None / count items]             │
└─────────────────────────────────────────────────┘
```

## Example Output

```
┌─────────────────────────────────────────────────┐
│ 📊 PROJECT STATUS: Agent-Helper                 │
├─────────────────────────────────────────────────┤
│ Phase 5 of 6: Mobile & Accessibility            │
│ Progress: [█████████░] 90% | Overall: 78%       │
├─────────────────────────────────────────────────┤
│ LAST SESSION: 2026-01-12                        │
│ • Completed: Premium Terminal Migration         │
│ • In Progress: Multi-device testing             │
├─────────────────────────────────────────────────┤
│ NEXT UP:                                        │
│ 1. [5.6] Complete device testing checklist      │
│ 2. [6.1] Multi-exchange support                 │
│ 3. [6.2] Strategy backtesting UI                │
├─────────────────────────────────────────────────┤
│ CI/CD: ✓ All passing                            │
│ BLOCKERS: None                                  │
│ SECURITY DEBT: 2 items (npm audit)              │
└─────────────────────────────────────────────────┘
```

## Fallback Handling

| Scenario               | Response                                                |
| ---------------------- | ------------------------------------------------------- |
| No .project-state.json | Parse PROJECT_PLAN.md markdown checkboxes               |
| No PROJECT_PLAN.md     | "No project initialized. Say 'start project' to begin." |
| No gh CLI              | Skip CI/CD section, note "gh CLI not available"         |
| Empty phases           | "Project plan exists but no phases defined."            |

## Error Messages

```
⚠️ Could not load project state: [error]
→ Try: Verify .project-state.json exists and is valid JSON

⚠️ CI/CD check failed: [error]
→ Try: Run 'gh auth login' to authenticate
```

## Constraints

- **Read-only** - Do NOT create or modify any files
- **Concise** - One dashboard only, no additional commentary
- **Current** - Always fetch fresh CI/CD status
- **Accurate** - Calculate progress from actual task counts
