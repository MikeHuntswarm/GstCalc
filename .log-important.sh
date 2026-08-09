#!/usr/bin/env bash
# ==============================================================================
# Hermes Repository-Scoped Auto-Logger
# Dynamic path resolution for multi-window workspace isolation
# ==============================================================================

set -euo pipefail

# 1. Dynamically resolve the project name from the folder it runs in
REPO_NAME=$(basename "$(pwd)")
OBSIDIAN_TARGET="$HOME/Documents/ObsidianVault/Git-Repos-Sync/GstCalc/Active-Context-Memory"

# Ensure the destination folder exists inside the vault
mkdir -p "$OBSIDIAN_TARGET"

# 2. Capture inputs passed to the script
LOG_TYPE=${1:-"milestone"}  # e.g., dependency, architecture, bug, milestone
LOG_TITLE=$2
LOG_BODY=$3

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
FILENAME_SAFE_TITLE=$(echo "$LOG_TITLE" | sed 's/[^a-zA-Z0-9_-]/_/g')
TARGET_FILE="$OBSIDIAN_TARGET/${FILENAME_SAFE_TITLE}.md"

echo "Logging event to [GstCalc] knowledge silo..."

# 3. Write structured Markdown note matching your vault hierarchy
cat << EOF > "$TARGET_FILE"
---
project: GstCalc
timestamp: $TIMESTAMP
type: $LOG_TYPE
tags: [repo-log, GstCalc, $LOG_TYPE]
---
# 📌 $LOG_TITLE

## Context & Details
$LOG_BODY

---
*Logged dynamically from terminal instance.*
EOF

echo "✓ Log successfully pinned to: Git-Repos-Sync/GstCalc/Active-Context-Memory/${FILENAME_SAFE_TITLE}.md"