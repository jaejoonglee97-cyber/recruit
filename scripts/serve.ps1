# Local static file server for previewing the demo (no Node/Python needed).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/serve.ps1 [-Port 5173]
# Not used by the Vercel deployment.
param([int]$Port = 5173)

$Root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.png' = 'image/png'; '.svg' = 'image/svg+xml'; '.json' = 'application/json; charset=utf-8'
  '.csv' = 'text/csv; charset=utf-8'; '.txt' = 'text/plain; charset=utf-8'; '.md' = 'text/markdown; charset=utf-8'; '.ico' = 'image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $Root at http://localhost:$Port/"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($path -eq '/') { $path = '/index.html' }
    $full = [IO.Path]::GetFullPath((Join-Path $Root ($path.TrimStart('/'))))
    if ($full.StartsWith($Root) -and (Test-Path -LiteralPath $full -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($full)
      $ext = [IO.Path]::GetExtension($full).ToLower()
      if ($mime.ContainsKey($ext)) { $res.ContentType = $mime[$ext] } else { $res.ContentType = 'application/octet-stream' }
      $res.StatusCode = 200
    } else {
      $bytes = [Text.Encoding]::UTF8.GetBytes('Not found')
      $res.StatusCode = 404
    }
    $res.Headers.Add('Cache-Control', 'no-store')
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } catch {
    Write-Host "error: $_"
  } finally {
    $res.Close()
  }
}
