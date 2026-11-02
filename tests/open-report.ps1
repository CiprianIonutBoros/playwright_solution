param(
    [Parameter(Mandatory = $true)]
    [string]$ReportPath
)

$ErrorActionPreference = 'Stop'
$report = Get-Item -LiteralPath $ReportPath -ErrorAction Stop
$choice = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\https\UserChoice' -ErrorAction Stop
$commandKey = Get-Item -LiteralPath "Registry::HKEY_CLASSES_ROOT\$($choice.ProgId)\shell\open\command" -ErrorAction Stop
$browserCommand = [Environment]::ExpandEnvironmentVariables($commandKey.GetValue(''))

if ($browserCommand -notmatch '^\s*(?:"([^"]+\.exe)"|([^\s"]+\.exe))(?:\s|$)') {
    throw "Cannot resolve the default browser executable for $($choice.ProgId)."
}

$browserPath = if ($Matches[1]) { $Matches[1] } else { $Matches[2] }
$reportUri = ([Uri]$report.FullName).AbsoluteUri
Start-Process -FilePath $browserPath -ArgumentList "`"$reportUri`"" -ErrorAction Stop
