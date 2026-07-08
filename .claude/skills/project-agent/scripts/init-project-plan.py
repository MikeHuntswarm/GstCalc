#!/usr/bin/env python3
"""
Initialize a new project plan structure.
Creates PROJECT_PLAN.md and .project-state.json in the specified directory.
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path


def create_project_plan(
    project_dir: str,
    project_name: str,
    vision: str,
    users: dict,
    stack: dict,
    phases: list,
    security_checklists: list,
):
    """Generate PROJECT_PLAN.md and .project-state.json"""
    
    project_path = Path(project_dir)
    project_path.mkdir(parents=True, exist_ok=True)
    
    now = datetime.now().strftime("%Y-%m-%d")
    
    # Generate PROJECT_PLAN.md
    plan_content = f"""# {project_name} - Project Plan

**Created:** {now}
**Last Updated:** {now}
**Status:** Planning

## Vision

{vision}

## Users

- **Primary:** {users.get('primary', 'TBD')}
- **Scale:** {users.get('scale', 'TBD')}
- **Access:** {users.get('access', 'TBD')}

## Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | {stack.get('frontend', 'TBD')} | {stack.get('frontend_reason', 'TBD')} |
| Backend | {stack.get('backend', 'TBD')} | {stack.get('backend_reason', 'TBD')} |
| Database | {stack.get('database', 'TBD')} | {stack.get('database_reason', 'TBD')} |
| Auth | {stack.get('auth', 'TBD')} | {stack.get('auth_reason', 'TBD')} |
| Deployment | {stack.get('deployment', 'TBD')} | {stack.get('deployment_reason', 'TBD')} |

**Security Checklists Applied:** {', '.join(security_checklists)}

## Phases

"""
    
    for i, phase in enumerate(phases, 1):
        plan_content += f"""### Phase {i}: {phase['name']} ({phase.get('timeline', 'TBD')})
**Goal:** {phase.get('goal', 'TBD')}
**Status:** [ ] Not Started

Tasks:
"""
        for task in phase.get('tasks', []):
            plan_content += f"- [ ] {task}\n"
        plan_content += "\n"
    
    plan_content += """## Quality Gates

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
"""
    
    # Write PROJECT_PLAN.md
    plan_path = project_path / "PROJECT_PLAN.md"
    with open(plan_path, 'w') as f:
        f.write(plan_content)
    
    # Generate .project-state.json
    state = {
        "projectName": project_name,
        "created": datetime.now().isoformat(),
        "lastUpdated": datetime.now().isoformat(),
        "currentPhase": 1,
        "totalPhases": len(phases),
        "stack": stack,
        "securityChecklists": security_checklists,
        "phases": [
            {
                "number": i + 1,
                "name": phase['name'],
                "status": "not-started" if i > 0 else "in-progress",
                "tasks": [
                    {"id": f"{i+1}.{j+1}", "name": task, "status": "pending", "steps": []}
                    for j, task in enumerate(phase.get('tasks', []))
                ]
            }
            for i, phase in enumerate(phases)
        ],
        "lastSession": {
            "date": datetime.now().isoformat(),
            "completed": [],
            "inProgress": None
        },
        "deviations": [],
        "securityDebt": [],
        "backlog": [],
        "cicd": {
            "lastCheck": None,
            "allPassing": False,
            "failedRuns": []
        }
    }
    
    state_path = project_path / ".project-state.json"
    with open(state_path, 'w') as f:
        json.dump(state, f, indent=2)
    
    print(f"✓ Created: {plan_path}")
    print(f"✓ Created: {state_path}")
    return str(plan_path), str(state_path)


def main():
    """CLI entry point"""
    if len(sys.argv) < 3:
        print("Usage: init-project-plan.py <project-dir> <project-name>")
        print("  Creates PROJECT_PLAN.md and .project-state.json with placeholder values")
        sys.exit(1)
    
    project_dir = sys.argv[1]
    project_name = sys.argv[2]
    
    # Create with placeholder values
    create_project_plan(
        project_dir=project_dir,
        project_name=project_name,
        vision="[Project vision to be defined]",
        users={"primary": "TBD", "scale": "TBD", "access": "TBD"},
        stack={
            "frontend": "TBD", "frontend_reason": "To be selected",
            "backend": "TBD", "backend_reason": "To be selected",
            "database": "TBD", "database_reason": "To be selected",
            "auth": "TBD", "auth_reason": "To be selected",
            "deployment": "TBD", "deployment_reason": "To be selected",
        },
        phases=[
            {"name": "Foundation", "timeline": "Week 1-2", "goal": "TBD", "tasks": ["Task 1", "Task 2"]},
            {"name": "Core Features", "timeline": "Week 3-4", "goal": "TBD", "tasks": ["Task 1", "Task 2"]},
            {"name": "Polish & Launch", "timeline": "Week 5-6", "goal": "TBD", "tasks": ["Task 1", "Task 2"]},
        ],
        security_checklists=["general-web.md"],
    )


if __name__ == "__main__":
    main()
