# Issue tracker: GitHub

Issues live as GitHub issues via `gh` CLI.

## Conventions

- **Create**: `gh issue create --title "..." --body "..."`
- **Read**: `gh issue view <number> --comments`
- **List**: `gh issue list --state open --json number,title,body,labels`
- **Comment**: `gh issue comment <number> --body "..."`
- **Label**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

## Pull requests as a triage surface

**PRs as a request surface: no.**

## Publishing and fetching

- "Publish to the issue tracker" → `gh issue create`
- "Fetch the relevant ticket" → `gh issue view <number> --comments`
