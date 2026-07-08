# Micro-Plan Template

Use this template when breaking down features/tasks into granular steps.

```markdown
## [Feature/Task Name]

### Overview

- **Parent Phase:** [Phase X]
- **Estimated Effort:** [X hours/days]
- **Priority:** [P0/P1/P2/P3]
- **Assignee:** [Name or Self]

### Prerequisites

- [ ] [Dependency 1]
- [ ] [Dependency 2]

### Steps

#### 1. [Main Step Name]

**Effort:** [Xh]

1.1 [Sub-step] - Details: [specifics] - File(s): [affected files]

1.2 [Sub-step] - Details: [specifics] - File(s): [affected files]

**Checkpoint:** [What to verify before moving on]

#### 2. [Main Step Name]

**Effort:** [Xh]

2.1 [Sub-step]
2.2 [Sub-step]

**Checkpoint:** [What to verify]

### Security Considerations

- [ ] [Security item from checklist]
- [ ] [Security item from checklist]

### UX Considerations

- [ ] [UX standard to verify]
- [ ] [UX standard to verify]

### Testing

- [ ] Unit tests for: [components]
- [ ] Integration test for: [flow]
- [ ] Manual verification: [steps]

### Completion Criteria

- [ ] All steps completed
- [ ] Security items addressed
- [ ] UX standards met
- [ ] Tests passing
- [ ] PR reviewed (if applicable)
```

## Usage Notes

1. **Granularity**: Each sub-step should be completable in <2 hours
2. **Checkpoints**: Never skip - catch issues early
3. **File tracking**: Helps with code review and rollback
4. **Security/UX**: Reference specific checklist items, don't copy
