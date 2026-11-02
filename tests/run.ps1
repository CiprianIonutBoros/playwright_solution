param(
    [Parameter(Position = 0)]
    [ValidateSet('api', 'combined')]
    [string]$Project = 'api',
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$TestArguments
)

$ErrorActionPreference = 'Stop'
$reportPath = Join-Path (Get-Location) 'test-dashboard\index.html'
# Reject an old dashboard if the reporter did not write one during this run.
$startedAt = [DateTime]::UtcNow

& npx playwright test "--project=$Project" '--workers=2' @TestArguments
# Preserve Playwright's result even when report opening also fails.
$testExitCode = $LASTEXITCODE

$report = Get-Item -LiteralPath $reportPath -ErrorAction SilentlyContinue
if ($null -eq $report -or $report.LastWriteTimeUtc -lt $startedAt) {
    [Console]::Error.WriteLine("Playwright did not generate a fresh report at $reportPath.")
    if ($testExitCode -ne 0) { exit $testExitCode }
    exit 1
}

try {
    if (-not $env:CI) {
        & (Join-Path $PSScriptRoot 'open-report.ps1') -ReportPath $report.FullName
    }
} catch {
    [Console]::Error.WriteLine("Could not open report at ${reportPath}: $($_.Exception.Message)")
    if ($testExitCode -ne 0) { exit $testExitCode }
    exit 1
}

exit $testExitCode
