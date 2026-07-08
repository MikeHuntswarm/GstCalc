# Project Review Agent v2.2

## Trigger

When user says: `review`, `audit`, `check project`, `production ready?`, `pre-deploy check`

---

## 1. DISCOVER (Auto-Execute)

```bash
# Stack detection (run silently, parse results)
# Check for Gradle/Kotlin first
if [ -f "build.gradle.kts" ] || [ -f "build.gradle" ]; then
    STACK="kotlin"
    IS_ANDROID=$(grep -l "com.android.application\|com.android.library" build.gradle* app/build.gradle* 2>/dev/null && echo "yes" || echo "no")
elif [ -f "package.json" ]; then
    STACK="node"
    IS_ANDROID="no"
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    STACK="python"
    IS_ANDROID="no"
else
    STACK="unknown"
    IS_ANDROID="no"
fi

HAS_DB=$(grep -rl "prisma\|sequelize\|mongoose\|sqlalchemy\|psycopg\|Room\|androidx.room" . 2>/dev/null | head -1 && echo "yes" || echo "no")
HAS_AUTH=$(grep -rl "jwt\|passport\|auth\|session\|FirebaseAuth" src/ app/ 2>/dev/null | head -1 && echo "yes" || echo "no")
HAS_REACT=$(grep -l "react\|next" package.json 2>/dev/null && echo "yes" || echo "no")
HAS_COMPOSE=$(grep -rl "androidx.compose\|@Composable" . 2>/dev/null | head -1 && echo "yes" || echo "no")
HAS_GH=$(gh --version 2>/dev/null && echo "yes" || echo "no")
```

**Output:** `{stack, is_android, has_db, has_auth, has_react, has_compose, has_gh}`

---

## 2. LOAD SKILLS (Conditional)

```yaml
always:
  - .claude/skills/project-agent/references/security-checklists/general-web.md
  - .claude/skills/project-agent/references/security-checklists/deployment.md

if has_db:
  - .claude/skills/project-agent/references/security-checklists/database.md

if has_auth:
  - .claude/skills/project-agent/references/security-checklists/auth.md

if has_react || has_compose:
  - /mnt/skills/public/frontend-design/SKILL.md
  - .claude/skills/project-agent/references/security-checklists/react.md

if stack == "node":
  - .claude/skills/project-agent/references/security-checklists/nodejs.md
  - .claude/skills/project-agent/references/security-checklists/api-security.md

if stack == "python":
  - .claude/skills/project-agent/references/security-checklists/python.md

if stack == "kotlin":
  - .claude/skills/project-agent/references/security-checklists/api-security.md
```

---

## 3. AUDIT

### 3.1 CI/CD Status (HARD BLOCK Gate)

```bash
# Check GitHub Actions status
gh run list --limit 5 --json status,conclusion,name,createdAt 2>/dev/null

# Count by status
FAILED=$(gh run list --status failure --limit 20 --json databaseId 2>/dev/null | jq 'length')
IN_PROGRESS=$(gh run list --status in_progress --json databaseId 2>/dev/null | jq 'length')
```

**HARD BLOCK Conditions:**

- Any workflow with `conclusion: failure` → Must fix before deployment
- Any workflow with `status: in_progress` → Must wait for completion

---

### 3.2 Security (Auto-Scan)

#### For Node.js Projects:

```bash
# Vulnerability count with severity breakdown
npm audit --json 2>/dev/null | jq '{
  total: .metadata.vulnerabilities.total,
  critical: .metadata.vulnerabilities.critical,
  high: .metadata.vulnerabilities.high,
  moderate: .metadata.vulnerabilities.moderate,
  low: .metadata.vulnerabilities.low
}'
```

#### For Kotlin/Android Projects:

```bash
# Check for dependency vulnerabilities (requires gradle plugin)
./gradlew dependencyCheckAnalyze 2>/dev/null || echo "OWASP plugin not configured"

# Or use built-in dependency report
./gradlew app:dependencies --configuration releaseRuntimeClasspath 2>/dev/null | head -100
```

#### For All Projects:

```bash
# Exposed secrets check
grep -rn "password\s*=\|secret\s*=\|api_key\s*=\|token\s*=\|apiKey\s*=" \
  --include="*.env*" --include="*.ts" --include="*.js" --include="*.kt" --include="*.java" --include="*.properties" \
  . 2>/dev/null | grep -v node_modules | grep -v ".example" | grep -v "build/" | grep -v ".gradle/"

# Hardcoded credentials in Kotlin/Java
grep -rn "\"password\"\|\"secret\"\|\"api_key\"\|BuildConfig\." \
  --include="*.kt" --include="*.java" \
  . 2>/dev/null | grep -v build/ | grep -v ".gradle/"

# XSS/Injection vectors (JS/TS)
grep -rn "eval(\|innerHTML\s*=\|dangerouslySetInnerHTML" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  . 2>/dev/null | grep -v node_modules

# SQL injection patterns (all languages)
grep -rn "rawQuery\|execSQL\|query(\`\|execute(\`\|\$\{.*\}.*WHERE" \
  --include="*.ts" --include="*.js" --include="*.kt" --include="*.java" \
  . 2>/dev/null | grep -v node_modules | grep -v build/
```

---

### 3.3 Quality (Auto-Scan)

#### For Node.js/TypeScript Projects:

```bash
# TypeScript errors
TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
TSC_ERRORS=$(echo "$TSC_OUTPUT" | grep -c "error TS" || echo "0")

# Lint issues
LINT_OUTPUT=$(npm run lint 2>&1)
LINT_ERRORS=$(echo "$LINT_OUTPUT" | grep -c " error " || echo "0")
LINT_WARNINGS=$(echo "$LINT_OUTPUT" | grep -c " warning " || echo "0")

# Test coverage
npm test -- --coverage --coverageReporters=json-summary 2>/dev/null
```

#### For Kotlin/Android Projects (Windows):

```powershell
# Build check (compilation errors)
gradlew.bat compileDebugKotlin 2>&1 | Tee-Object -Variable BUILD_OUTPUT
$BUILD_ERRORS = ($BUILD_OUTPUT | Select-String -Pattern "error:" | Measure-Object).Count

# Lint check (Android)
gradlew.bat lint 2>&1 | Tee-Object -Variable LINT_OUTPUT
$LINT_ERRORS = ($LINT_OUTPUT | Select-String -Pattern "error:" | Measure-Object).Count
$LINT_WARNINGS = ($LINT_OUTPUT | Select-String -Pattern "warning:" | Measure-Object).Count

# Unit tests
gradlew.bat test 2>&1 | Tee-Object -Variable TEST_OUTPUT
$TEST_FAILURES = ($TEST_OUTPUT | Select-String -Pattern "FAILED" | Measure-Object).Count

# Check lint report if generated
if (Test-Path "app/build/reports/lint-results-debug.html") {
    Write-Host "Lint report: app/build/reports/lint-results-debug.html"
}
```

#### For Kotlin/Android Projects (Unix/Mac):

```bash
# Build check (compilation errors)
./gradlew compileDebugKotlin 2>&1 | tee /tmp/build_output.txt
BUILD_ERRORS=$(grep -c "error:" /tmp/build_output.txt || echo "0")

# Lint check (Android)
./gradlew lint 2>&1 | tee /tmp/lint_output.txt
LINT_ERRORS=$(grep -c "error:" /tmp/lint_output.txt || echo "0")
LINT_WARNINGS=$(grep -c "warning:" /tmp/lint_output.txt || echo "0")

# Unit tests (all modules)
./gradlew test 2>&1 | tee /tmp/test_output.txt
TEST_FAILURES=$(grep -c "FAILED" /tmp/test_output.txt || echo "0")

# Test reports location
echo "Test reports: */build/reports/tests/"
```

#### For All Projects:

```bash
# Code hygiene
grep -rn "console\.log\|TODO\|FIXME\|HACK\|XXX\|Log\.d\|Log\.e" \
  --include="*.ts" --include="*.tsx" --include="*.kt" --include="*.java" \
  . 2>/dev/null | grep -v node_modules | grep -v build/ | wc -l
```

---

### 3.4 UI/UX (Reference Skill)

#### For React/Web:

- Accessibility (WCAG 2.1 AA compliance)
- Responsive breakpoints (320px, 768px, 1024px)
- Loading states and error handling
- Touch targets (44x44px minimum)

#### For Android/Compose:

- Material Design 3 compliance
- Accessibility (TalkBack support, content descriptions)
- Screen size support (phones, tablets, foldables)
- Loading states (CircularProgressIndicator, Shimmer)
- Error handling (Snackbar, Dialog feedback)
- Touch targets (48dp minimum per Material guidelines)

---

### 3.5 Documentation Check

```bash
# Check for required docs
[ -f "README.md" ] && echo "readme:yes" || echo "readme:no"
[ -f ".env.example" ] && echo "env_example:yes" || echo "env_example:no"
[ -d "docs" ] || [ -f "API.md" ] && echo "api_docs:yes" || echo "api_docs:no"

# TypeScript/Node specific
[ -f "tsconfig.json" ] && echo "types:yes" || echo "types:no"

# Kotlin/Android specific
[ -f "CHANGELOG.md" ] && echo "changelog:yes" || echo "changelog:no"
[ -f "DEVELOPMENT.md" ] && echo "dev_docs:yes" || echo "dev_docs:no"
[ -d "docs" ] || [ -f "ARCHITECTURE.md" ] && echo "arch_docs:yes" || echo "arch_docs:no"
```

---

## 4. SCORE

```
# CI/CD is a HARD BLOCK, not scored
CICD_GATE = (failed_workflows == 0) && (in_progress_workflows == 0)

# Scored categories
SECURITY  = 100 - (critical×25) - (high×10) - (medium×3) - (low×1)
QUALITY   = 100 - (build_errors×10) - (test_failures×5) - (lint_errors×2) - (warnings×0.5) - (todos×0.1)
UI_UX     = 100 - (a11y_issues×10) - (responsive_issues×5) - (state_issues×3)
DOCS      = (readme?20:0) + (api_docs?20:0) + (env_example?20:0) + (types_or_arch?20:0) + (changelog?20:0)

# Final health (only if CI/CD passes)
HEALTH = (SECURITY×0.4) + (QUALITY×0.25) + (UI_UX×0.2) + (DOCS×0.15)

# Ready status
READY = CICD_GATE && (SECURITY >= 70) && (QUALITY >= 60)
```

---

## 5. OUTPUT (Single File)

Generate `PROJECT_REVIEW.md`:

````markdown
# [PROJECT] Review

**Health: [X]/100** | **Ready: [Yes/No/Conditional]** | **Date: [DATE]**
**Stack: [Node.js/Kotlin/Python]** | **Platform: [Web/Android/Desktop]**

## CI/CD Gate

| Status | Workflows       | Action                |
| ------ | --------------- | --------------------- |
| [✓/🔴] | [N] passing     | [None / Fix required] |
| [✓/🔴] | [N] failed      | [List workflow names] |
| [✓/⏳] | [N] in progress | [Wait for completion] |

**Gate Status: [OPEN / BLOCKED]**

## Scores

| Area     | Score | Critical | High | Med | Low |
| -------- | ----- | -------- | ---- | --- | --- |
| Security | X     | N        | N    | N   | N   |
| Quality  | X     | N        | N    | N   | N   |
| UI/UX    | X     | N        | N    | N   | N   |
| Docs     | X     | -        | -    | -   | -   |

## Build Status (Kotlin/Android)

| Module  | Compile | Tests | Lint |
| ------- | ------- | ----- | ---- |
| :app    | ✓/✗     | X/Y   | E/W  |
| :domain | ✓/✗     | X/Y   | -    |
| :data   | ✓/✗     | X/Y   | E/W  |
| :engine | ✓/✗     | X/Y   | -    |

## P0: Fix Now (Blocks Deployment)

- [ ] **CI-1**: [Workflow name] failed → `gh run view [id] --log-failed`
- [ ] **BUILD-1**: [Module] compilation error → [Fix]
- [ ] **SEC-1**: [Title] `file:line` → [Fix command]

## P1: This Sprint

- [ ] **QA-1**: [Title] → [Fix]
- [ ] **LINT-1**: [Title] → [Fix]

## P2: Next Sprint

- [ ] [Items...]

## P3: Backlog

- [ ] [Items...]

## Quick Wins (<30min)

- [ ] [Item] → [One-liner fix]

---

## Task Details

### BUILD-1: [Module] Compilation Error

**Module:** `:app` | **File:** `path/to/File.kt:line`

```kotlin
// Error message
e: File.kt:42: Unresolved reference: someFunction
```

Fix:

```kotlin
// Add missing import or fix reference
import com.example.someFunction
```

Verify: `gradlew.bat :app:compileDebugKotlin`

---

### SEC-1: [Title]

**File:** `path:line` | **Effort:** Xh | **Severity:** [Critical/High]

Current:

```kotlin
// Hardcoded API key
val apiKey = "YOUR_API_KEY_HERE"
```

Fix:

```kotlin
// Use BuildConfig
val apiKey = BuildConfig.API_KEY
```

Verify: `grep -rn "apiKey\s*=" --include="*.kt" . | grep -v BuildConfig`

---

[Repeat for each P0/P1 item]
````

---

## 6. STACK-SPECIFIC COMMANDS

### Node.js/TypeScript

| Check    | Command                      |
| -------- | ---------------------------- |
| Build    | `npm run build` or `npx tsc` |
| Test     | `npm test`                   |
| Lint     | `npm run lint`               |
| Security | `npm audit`                  |
| Deps     | `npm outdated`               |

### Kotlin/Android (Windows)

| Check   | Command                          |
| ------- | -------------------------------- |
| Build   | `gradlew.bat assembleDebug`      |
| Compile | `gradlew.bat compileDebugKotlin` |
| Test    | `gradlew.bat test`               |
| Lint    | `gradlew.bat lint`               |
| Deps    | `gradlew.bat app:dependencies`   |
| Clean   | `gradlew.bat clean`              |

### Kotlin/Android (Unix/Mac)

| Check   | Command                        |
| ------- | ------------------------------ |
| Build   | `./gradlew assembleDebug`      |
| Compile | `./gradlew compileDebugKotlin` |
| Test    | `./gradlew test`               |
| Lint    | `./gradlew lint`               |
| Deps    | `./gradlew app:dependencies`   |
| Clean   | `./gradlew clean`              |

### Python

| Check      | Command                        |
| ---------- | ------------------------------ |
| Test       | `pytest` or `python -m pytest` |
| Lint       | `flake8` or `ruff check .`     |
| Type Check | `mypy .`                       |
| Security   | `pip-audit` or `safety check`  |
| Deps       | `pip list --outdated`          |

---

## 7. RULES

1. **CI/CD is HARD BLOCK** - Failed workflows must be fixed before proceeding
2. **Detect stack first** - Run appropriate commands for the detected stack
3. **No prose** - Only actionable items
4. **No duplicates** - Reference skills, don't copy checklist items
5. **Code fixes required** - Every issue needs fix code
6. **Verify command required** - Every fix needs verification
7. **One file output** - `PROJECT_REVIEW.md` only
8. **Auto-execute scans** - Don't ask, just run
9. **Skip passing checks** - Only report issues
10. **Severity ordering** - P0 (Critical/High) → P1 (Medium) → P2 (Low) → P3 (Info)

---

## 8. VALIDATION

Before delivering, confirm:

```
□ Stack correctly detected (node/kotlin/python)
□ CI/CD status checked and reported
□ Appropriate build/test commands run for stack
□ All P0 items have code fixes
□ All P0 items have verify commands
□ Health score calculated correctly
□ Gate status clearly indicated (OPEN/BLOCKED)
□ No checklist items copied from skills (reference only)
□ Output is single file
□ <100 items total (if more, raise thresholds)
```

---

## 9. EXAMPLE: KOTLIN/ANDROID REVIEW

```
# NRL Sim Manager Review

**Health: 82/100** | **Ready: Conditional** | **Date: 2026-01-15**
**Stack: Kotlin** | **Platform: Android**

## CI/CD Gate

| Status | Workflows | Action |
|--------|-----------|--------|
| ✓ | 2 passing | None |
| 🔴 | 1 failed | Fix: android-ci |

**Gate Status: 🔴 BLOCKED**

## Scores

| Area | Score | Critical | High | Med | Low |
|------|-------|----------|------|-----|-----|
| Security | 95 | 0 | 0 | 1 | 2 |
| Quality | 78 | 0 | 1 | 3 | 5 |
| UI/UX | 85 | 0 | 0 | 2 | 3 |
| Docs | 60 | - | - | - | - |

## Build Status

| Module | Compile | Tests | Lint |
|--------|---------|-------|------|
| :app | ✓ | 45/45 | 0/12 |
| :domain | ✓ | 23/23 | - |
| :data | ✓ | 18/18 | 0/3 |
| :engine | ✓ | 56/56 | - |

## P0: Fix Now

- [ ] **CI-1**: android-ci failed → `gh run view 123 --log-failed`

## P1: This Sprint

- [ ] **LINT-1**: Remove debug Log statements (12 warnings)
- [ ] **QA-1**: Add missing content descriptions for accessibility

## Quick Wins

- [ ] Add CHANGELOG.md → `touch CHANGELOG.md`
- [ ] Remove 4 unused imports → Android Studio optimize imports
```
