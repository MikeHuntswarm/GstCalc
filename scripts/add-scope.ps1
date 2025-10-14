Param(
  [string]$LogPath = "NRL_Sim_Project_Log.md",
  [Parameter(Mandatory=$true)][string]$Area,
  [string]$Date = (Get-Date -Format 'yyyy-MM-dd'),
  [string[]]$Detail
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $LogPath)) {
  throw "Log file not found: $LogPath"
}

$content = Get-Content -Path $LogPath -Raw -Encoding utf8
$scopeHeader = '## 📜 Project Scope (Living Document)'
$idx = $content.IndexOf($scopeHeader)
if ($idx -lt 0) { throw "Scope header not found." }

$insertPos = $content.IndexOf('---', $idx)
if ($insertPos -lt 0) { throw "Scope terminator not found." }

$pre = $content.Substring(0, $insertPos).TrimEnd()
$post = $content.Substring($insertPos)

$detailsText = if ($Detail) { ($Detail | ForEach-Object { "  - $_" }) -join "`n" } else { "" }
$newScope = @"
$pre
- **$Area** (created: $Date)
$detailsText
$post
"@

$newScope | Set-Content -Path $LogPath -Encoding utf8
Write-Host "Added scope item '$Area' to $LogPath"
