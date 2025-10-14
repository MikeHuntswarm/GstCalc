#!/usr/bin/env bash
set -euo pipefail

LOG_PATH="NRL_Sim_Project_Log.md"
AREA=""
DATE="$(date +%Y-%m-%d)"
DETAILS=()

usage() {
  cat <<USAGE
Usage: $0 [--log-path PATH] --area "Area Name" [--date YYYY-MM-DD] \
          [--detail "line"] [--detail "line"...]

Adds a new scope item under the Project Scope section.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --log-path) LOG_PATH="$2"; shift 2;;
    --area) AREA="$2"; shift 2;;
    --date) DATE="$2"; shift 2;;
    --detail) DETAILS+=("$2"); shift 2;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 1;;
  esac
done

[[ -z "$AREA" ]] && { echo "Error: --area is required" >&2; exit 1; }

if [[ ! -f "$LOG_PATH" ]]; then
  echo "Error: Log file not found: $LOG_PATH" >&2
  exit 1
fi

TMP=$(mktemp)
awk '
  BEGIN{in_scope=0}
  /^## 📜 Project Scope \(Living Document\)/{print; in_scope=1; next}
  in_scope && /^---/ { # before scope terminator, inject our item
    print "- **" ENVIRON["AREA"] "** (created: " ENVIRON["DATE"] ")"
    for (i=1; i<=ENVIRON["DCOUNT"]; i++) {
      printf("  - %s\n", ENVIRON["D" i])
    }
    in_scope=0
  }
  {print}
' AREA="$AREA" DATE="$DATE" DCOUNT="${#DETAILS[@]}" $(for i in $(seq 1 ${#DETAILS[@]}); do echo "D$i=${DETAILS[$((i-1))]}"; done) "$LOG_PATH" >"$TMP"
mv "$TMP" "$LOG_PATH"
echo "Added scope item '$AREA' to $LOG_PATH"
