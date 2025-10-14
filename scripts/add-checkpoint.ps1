Param(
  [string]$LogPath = "NRL_Sim_Project_Log.md",
  [string]$Date = (Get-Date -Format 'yyyy-MM-dd'),
  [Parameter(Mandatory=$true)][string]$Summary,
  [string[]]$Progress,
  [string[]]$Issues,
  [string[]]$Next,
  [int]$Number
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $LogPath)) {
  New-Item -ItemType Directory -Force -Path (Split-Path $LogPath) | Out-Null
  @"
# 🏉 NRL Sim – Project Log

## 📜 Project Scope (Living Document)
(Add new scope items here with dates. Update when changed.)

---
"@ | Out-File -FilePath $LogPath -Encoding utf8
}

if (-not $PSBoundParameters.ContainsKey('Number')) {
  $last = (Select-String -Path $LogPath -Pattern '^## ✅ Checkpoint ([0-9]+)' | Select-Object -Last 1)
  if ($last) {
    $num = [int]($last.Matches.Groups[1].Value) + 1
  } else {
    $num = 1
  }
} else {
  $num = $Number
}

$block = @"
## ✅ Checkpoint $num – $Date
Summary: $Summary
Progress:
{0}
Issues:
{1}
Next Steps:
{2}

"@ -f (
  ($(if ($Progress) { $Progress } else { @("(none)") }) | ForEach-Object { "- $_" }) -join "`n"),
  ($(if ($Issues) { $Issues } else { @("(none)") }) | ForEach-Object { "- $_" }) -join "`n"),
  ($(if ($Next) { $Next } else { @("(none)") }) | ForEach-Object { "- $_" }) -join "`n")
Add-Content -Path $LogPath -Value $block -Encoding utf8
Write-Host "Appended Checkpoint $num to $LogPath"
