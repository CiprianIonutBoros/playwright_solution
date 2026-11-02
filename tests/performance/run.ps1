param(
    [Parameter(Position = 0)]
    [ValidateSet('smoke', 'load', 'stress', 'spike', 'soak', 'breakpoint', 'scalability')]
    [string]$Test = 'smoke'
)

$ErrorActionPreference = 'Stop'
$reportPath = Join-Path (Get-Location) 'k6-report.html'
# Reject an old report if k6 did not write one during this run.
$startedAt = [DateTime]::UtcNow

& k6 run (Join-Path $PSScriptRoot "$Test.js")
# Threshold failures still produce reports; keep k6's exit code for the caller.
$testExitCode = $LASTEXITCODE

$report = Get-Item -LiteralPath $reportPath -ErrorAction SilentlyContinue
if ($null -eq $report -or $report.LastWriteTimeUtc -lt $startedAt) {
    [Console]::Error.WriteLine("k6 did not generate a fresh report at $reportPath.")
    if ($testExitCode -ne 0) {
        exit $testExitCode
    }
    exit 1
}

try {
    & (Join-Path $PSScriptRoot '..\open-report.ps1') -ReportPath $report.FullName
} catch {
    [Console]::Error.WriteLine("Could not open report at ${reportPath}: $($_.Exception.Message)")
    if ($testExitCode -ne 0) {
        exit $testExitCode
    }
    exit 1
}

exit $testExitCode
