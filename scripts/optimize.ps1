$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = (Get-Location).Path
$src  = Join-Path $root "src-assets"
$out  = Join-Path $root "assets"

function Save-Jpeg($bmp, $path, $quality) {
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq "image/jpeg" }
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
  $bmp.Save($path, $codec, $params)
}

# --- 1. Book cover 800x1200 ---
$cover = [System.Drawing.Image]::FromFile((Join-Path $src "Title.png"))
$w = 800; $h = 1200
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::FromArgb(12, 11, 10))
$g.DrawImage($cover, 0, 0, $w, $h)
$g.Dispose()
Save-Jpeg $bmp (Join-Path $out "book-cover.jpg") 82
$bmp.Dispose()
Write-Host "book-cover.jpg written"

# --- 2. Open Graph image 1200x630 ---
$og = New-Object System.Drawing.Bitmap(1200, 630)
$g = [System.Drawing.Graphics]::FromImage($og)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
$g.Clear([System.Drawing.Color]::FromArgb(12, 11, 10))
$g.DrawImage($cover, 720, 15, 400, 600)
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(58, 51, 43), 2)
$g.DrawRectangle($pen, 720, 15, 400, 600)
$pen.Dispose()

$cName   = [System.Drawing.ColorTranslator]::FromHtml("#b3aa98")
$cTitle  = [System.Drawing.ColorTranslator]::FromHtml("#ece5d8")
$cAccent = [System.Drawing.ColorTranslator]::FromHtml("#d3283a")
$fSmall = New-Object System.Drawing.Font("Georgia", 17)
$fBig   = New-Object System.Drawing.Font("Georgia", 74, [System.Drawing.FontStyle]::Bold)
$fSub   = New-Object System.Drawing.Font("Georgia", 15, [System.Drawing.FontStyle]::Italic)
$b1 = New-Object System.Drawing.SolidBrush($cName)
$b2 = New-Object System.Drawing.SolidBrush($cTitle)
$b3 = New-Object System.Drawing.SolidBrush($cAccent)
$b4 = New-Object System.Drawing.SolidBrush($cName)
$g.DrawString("MATHAVAN UMA MAGESHWARI", $fSmall, $b1, 80, 170)
$g.DrawString("THE LAST", $fBig, $b2, 78, 215)
$g.DrawString("BLADE", $fBig, $b3, 78, 310)
$g.DrawString("A Cinematic Revenge Thriller", $fSub, $b4, 80, 430)
$fSmall.Dispose(); $fBig.Dispose(); $fSub.Dispose()
$b1.Dispose(); $b2.Dispose(); $b3.Dispose(); $b4.Dispose()
$g.Dispose()
Save-Jpeg $og (Join-Path $out "og-image.jpg") 85
$og.Dispose()
$cover.Dispose()
Write-Host "og-image.jpg written"

Get-ChildItem $out -Filter *.jpg | ForEach-Object {
  Write-Host ($_.Name + " " + [math]::Round($_.Length / 1KB) + "KB")
}
