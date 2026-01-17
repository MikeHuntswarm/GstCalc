# GstCalc - GST Calculator

## User Preferences

- Make tool decisions autonomously without asking yes/no confirmation
- Proceed with actions directly, don't ask for permission

## ?? MANDATORY: CI/CD Monitoring

**ALWAYS check GitHub Actions after ANY push.** This is non-negotiable.

### After Every `git push`:

```bash
gh run list --limit 3  # Check workflow status
```

### If ANY workflow fails:

1. **STOP** all other work immediately
2. Run `gh run view <id> --log-failed` to see the error
3. **Fix the failure** before continuing
4. Push the fix and verify CI passes

### Never:

- Ignore failing workflows
- Continue coding while CI is red
- Deploy with failed checks

**CI failures are P0 blockers. Period.**

---

## Mandatory UI Verification

**ALWAYS verify the application is working after ANY code changes.**

### After Every Code Change:

1. Start Electron: `npm run electron:dev`
2. Test the desktop app launches
3. Check DevTools console for errors
4. Verify PDF export works

**Do NOT consider a task complete until verification passes.**

## Overview

Electron desktop application for GST calculations with PDF export capabilities. Features a modern React UI with Radix components and Zustand state management.

## Tech Stack

| Layer      | Technology                    |
| ---------- | ----------------------------- |
| Framework  | Electron                      |
| UI         | React, Radix UI, Tailwind CSS |
| State      | Zustand                       |
| PDF        | jsPDF                         |
| Dates      | date-fns                      |
| Validation | Zod                           |
| Updates    | electron-updater              |

## Key Directories

```
/src           - React source code
/electron      - Electron main process
/dist          - Build output
/.github       - GitHub Actions workflows
```

## Commands

```bash
npm run dev           # Start React dev server
npm run electron:dev  # Start Electron in dev mode
npm run build         # Build for production
npm run package       # Package Electron app
npm run lint          # ESLint check
```

## Security Checklists Applied

- `react.md` - React security
- `nodejs.md` - Node.js/Electron security
- `deployment.md` - App distribution
- `general-web.md` - Web fundamentals

---

## Project Management

### Trigger Phrases

| Phrase             | Action                                   |
| ------------------ | ---------------------------------------- |
| "What's next?"     | Show current phase and next pending task |
| "Project status"   | Show overall progress                    |
| "Review" / "Audit" | Generate PROJECT_REVIEW.md               |
| "Maintenance"      | Run code hygiene checks                  |

---

## Project Agent Skill

**Load `.claude/skills/project-agent/SKILL.md` for methodology enforcement.**

### System Skills

| Skill               | Path                                          | Use For        |
| ------------------- | --------------------------------------------- | -------------- |
| **frontend-design** | `/mnt/skills/public/frontend-design/SKILL.md` | UI/UX          |
| **pdf**             | `/mnt/skills/public/pdf/SKILL.md`             | PDF generation |

---

## Pre-Deployment Workflow (MANDATORY)

**Before ANY deployment, the following steps MUST complete successfully:**

### Step 1: Stage, Commit, and Push

```bash
git add -A
git status
git commit -m "[type]: [description]"
git push origin [branch]
```

### Step 2: Monitor GitHub Actions

```bash
# List recent workflow runs
gh run list --limit 10

# Watch active run until completion
gh run watch [run-id]

# Check for failures
gh run list --status failure --limit 10
```

### Step 3: Handle Failed Workflows

**If any workflow fails:**

1. View failure details: `gh run view [run-id] --log-failed`
2. Identify root cause
3. Fix the issue
4. Commit and push fix
5. Rerun failed jobs: `gh run rerun [run-id] --failed`
6. Monitor until passing

### Step 4: Investigate and Resolve ALL Failed/Cancelled Runs

**⚠️ MANDATORY: You MUST investigate every failed and cancelled run before proceeding.**

A new passing run does NOT clear old failures. You cannot proceed until every failed/cancelled run has been investigated and either FIXED or REMOVED.

**FIRST: List all failed and cancelled runs:**

```bash
# Get ALL failed runs
gh run list --status failure --limit 50 --json databaseId,workflowName,headSha,createdAt,conclusion

# Get ALL cancelled runs
gh run list --status cancelled --limit 50 --json databaseId,workflowName,headSha,createdAt,conclusion
```

**THEN: For EACH failed/cancelled run, you MUST investigate:**

```bash
# 1. View the run details
gh run view [run-id]

# 2. For failures - see what went wrong
gh run view [run-id] --log-failed

# 3. Check which commit triggered it
gh run view [run-id] --json headSha -q '.headSha'
```

**AFTER investigating, choose ONE resolution:**

| Resolution   | When to Use                                              | Action Required                                |
| ------------ | -------------------------------------------------------- | ---------------------------------------------- |
| **FIX**      | Issue still exists in current code                       | Fix the code, push, verify new run passes      |
| **RERUN**    | Flaky test / transient failure                           | `gh run rerun [run-id]` and watch until passes |
| **DELETE**   | Obsolete (old branch, superseded commit, abandoned work) | `gh run delete [run-id]`                       |
| **DOCUMENT** | Cannot fix now but acknowledged                          | Add to technical debt log with issue number    |

**Resolution workflow:**

```bash
# Option A: Delete obsolete runs (old commits that have been superseded)
gh run delete [run-id]

# Option B: Rerun if it was a transient failure
gh run rerun [run-id]
gh run watch [run-id]

# Option C: Fix the issue
# 1. Fix code
# 2. git add -A && git commit -m "fix: [description]" && git push
# 3. gh run watch [new-run-id]
```

**VERIFICATION - Run this and it MUST return empty arrays:**

```bash
echo "=== Failed runs (must be empty) ==="
gh run list --status failure --limit 50 --json databaseId,workflowName
echo "=== Cancelled runs (must be empty) ==="
gh run list --status cancelled --limit 50 --json databaseId,workflowName
```

**❌ NEVER do this:**

- Skip investigating a failed/cancelled run
- Push new commits hoping old failures "disappear"
- Ignore red/yellow runs because a newer green run exists
- Assume failures are "flaky" without running `gh run view --log-failed`
- Proceed while ANY unresolved failed/cancelled runs exist

### Step 5: Deployment Gate Check

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ðŸš€ DEPLOYMENT READINESS CHECK                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ [âœ“/âœ—] All commits pushed                        â”‚
â”‚ [âœ“/âœ—] All workflow runs passing                 â”‚
â”‚ [âœ“/âœ—] No unresolved failed actions              â”‚
â”‚ [âœ“/âœ—] Security checklist complete               â”‚
â”‚ [âœ“/âœ—] PROJECT_REVIEW.md generated (if review)   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ DEPLOY STATUS: [READY / BLOCKED]                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**HARD BLOCK**: Deployment cannot proceed if:

- Any current workflow is failing
- Unreviewed past failures exist
- Critical/High security issues unresolved

**Note**: CI/CD is a HARD BLOCK (not scored) - deployment cannot proceed with failed workflows.
