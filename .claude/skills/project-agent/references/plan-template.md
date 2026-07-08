# Project Plan Template

Use this structure when creating PROJECT_PLAN.md for new projects.

```markdown
# [Project Name] - Project Plan

**Created:** [YYYY-MM-DD]
**Last Updated:** [YYYY-MM-DD]
**Status:** [Planning | In Progress | Complete]

## Vision

[2-3 sentence description of what this project does and why]

## Users

- **Primary:** [Who is this for?]
- **Scale:** [Expected data/user volume]
- **Access:** [Public | Private | Team]

## Technology Stack

| Layer      | Choice   | Rationale |
| ---------- | -------- | --------- |
| Frontend   | [choice] | [why]     |
| Backend    | [choice] | [why]     |
| Database   | [choice] | [why]     |
| Auth       | [choice] | [why]     |
| Deployment | [choice] | [why]     |

**Security Checklists Applied:** [list]

## Phases

### Phase 1: [Name] ([Timeline])

**Goal:** [What this phase achieves]
**Status:** [ ] Not Started | [~] In Progress | [✓] Complete

Tasks:

- [ ] 1.1 [Task name]
- [ ] 1.2 [Task name]

### Phase 2: [Name] ([Timeline])

...

## Quality Gates

Before each phase completion:

- [ ] All security checklist items addressed
- [ ] UX standards verified
- [ ] Code reviewed
- [ ] Tests passing

## Pre-Deployment Gate

Before ANY deployment:

- [ ] All changes committed and pushed
- [ ] All GitHub Actions workflows passing
- [ ] Past failed actions reviewed and resolved
- [ ] PROJECT_REVIEW.md generated with passing score
- [ ] Security audit complete (no Critical/High issues)

## Backlog

Items for future consideration:

- [Item]

## Deviation Log

| Date | Feature | Decision | Justification |
| ---- | ------- | -------- | ------------- |
|      |         |          |               |

## Notes

[Project notes]
```
