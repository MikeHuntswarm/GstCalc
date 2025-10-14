#!/usr/bin/env bash
set -euo pipefail

LOG_PATH="NRL_Sim_Project_Log.md"
DATE="$(date +%Y-%m-%d)"
SUMMARY=""
PROGRESS=()
ISSUES=()
NEXT=()
CHECKPOINT_NUM=""

usage() {
  cat <<USAGE
Usage: $0 [--log-path PATH] [--date YYYY-MM-DD] [--number N] \
          --summary "text" \
          --progress "bullet" [--progress "bullet"...] \
          [--issues "bullet"...] \
          [--next "bullet"...]

Appends a checkpoint to the Markdown log in HCPP format.

Examples:
  $0 --summary "Finals UX split" --progress "Season ends at round-robin" --issues "High scores" --next "Tune model"
  $0 --log-path docs/NRL_Sim_Project_Log.md --date 2025-10-02 --summary "Score tuning"
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --log-path) LOG_PATH="$2"; shift 2;;
    --date) DATE="$2"; shift 2;;
    --number) CHECKPOINT_NUM="$2"; shift 2;;
    --summary) SUMMARY="$2"; shift 2;;
    --progress) PROGRESS+=("$2"); shift 2;;
    --issues) ISSUES+=("$2"); shift 2;;
    --next) NEXT+=("$2"); shift 2;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 1;;
  esac
done

if [[ -z "$SUMMARY" ]]; then
  echo "Error: --summary is required" >&2
  exit 1
fi

# Ensure file exists with baseline headings
if [[ ! -f "$LOG_PATH" ]]; then
  mkdir -p "$(dirname "$LOG_PATH")"
  cat >"$LOG_PATH" <<'HDR'
# 🏉 NRL Sim – Project Log

## 📜 Project Scope (Living Document)
(Add new scope items here with dates. Update when changed.)

---
HDR
fi

# Determine next checkpoint number if not provided
if [[ -z "$CHECKPOINT_NUM" ]]; then
  LAST_NUM=$(grep -Eo '^## ✅ Checkpoint [0-9]+' "$LOG_PATH" | awk '{print $4}' | tail -n1 || true)
  if [[ -z "$LAST_NUM" ]]; then
    CHECKPOINT_NUM=1
  else
    CHECKPOINT_NUM=$((LAST_NUM + 1))
  fi
fi

# Build sections
echo >>"$LOG_PATH"
echo "## ✅ Checkpoint ${CHECKPOINT_NUM} – ${DATE}" >>"$LOG_PATH"
echo "Summary: ${SUMMARY}" >>"$LOG_PATH"
echo "Progress:" >>"$LOG_PATH"
if [[ ${#PROGRESS[@]} -eq 0 ]]; then echo "- (none)" >>"$LOG_PATH"; else for p in "${PROGRESS[@]}"; do echo "- ${p}" >>"$LOG_PATH"; done; fi
echo "Issues:" >>"$LOG_PATH"
if [[ ${#ISSUES[@]} -eq 0 ]]; then echo "- (none)" >>"$LOG_PATH"; else for i in "${ISSUES[@]}"; do echo "- ${i}" >>"$LOG_PATH"; done; fi
echo "Next Steps:" >>"$LOG_PATH"
if [[ ${#NEXT[@]} -eq 0 ]]; then echo "- (none)" >>"$LOG_PATH"; else for n in "${NEXT[@]}"; do echo "- ${n}" >>"$LOG_PATH"; done; fi
echo >>"$LOG_PATH"

echo "Appended Checkpoint ${CHECKPOINT_NUM} to ${LOG_PATH}"
