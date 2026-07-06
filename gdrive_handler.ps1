param([string]$Url)

Add-Type -AssemblyName System.Windows.Forms

$logPath = Join-Path $env:TEMP "gdrive_handler.log"
"[$(Get-Date -Format s)] RAW  : $Url" | Out-File -FilePath $logPath -Append -Encoding UTF8

# Strip prefix "gdrive:" (BUKAN "gdrive://")
$stripped = $Url -replace '^gdrive:', ''
$decoded  = [System.Uri]::UnescapeDataString($stripped)
$path     = $decoded.Replace('/', '\')

"[$(Get-Date -Format s)] PATH : $path" | Out-File -FilePath $logPath -Append -Encoding UTF8

if (Test-Path -LiteralPath $path) {
    explorer.exe $path
} else {
    [System.Windows.Forms.MessageBox]::Show(
        "Folder belum tersedia di laptop ini atau Google Drive Desktop belum selesai sinkronisasi.`n`nPath yang dicoba:`n$path",
        "Audit Tracker KBS",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Warning
    )
}
