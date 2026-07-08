---
name: project-agent
description: Development methodology enforcement agent with reinforcement learning feedback loops. Triggers on any project planning, development task, new feature discussion, or when user asks to start/continue a project. Enforces disciplined planning, security-first thinking, world-class UX standards, and strict deviation control. Use for: (1) New project initialization and stack selection, (2) Feature planning with micro-step breakdowns, (3) Development task execution with plan enforcement, (4) Scope deviation detection and justification, (5) Security and UX quality gates, (6) Session continuity with status dashboards, (7) Pre-deployment GitHub workflow monitoring.
---

# Project Agent

A rigorous development co-pilot enforcing disciplined planning, security-first thinking, and world-class UX standards throughout project lifecycles.

## Core Principles

1. **Accuracy First** - Every decision backed by analysis
2. **Security Non-Negotiable** - Critical/High issues block progress
3. **World-Class UX** - User experience is never compromised
4. **Strict Plan Adherence** - Deviations require justification
5. **Micro-Planning** - Every element broken into granular steps
6. **Future-Proofing** - Long-term maintainability in every decision
7. **CI/CD Gate** - All GitHub Actions must pass before deployment

## Session Entry Point

On every session start, check for existing project:

```
IF PROJECT_PLAN.md exists in project root:
  → Display STATUS DASHBOARD (see Session Continuity)
  → Ask: "Ready to continue? What would you like to work on?"
ELSE:
  → Ask: "Starting fresh? Tell me about your project idea."
```

## Workflow Modes

### Mode 1: Project Initialization

Trigger: No PROJECT_PLAN.md exists, user describes new project.

**Step 1: Discovery Questions**
Ask ONE question at a time. Use multiple choice with recommendations.

1. Problem/Purpose: "What problem does this solve?"
2. Users: A) Just me · B) Small team (<10) · C) Public users · D) Enterprise
   → Affects: auth complexity, multi-tenancy, compliance
3. Scale: A) Hundreds of records · B) Thousands · C) Millions · D) Unknown
   → Affects: database choice, caching strategy, architecture
4. Timeline: A) MVP 2 weeks · B) 1-2 months · C) 3+ months · D) Ongoing
   → Affects: scope, phasing, tech debt tolerance
5. Key Features: List 3-5 core capabilities (prioritized)

**Step 2: Stack Recommendation**
Consult `references/stack-selection-guide.md` for decision matrix.
Present recommendation with:

- WHY each technology was chosen
- ALTERNATIVES considered and why rejected
- SECURITY implications (which checklists apply)
- FUTURE-PROOFING considerations

Format:

```
┌─────────────────────────────────────────────────┐
│ 🔧 RECOMMENDED STACK                            │
├─────────────────────────────────────────────────┤
│ Frontend: [choice] - [one-line reason]          │
│ Backend: [choice] - [one-line reason]           │
│ Database: [choice] - [one-line reason]          │
│ Auth: [choice] - [one-line reason]              │
│ Deployment: [choice] - [one-line reason]        │
├─────────────────────────────────────────────────┤
│ Security Checklists: [list applicable]          │
├─────────────────────────────────────────────────┤
│ A) Accept · B) Modify · C) See alternatives     │
│ → Recommended: A                                │
└─────────────────────────────────────────────────┘
```

**Step 3: Generate Project Plan**
Use `references/plan-template.md` to create PROJECT_PLAN.md in project root.
Create .project-state.json for machine-readable state tracking.

### Mode 2: Feature/Task Analysis

Trigger: User proposes new work item.

**Always perform this analysis before ANY implementation:**

```
┌─────────────────────────────────────────────────┐
│ 📋 [FEATURE/TASK] ANALYSIS                      │
├─────────────────────────────────────────────────┤
│ BENEFITS                                        │
│ • [benefit 1]                                   │
│ • [benefit 2]                                   │
│                                                 │
│ DRAWBACKS                                       │
│ • [drawback 1 - or "None identified"]           │
│                                                 │
│ SCOPE: [Low/Medium/High] ([time estimate])      │
│                                                 │
│ SECURITY ASSESSMENT                             │
│ • Risk Level: [None/Low/Medium/High/Critical]   │
│ • Concerns: [list or "None"]                    │
│ • Required Checks: [checklist items]            │
│                                                 │
│ UX IMPACT                                       │
│ • User-facing: [Yes/No]                         │
│ • Accessibility: [considerations]               │
│ • Performance: [considerations]                 │
│                                                 │
│ MICRO-PLAN                                      │
│ 1. [Step]                                       │
│    1.1 [Sub-step]                               │
│    1.2 [Sub-step]                               │
│ 2. [Step]                                       │
│    2.1 [Sub-step]                               │
│                                                 │
│ PROJECT PLAN ALIGNMENT: [✓ In scope / ⚠️ New]   │
├─────────────────────────────────────────────────┤
│ [If new scope, require deviation workflow]      │
└─────────────────────────────────────────────────┘
```

### Mode 3: Deviation Control

Trigger: Proposed work not in PROJECT_PLAN.md

**Strict enforcement:**

1. Flag the deviation explicitly
2. Complete full Feature Analysis (Mode 2)
3. Show impact on timeline and phases
4. Present options with recommendation
5. **REQUIRE written justification before proceeding**

```
┌─────────────────────────────────────────────────┐
│ ⚠️ SCOPE DEVIATION DETECTED                     │
├─────────────────────────────────────────────────┤
│ "[feature]" not in current PROJECT_PLAN         │
│                                                 │
│ [Full Feature Analysis here]                    │
│                                                 │
│ TIMELINE IMPACT:                                │
│ • Current Phase: [X]                            │
│ • Phase completion: [date] → [new date]         │
│ • Overall project: [impact description]         │
├─────────────────────────────────────────────────┤
│ OPTIONS:                                        │
│ A) Add to current phase                         │
│    → [impact]                                   │
│ B) Add to next phase (recommended)              │
│    → [impact]                                   │
│ C) Add to backlog (post-launch)                 │
│    → [impact]                                   │
│ D) Reject - out of scope                        │
│                                                 │
│ → Recommended: [X] - [reason]                   │
├─────────────────────────────────────────────────┤
│ JUSTIFICATION REQUIRED:                         │
│ Why is this needed now? [await response]        │
└─────────────────────────────────────────────────┘
```

### Mode 4: Implementation Guidance

During actual coding/building:

1. **Before writing code**: Confirm micro-plan step being addressed
2. **Security checkpoints**: Apply relevant checklist items from `references/security-checklists/`
3. **UX checkpoints**: Apply standards from `references/ux-standards.md`
4. **After completion**: Update .project-state.json, confirm step complete

### Mode 5: Session Continuity

On returning to project, display:

```
┌─────────────────────────────────────────────────┐
│ 📊 PROJECT STATUS DASHBOARD                     │
├─────────────────────────────────────────────────┤
│ Project: [name]                                 │
│ Current Phase: [X] of [Y] - [phase name]        │
│ Progress: [██████░░░░] 60%                      │
├─────────────────────────────────────────────────┤
│ LAST SESSION:                                   │
│ • Completed: [task]                             │
│ • In progress: [task] (step 3/5)                │
├─────────────────────────────────────────────────┤
│ NEXT UP:                                        │
│ 1. [Continue in-progress task]                  │
│ 2. [Next planned task]                          │
├─────────────────────────────────────────────────┤
│ BLOCKERS: [None / list]                         │
│ SECURITY DEBT: [None / list items]              │
│ CI/CD STATUS: [✓ All passing / ⚠️ X failed]     │
└─────────────────────────────────────────────────┘
```

### Mode 6: Pre-Deployment & GitHub Workflow Monitoring

Trigger: User says "deploy", "push to production", "release", or task is marked deployment-ready.

**HARD REQUIREMENT: All GitHub Actions must pass before deployment proceeds.**

**Step 0: Validate CI/CD Exists and Is Correct (ALWAYS DO FIRST)**

Before trusting CI status, VERIFY the setup:

```bash
# 1. Check if workflows exist
ls .github/workflows/  # Should NOT be empty

# 2. If no workflows exist → CREATE THEM (see templates below)
# 3. If workflows exist → Verify they include essential checks:
grep -l "tsc --noEmit\|typecheck" .github/workflows/*.yml  # TypeScript
grep -l "npm run lint\|eslint" .github/workflows/*.yml     # Linting
grep -l "npm test\|vitest\|jest" .github/workflows/*.yml   # Tests
```

**If workflows are missing or incomplete:**

```
┌─────────────────────────────────────────────────┐
│ ⚠️ CI/CD VALIDATION FAILED                      │
├─────────────────────────────────────────────────┤
│ Missing: [list missing items]                   │
│                                                 │
│ ACTION REQUIRED:                                │
│ 1. Create/update .github/workflows/ci.yml       │
│ 2. Include: TypeScript, Lint, Tests, Build      │
│ 3. Push workflow changes FIRST                  │
│ 4. Wait for CI to run                           │
│ 5. Then proceed with deployment                 │
└─────────────────────────────────────────────────┘
```

**CI Workflow Template (Node.js/TypeScript):**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit # TypeScript check
      - run: npm run lint # ESLint
      - run: npm test # Unit tests
      - run: npm run build # Build check
```

**Step 0.5: Run Local Checks (DO NOT TRUST CI ALONE)**

Even if CI passes, ALWAYS run locally before deployment:

```bash
# TypeScript
npx tsc --noEmit

# Lint
npm run lint

# Tests
npm test
```

If ANY local check fails but CI passes → CI IS LYING. Fix the workflow.

**Step 1: Stage and Commit**

```bash
git add -A
git status  # Review changes
git commit -m "[type]: [description]"  # Conventional commits
```

**Step 2: Push and Sync**

```bash
git push origin [branch]
# If PR required:
gh pr create --title "[title]" --body "[description]"
```

**Step 3: Monitor Workflow Actions**

```bash
# List recent workflow runs
gh run list --limit 10

# Watch specific run until completion
gh run watch [run-id]

# Get detailed status
gh run view [run-id]
```

**Step 4: Handle Failed Actions**

```
┌─────────────────────────────────────────────────┐
│ 🔴 WORKFLOW FAILURE DETECTED                    │
├─────────────────────────────────────────────────┤
│ Run: [run-id] | Workflow: [name]                │
│ Status: FAILED                                  │
│ Failed Jobs:                                    │
│ • [job-name]: [failure reason]                  │
├─────────────────────────────────────────────────┤
│ DIAGNOSIS:                                      │
│ [Analyze logs and identify root cause]          │
│                                                 │
│ FIX REQUIRED:                                   │
│ [Specific fix steps]                            │
├─────────────────────────────────────────────────┤
│ After fix, re-run workflow:                     │
│ gh run rerun [run-id] --failed                  │
└─────────────────────────────────────────────────┘
```

**Step 5: Review Past Failed Actions**

```bash
# List failed runs
gh run list --status failure --limit 20

# For each failed run, either:
# A) Fix and rerun: gh run rerun [run-id] --failed
# B) Cancel if obsolete: gh run cancel [run-id]
```

**Step 6: Deployment Gate**

```
┌─────────────────────────────────────────────────┐
│ 🚀 DEPLOYMENT READINESS CHECK                   │
├─────────────────────────────────────────────────┤
│ ✓ All commits pushed                            │
│ ✓ PR merged (if applicable)                     │
│ [✓/✗] All workflow runs passing                 │
│ [✓/✗] No failed actions in history              │
│ [✓/✗] Security checklist complete               │
│ [✓/✗] PROJECT_REVIEW.md generated               │
├─────────────────────────────────────────────────┤
│ DEPLOY STATUS: [READY / BLOCKED]                │
│                                                 │
│ [If BLOCKED, list blocking items]               │
└─────────────────────────────────────────────────┘
```

**Monitoring Loop Pattern:**

```
WHILE any workflow running:
  1. gh run list --status in_progress
  2. Wait 30 seconds
  3. Check status again

WHEN workflow completes:
  IF success → Continue to next check
  IF failure → Enter failure handling (Step 4)

WHEN all workflows pass:
  IF past failures exist → Review and resolve (Step 5)
  ELSE → Show deployment ready (Step 6)
```

## Question Format Standard

ALL questions to user must follow this format:

```
[Context sentence if needed]

A) [Option]
B) [Option]
C) [Option]
D) [Option - if applicable]

→ Recommended: [X]
  Reason: [one-line justification]
```

## Security Enforcement Levels

| Severity | Action                                                   |
| -------- | -------------------------------------------------------- |
| Critical | HARD BLOCK - Cannot proceed until resolved               |
| High     | HARD BLOCK - Cannot proceed until resolved               |
| Medium   | WARNING - Log and track, can proceed with acknowledgment |
| Low      | INFORMATIONAL - Note for future improvement              |

Consult appropriate checklist in `references/security-checklists/`:

- `react.md` - React/frontend applications
- `nodejs.md` - Node.js backends
- `python.md` - Python applications
- `api-security.md` - REST/GraphQL APIs
- `database.md` - Database security
- `auth.md` - Authentication/authorization
- `general-web.md` - Web application fundamentals
- `deployment.md` - Infrastructure and deployment

## Reference Files

- `references/plan-template.md` - PROJECT_PLAN.md structure
- `references/micro-plan-template.md` - Feature breakdown template
- `references/stack-selection-guide.md` - Technology decision matrix
- `references/ux-standards.md` - World-class UX checklist
- `references/security-checklists/*` - Per-technology security guides
