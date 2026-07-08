<#
.SYNOPSIS
    Initialize a new project plan structure for Agent-Helper projects.

.DESCRIPTION
    Creates PROJECT_PLAN.md and .project-state.json in the specified directory
    with placeholder values for project initialization.

.PARAMETER ProjectDir
    The directory where project files will be created.

.PARAMETER ProjectName
    The name of the project.

.EXAMPLE
    .\init-project-plan.ps1 -ProjectDir "C:\Projects\MyApp" -ProjectName "MyApp"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectDir,
    
    [Parameter(Mandatory=$true)]
    [string]$ProjectName
)

$ErrorActionPreference = "Stop"

# Ensure directory exists
if (-not (Test-Path $ProjectDir)) {
    New-Item -ItemType Directory -Path $ProjectDir -Force | Out-Null
}

$now = Get-Date -Format "yyyy-MM-dd"
$isoNow = Get-Date -Format "o"

# Generate PROJECT_PLAN.md content
$planContent = @"
# $ProjectName - Project Plan

**Created:** $now
**Last Updated:** $now
**Status:** Planning

## Vision

[Project vision to be defined]

## Users

- **Primary:** TBD
- **Scale:** TBD
- **Access:** TBD

## Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | TBD | To be selected |
| Backend | TBD | To be selected |
| Database | TBD | To be selected |
| Auth | TBD | To be selected |
| Deployment | TBD | To be selected |

**Security Checklists Applied:** general-web.md

## Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** TBD
**Status:** [ ] Not Started

Tasks:
- [ ] Task 1
- [ ] Task 2

### Phase 2: Core Features (Week 3-4)
**Goal:** TBD
**Status:** [ ] Not Started

Tasks:
- [ ] Task 1
- [ ] Task 2

### Phase 3: Polish & Launch (Week 5-6)
**Goal:** TBD
**Status:** [ ] Not Started

Tasks:
- [ ] Task 1
- [ ] Task 2

## Quality Gates

Before each phase completion:
- [ ] All security checklist items addressed
- [ ] UX standards verified
- [ ] Code reviewed
- [ ] Tests passing

## Pre-Deployment Gate

Before ANY deployment:
- [ ] All changes staged and committed
- [ ] Changes pushed to remote
- [ ] All GitHub Actions workflows passing
- [ ] Past failed actions reviewed and resolved
- [ ] PROJECT_REVIEW.md generated with passing score
- [ ] Security audit complete (no Critical/High issues)

## Backlog

Items for future consideration (post-launch):
- (None yet)

## Deviation Log

| Date | Feature | Decision | Justification |
|------|---------|----------|---------------|
| | | | |

## Notes

(Project notes will be added here)
"@

# Generate .project-state.json content
$stateContent = @{
    projectName = $ProjectName
    created = $isoNow
    lastUpdated = $isoNow
    currentPhase = 1
    totalPhases = 3
    stack = @{
        frontend = "TBD"
        frontend_reason = "To be selected"
        backend = "TBD"
        backend_reason = "To be selected"
        database = "TBD"
        database_reason = "To be selected"
        auth = "TBD"
        auth_reason = "To be selected"
        deployment = "TBD"
        deployment_reason = "To be selected"
    }
    securityChecklists = @("general-web.md")
    phases = @(
        @{
            number = 1
            name = "Foundation"
            timeline = "Week 1-2"
            status = "in-progress"
            tasks = @(
                @{ id = "1.1"; name = "Task 1"; status = "pending"; steps = @() }
                @{ id = "1.2"; name = "Task 2"; status = "pending"; steps = @() }
            )
        }
        @{
            number = 2
            name = "Core Features"
            timeline = "Week 3-4"
            status = "not-started"
            tasks = @(
                @{ id = "2.1"; name = "Task 1"; status = "pending"; steps = @() }
                @{ id = "2.2"; name = "Task 2"; status = "pending"; steps = @() }
            )
        }
        @{
            number = 3
            name = "Polish & Launch"
            timeline = "Week 5-6"
            status = "not-started"
            tasks = @(
                @{ id = "3.1"; name = "Task 1"; status = "pending"; steps = @() }
                @{ id = "3.2"; name = "Task 2"; status = "pending"; steps = @() }
            )
        }
    )
    lastSession = @{
        date = $isoNow
        completed = @()
        inProgress = $null
    }
    deviations = @()
    securityDebt = @()
    backlog = @()
    cicd = @{
        lastCheck = $null
        allPassing = $false
        failedRuns = @()
    }
} | ConvertTo-Json -Depth 10

# Write files
$planPath = Join-Path $ProjectDir "PROJECT_PLAN.md"
$statePath = Join-Path $ProjectDir ".project-state.json"

Set-Content -Path $planPath -Value $planContent -Encoding UTF8
Set-Content -Path $statePath -Value $stateContent -Encoding UTF8

Write-Host "✓ Created: $planPath" -ForegroundColor Green
Write-Host "✓ Created: $statePath" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit PROJECT_PLAN.md with your project details"
Write-Host "2. Run 'status' to see the project dashboard"
Write-Host "3. Say 'start task 1.1' to begin working"
