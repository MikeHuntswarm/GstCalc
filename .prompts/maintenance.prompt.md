# Maintenance

## Trigger

When user says: `maintenance`, `cleanup`, `tidy up`, `housekeeping`, `health check`

## Prerequisites

Reference: `.claude/skills/project-agent/references/security-checklists/`

## Action Sequence

### Step 1: Dependency Security Audit

```bash
# Node.js - Check for vulnerabilities
npm audit --json 2>/dev/null | jq '{
  vulnerabilities: .metadata.vulnerabilities,
  critical: .metadata.vulnerabilities.critical,
  high: .metadata.vulnerabilities.high
}'

# Python - Check for vulnerabilities
pip-audit --format=json 2>/dev/null || pip check

# Check for outdated packages
npm outdated --json 2>/dev/null | jq 'to_entries | length'
```

**Severity Classification:**
| Level | Action |
|-------|--------|
| Critical | 🔴 HARD BLOCK - Fix immediately |
| High | 🔴 HARD BLOCK - Fix immediately |
| Medium | 🟡 WARNING - Schedule fix |
| Low | 🟢 INFO - Track for later |

### Step 2: Code Quality Analysis

```bash
# TypeScript type errors
TSC_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")

# ESLint issues
LINT_OUTPUT=$(npm run lint 2>&1)
LINT_ERRORS=$(echo "$LINT_OUTPUT" | grep -c "error" || echo "0")
LINT_WARNINGS=$(echo "$LINT_OUTPUT" | grep -c "warning" || echo "0")

# Complexity check (if available)
npx complexity-report --format json src/ 2>/dev/null | jq '.average'
```

### Step 3: Dead Code Detection

```bash
# Unused exports (TypeScript)
npx ts-prune 2>/dev/null | grep -v "used in module" | head -20

# Unused dependencies
npx depcheck --json 2>/dev/null | jq '.dependencies, .devDependencies'

# TODO/FIXME count
TODO_COUNT=$(grep -rn "TODO\|FIXME\|HACK\|XXX" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  . 2>/dev/null | grep -v node_modules | wc -l)
```

### Step 4: Git Repository Health

```bash
# Untracked files
UNTRACKED=$(git status --porcelain | grep "^??" | wc -l)

# Uncommitted changes
UNCOMMITTED=$(git status --porcelain | grep -v "^??" | wc -l)

# Large files (>1MB)
LARGE_FILES=$(find . -type f -size +1M -not -path "./node_modules/*" \
  -not -path "./.git/*" 2>/dev/null)

# Check .gitignore coverage
git check-ignore --no-index .env .env.local *.log 2>/dev/null
```

### Step 5: Runtime Health (if applicable)

```bash
# PM2 process status
pm2 jlist 2>/dev/null | jq '.[0] | {status, memory, cpu, restarts}'

# Disk usage
df -h . | tail -1 | awk '{print $5}'

# Memory check
free -h 2>/dev/null || vm_stat 2>/dev/null
```

### Step 6: Update Project State

If issues found, update `.project-state.json`:

```json
{
  "securityDebt": [
    {
      "id": "SEC-001",
      "severity": "high",
      "description": "npm audit: 2 high vulnerabilities",
      "added": "2026-01-15"
    }
  ],
  "lastSession": {
    "maintenanceRun": "2026-01-15T12:00:00Z"
  }
}
```

## Output Format

```
┌─────────────────────────────────────────────────┐
│ 🔧 MAINTENANCE REPORT                           │
│ Generated: [timestamp]                          │
├─────────────────────────────────────────────────┤
│ SECURITY AUDIT                                  │
│ Dependencies: [X vulns] 🔴/🟡/🟢                │
│ • Critical: [N]  High: [N]  Medium: [N]         │
│ Outdated Packages: [N]                          │
├─────────────────────────────────────────────────┤
│ CODE QUALITY                                    │
│ TypeScript Errors: [N] [🔴/✓]                   │
│ Lint Errors: [N]  Warnings: [N]                 │
│ Complexity: [avg score]                         │
├─────────────────────────────────────────────────┤
│ DEAD CODE                                       │
│ Unused Exports: [N]                             │
│ Unused Dependencies: [N]                        │
│ TODOs/FIXMEs: [N]                               │
├─────────────────────────────────────────────────┤
│ GIT HEALTH                                      │
│ Untracked: [N]  Uncommitted: [N]                │
│ Large Files: [N]                                │
├─────────────────────────────────────────────────┤
│ RUNTIME (if applicable)                         │
│ PM2: [status]  Memory: [X MB]  Restarts: [N]    │
│ Disk: [X%]                                      │
├─────────────────────────────────────────────────┤
│ 🎯 ACTION ITEMS (Priority Order)                │
│ P0: [command to fix critical/high issues]       │
│ P1: [command to fix medium issues]              │
│ P2: [cleanup suggestions]                       │
└─────────────────────────────────────────────────┘
```

## Example Output

```
┌─────────────────────────────────────────────────┐
│ 🔧 MAINTENANCE REPORT                           │
│ Generated: 2026-01-15 14:30:00                  │
├─────────────────────────────────────────────────┤
│ SECURITY AUDIT                                  │
│ Dependencies: 2 vulns 🔴                        │
│ • Critical: 0  High: 2  Medium: 0               │
│ Outdated Packages: 5                            │
├─────────────────────────────────────────────────┤
│ CODE QUALITY                                    │
│ TypeScript Errors: 0 ✓                          │
│ Lint Errors: 0  Warnings: 127                   │
│ Complexity: 8.2 (acceptable)                    │
├─────────────────────────────────────────────────┤
│ DEAD CODE                                       │
│ Unused Exports: 3                               │
│ Unused Dependencies: 1 (lodash)                 │
│ TODOs/FIXMEs: 24                                │
├─────────────────────────────────────────────────┤
│ GIT HEALTH                                      │
│ Untracked: 0  Uncommitted: 0                    │
│ Large Files: 0                                  │
├─────────────────────────────────────────────────┤
│ RUNTIME                                         │
│ PM2: online  Memory: 245 MB  Restarts: 0        │
│ Disk: 42%                                       │
├─────────────────────────────────────────────────┤
│ 🎯 ACTION ITEMS (Priority Order)                │
│ P0: npm audit fix                               │
│ P1: npm update @modelcontextprotocol/sdk        │
│ P2: Remove unused lodash dependency             │
└─────────────────────────────────────────────────┘
```

## Quick Fix Commands

| Issue               | Fix Command                                |
| ------------------- | ------------------------------------------ |
| npm vulnerabilities | `npm audit fix` or `npm audit fix --force` |
| Outdated packages   | `npm update` or `npm update [package]`     |
| TypeScript errors   | `npx tsc --noEmit` to see details          |
| Lint errors         | `npm run lint -- --fix`                    |
| Unused deps         | `npm uninstall [package]`                  |
| Large files         | Add to `.gitignore` or `git rm --cached`   |

## Constraints

- **Report only by default** - Don't auto-fix without user confirmation
- **Skip unavailable tools** - Note when tool not installed
- **Cross-platform** - Commands work on Windows (PowerShell) and Unix
- **Non-destructive** - Never delete files or modify code automatically
- **Update state** - Log security issues to `.project-state.json`
