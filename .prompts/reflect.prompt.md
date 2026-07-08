# Reflect

## Trigger

When user says: `reflect`, `retrospective`, `what did we learn`, `session recap`, `wrap up`

## Prerequisites

Reference: `.claude/skills/project-agent/SKILL.md` (Session Continuity)

## Purpose

Extract actionable learnings from the current session to:

1. Update project state for continuity
2. Identify reusable patterns
3. Document blockers for next session
4. Suggest optimal next steps

## Action Sequence

### Step 1: Session Analysis

Review the conversation for:

```
SESSION_METRICS:
- tasks_attempted: [count of tasks started]
- tasks_completed: [count of tasks finished]
- errors_encountered: [count of errors/failures]
- errors_resolved: [count of errors fixed]
- time_estimate: [approximate session duration]
```

**Extract from conversation:**
| Data Point | Look For |
|------------|----------|
| Completed tasks | "done", "completed", "finished", "✓" markers |
| In-progress work | Last task being worked on |
| Errors hit | Error messages, stack traces, failed commands |
| Solutions found | Successful fixes, workarounds |
| Decisions made | "decided to", "chose", "going with" |
| Blockers | "blocked by", "waiting for", "need to" |

### Step 2: Pattern Detection

Identify patterns worth documenting:

| Pattern Type        | Detection Criteria          | Example                                               |
| ------------------- | --------------------------- | ----------------------------------------------------- |
| **Code Pattern**    | Same solution used 2+ times | "Always add null check before accessing nested props" |
| **Process Pattern** | Workflow that succeeded     | "Run tests before committing"                         |
| **Problem Pattern** | Error that recurred         | "WebSocket disconnects on idle"                       |
| **Tool Pattern**    | Effective command combo     | "Use `pm2 logs --lines 50` for debugging"             |
| **Anti-Pattern**    | Approach that failed        | "Don't use innerHTML with user input"                 |

**Pattern Template:**

````markdown
### [Pattern Name]

**Type:** [Code/Process/Problem/Tool/Anti-Pattern]
**Context:** When [situation]
**Pattern:** [the pattern/solution]
**Example:**

```[lang]
[code or command]
```
````

**Learned:** [date]

````

### Step 3: Update Project State

Update `.project-state.json`:

```json
{
  "lastSession": {
    "date": "[ISO timestamp]",
    "completed": [
      "[Task 1 description]",
      "[Task 2 description]"
    ],
    "inProgress": "[Current task if incomplete]",
    "blockers": [
      "[Blocker 1]"
    ],
    "learnings": [
      "[Pattern 1 summary]"
    ],
    "metrics": {
      "tasksCompleted": 3,
      "errorsResolved": 2,
      "duration": "~45 min"
    }
  }
}
````

### Step 4: Suggest Next Steps

Prioritize recommendations:

```
PRIORITY_MATRIX:
1. Blockers to resolve (highest)
2. In-progress task to complete
3. Next planned task from PROJECT_PLAN.md
4. Quick wins identified during session
5. Technical debt items
```

## Output Format

```
┌─────────────────────────────────────────────────┐
│ 🔄 SESSION REFLECTION                           │
│ Date: [timestamp]                               │
├─────────────────────────────────────────────────┤
│ 📊 SESSION METRICS                              │
│ Duration: ~[X] minutes                          │
│ Tasks: [completed]/[attempted]                  │
│ Errors: [resolved]/[encountered]                │
│ Velocity: [assessment]                          │
├─────────────────────────────────────────────────┤
│ ✅ COMPLETED THIS SESSION                       │
│ • [Task 1]                                      │
│ • [Task 2]                                      │
│ • [Task 3]                                      │
├─────────────────────────────────────────────────┤
│ 🔄 IN PROGRESS                                  │
│ • [Task] - [status/next step]                   │
├─────────────────────────────────────────────────┤
│ 🚧 BLOCKERS                                     │
│ • [Blocker 1] → [suggested resolution]          │
├─────────────────────────────────────────────────┤
│ 💡 PATTERNS IDENTIFIED                          │
│                                                 │
│ [Pattern Name] ([Type])                         │
│ [Brief description]                             │
│ → Save to .claude/patterns.md? [Y/N]            │
├─────────────────────────────────────────────────┤
│ 📋 RECOMMENDED NEXT SESSION                     │
│ 1. [Highest priority - blocker or in-progress]  │
│ 2. [Next planned task]                          │
│ 3. [Quick win opportunity]                      │
├─────────────────────────────────────────────────┤
│ 📝 STATE UPDATED                                │
│ .project-state.json → lastSession updated       │
└─────────────────────────────────────────────────┘
```

## Example Output

```
┌─────────────────────────────────────────────────┐
│ 🔄 SESSION REFLECTION                           │
│ Date: 2026-01-15 15:30:00                       │
├─────────────────────────────────────────────────┤
│ 📊 SESSION METRICS                              │
│ Duration: ~45 minutes                           │
│ Tasks: 3/4 completed                            │
│ Errors: 2/2 resolved                            │
│ Velocity: Good - on track                       │
├─────────────────────────────────────────────────┤
│ ✅ COMPLETED THIS SESSION                       │
│ • Updated review.prompt.md to v2                │
│ • Fixed npm security vulnerabilities            │
│ • Added system skills table to CLAUDE.md        │
├─────────────────────────────────────────────────┤
│ 🔄 IN PROGRESS                                  │
│ • Device testing checklist - 4/6 devices done   │
├─────────────────────────────────────────────────┤
│ 🚧 BLOCKERS                                     │
│ • None                                          │
├─────────────────────────────────────────────────┤
│ 💡 PATTERNS IDENTIFIED                          │
│                                                 │
│ PM2 Debug Pattern (Tool)                        │
│ Use `pm2 logs --lines 50 --nostream | grep -i   │
│ error` for quick error scanning                 │
│ → Save to .claude/patterns.md? [Y/N]            │
├─────────────────────────────────────────────────┤
│ 📋 RECOMMENDED NEXT SESSION                     │
│ 1. Complete device testing (2 remaining)        │
│ 2. Start Phase 6: Multi-exchange support        │
│ 3. Address 127 lint warnings (quick win)        │
├─────────────────────────────────────────────────┤
│ 📝 STATE UPDATED                                │
│ .project-state.json → lastSession updated       │
└─────────────────────────────────────────────────┘
```

## Pattern Storage (Optional)

If user confirms pattern save, append to `.claude/patterns.md`:

```markdown
# Project Patterns

## Tool Patterns

### PM2 Debug Pattern

**Context:** When debugging PM2 process errors
**Pattern:** `pm2 logs --lines 50 --nostream | grep -i error`
**Learned:** 2026-01-15

---
```

## Velocity Assessment

| Rating       | Criteria                               |
| ------------ | -------------------------------------- |
| 🟢 Excellent | All tasks completed, no blockers       |
| 🟢 Good      | Most tasks completed, minor issues     |
| 🟡 Moderate  | Some progress, some blockers           |
| 🔴 Slow      | Limited progress, significant blockers |
| 🔴 Blocked   | No progress, critical blockers         |

## Constraints

- **Be concise** - Summarize, don't rehash entire conversation
- **Be actionable** - Every item should have clear next step
- **Update state** - Always update `.project-state.json`
- **Ask before saving patterns** - Don't auto-create pattern files
- **Focus on learnings** - Prioritize insights over status
