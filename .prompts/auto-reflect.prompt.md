# Auto-Reflect (Lightweight)

## Purpose

Automatic lightweight reflection that runs WITHOUT user prompt at key moments.
This is NOT the full "reflect" command - it's a quick checkpoint.

## Auto-Trigger Points

Run this automatically when:

1. **After fixing a CI/CD failure** - Before moving to next task
2. **After completing a PROJECT_PLAN.md phase** - Before starting next phase
3. **After resolving 3+ errors in one session** - Pattern detection
4. **Before ending session** - User says "bye", "done", "finished", "end session", "that's all"
5. **After any deployment** - Deployment retrospective

## Quick Reflect Format

```
┌─────────────────────────────────────────────────┐
│ 🔄 QUICK REFLECT                                │
├─────────────────────────────────────────────────┤
│ Trigger: [What triggered this reflect]          │
│                                                 │
│ What happened:                                  │
│ • [Brief summary - 1-2 sentences]               │
│                                                 │
│ Root cause (if error/failure):                  │
│ • [Why it happened]                             │
│                                                 │
│ Prevention:                                     │
│ • [How to avoid next time]                      │
│                                                 │
│ Pattern to remember:                            │
│ • [Reusable learning, if any]                   │
└─────────────────────────────────────────────────┘
```

## Trigger-Specific Templates

### After CI Failure Fix

```
┌─────────────────────────────────────────────────┐
│ 🔄 CI FAILURE RETROSPECTIVE                     │
├─────────────────────────────────────────────────┤
│ Workflow: [workflow name]                       │
│ Error: [brief error description]                │
│ Root cause: [why it failed]                     │
│ Fix applied: [what fixed it]                    │
│ Prevention: [how to avoid in future]            │
│                                                 │
│ □ Add to pre-commit checks?                     │
│ □ Add to CI workflow?                           │
│ □ Document in CLAUDE.md?                        │
└─────────────────────────────────────────────────┘
```

### After Phase Completion

```
┌─────────────────────────────────────────────────┐
│ 🔄 PHASE [N] COMPLETE                           │
├─────────────────────────────────────────────────┤
│ Phase: [phase name]                             │
│ Tasks completed: [X/Y]                          │
│ Duration: [estimate]                            │
│                                                 │
│ What went well:                                 │
│ • [1-2 items]                                   │
│                                                 │
│ What was harder than expected:                  │
│ • [1-2 items]                                   │
│                                                 │
│ Carry forward to next phase:                    │
│ • [learnings to apply]                          │
│                                                 │
│ → Updating .project-state.json                  │
└─────────────────────────────────────────────────┘
```

### After Error Pattern (3+ errors)

```
┌─────────────────────────────────────────────────┐
│ 🔄 ERROR PATTERN DETECTED                       │
├─────────────────────────────────────────────────┤
│ Errors this session: [count]                    │
│                                                 │
│ Pattern identified:                             │
│ • [common thread between errors]                │
│                                                 │
│ Systemic issue?                                 │
│ • [Yes/No - explanation]                        │
│                                                 │
│ Recommended action:                             │
│ • [fix the systemic issue / add checks]         │
└─────────────────────────────────────────────────┘
```

### End of Session

```
┌─────────────────────────────────────────────────┐
│ 🔄 SESSION WRAP-UP                              │
├─────────────────────────────────────────────────┤
│ Completed:                                      │
│ • [task 1]                                      │
│ • [task 2]                                      │
│                                                 │
│ In progress:                                    │
│ • [task] - [status]                             │
│                                                 │
│ Next session should start with:                 │
│ • [highest priority item]                       │
│                                                 │
│ → .project-state.json updated                   │
└─────────────────────────────────────────────────┘
```

## State Update

**MANDATORY: Update `.project-state.json` immediately after showing the reflect box.**

```json
{
  "lastSession": {
    "date": "[ISO timestamp]",
    "completed": ["task1", "task2"],
    "inProgress": "current task",
    "nextPriority": "what to do next"
  }
}
```

## Rules

**⚠️ CRITICAL - READ CAREFULLY:**

1. **AUTOMATIC TRIGGER** - When a trigger condition is met (CI fix, phase complete, etc.), run this IMMEDIATELY without being asked
2. **NO PERMISSION NEEDED** - Do NOT ask "Would you like me to..." - just do it
3. **ALWAYS UPDATE STATE** - After showing the reflect box, update `.project-state.json` in the same response
4. **KEEP IT BRIEF** - Max 10 lines of content in the box
5. **DON'T ANNOUNCE** - Don't say "running auto-reflect" - just show the box naturally

**❌ NEVER DO THIS:**

```
"Would you like me to update .project-state.json?"
"Should I run a reflection?"
"I can run an auto-reflect if you want"
```

**✅ ALWAYS DO THIS:**

```
[Show reflect box]
[Immediately update .project-state.json]
[Continue with next task or end response]
```

## Trigger Detection

**You MUST self-check after these events:**

| Event                 | Check                                | Action                         |
| --------------------- | ------------------------------------ | ------------------------------ |
| Fixed a CI failure    | Did I just fix a workflow?           | → Run CI FAILURE RETROSPECTIVE |
| Completed phase tasks | Are all tasks in current phase done? | → Run PHASE COMPLETE           |
| Fixed 3+ errors       | Count errors fixed this session      | → Run ERROR PATTERN DETECTED   |
| User ending session   | Did user say bye/done/finished?      | → Run SESSION WRAP-UP          |
| Deployed something    | Did I just deploy?                   | → Run deployment retrospective |

**If ANY trigger condition is true → Run auto-reflect immediately, no questions asked.**
