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

# --- 1. Resize to 650x836 (native aspect) ---
$photo = [System.Drawing.Image]::FromFile((Join-Path $src "Profile.png"))
$w = 650; $h = 836
$base = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($base)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.Clear([System.Drawing.Color]::FromArgb(12, 11, 10))
$g.DrawImage($photo, 0, 0, $w, $h)
$g.Dispose()
$photo.Dispose()

# --- 2. Contrast pass (S-curve via ColorMatrix, c=1.06) ---
$c = 1.06; $t = 0.5 * (1 - $c)
$cm = New-Object System.Drawing.Imaging.ColorMatrix
$cm.Matrix00 = $c; $cm.Matrix11 = $c; $cm.Matrix22 = $c
$cm.Matrix40 = $t; $cm.Matrix41 = $t; $cm.Matrix42 = $t
$ia = New-Object System.Drawing.Imaging.ImageAttributes
$ia.SetColorMatrix($cm)
$tmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($tmp)
$g.Clear([System.Drawing.Color]::FromArgb(12, 11, 10))
$dest = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$g.DrawImage($base, $dest, 0, 0, $w, $h, [System.Drawing.GraphicsUnit]::Pixel, $ia)
$g.Dispose()

# --- 3. Saturation pass (cinematic muted color, s=0.88) ---
$s = 0.88; $lr = 0.299; $lg = 0.587; $lb = 0.114
$cm2 = New-Object System.Drawing.Imaging.ColorMatrix
$cm2.Matrix00 = $s + (1 - $s) * $lr
$cm2.Matrix11 = $s + (1 - $s) * $lg
$cm2.Matrix22 = $s + (1 - $s) * $lb
$cm2.Matrix01 = (1 - $s) * $lr
$cm2.Matrix02 = (1 - $s) * $lr
$cm2.Matrix10 = (1 - $s) * $lg
$cm2.Matrix12 = (1 - $s) * $lg
$cm2.Matrix20 = (1 - $s) * $lb
$cm2.Matrix21 = (1 - $s) * $lb
$ia2 = New-Object System.Drawing.Imaging.ImageAttributes
$ia2.SetColorMatrix($cm2)
$final = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($final)
$g.Clear([System.Drawing.Color]::FromArgb(12, 11, 10))
$g.DrawImage($tmp, $dest, 0, 0, $w, $h, [System.Drawing.GraphicsUnit]::Pixel, $ia2)
$g.Dispose()
$tmp.Dispose(); $base.Dispose()

# --- 4. Cinematic tone overlays (warm key light / cool shadow) ---
$g = [System.Drawing.Graphics]::FromImage($final)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

$warmCol  = [System.Drawing.Color]::FromArgb(26, 240, 224, 200)
$coolCol  = [System.Drawing.Color]::FromArgb(30, 14, 36, 48)
$clearCol = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)

$warmBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point(0, 0)),
  (New-Object System.Drawing.Point($w, [int]($h * 0.6))),
  $warmCol, $clearCol)
$g.FillRectangle($warmBrush, 0, 0, $w, $h)
$warmBrush.Dispose()

$coolBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point($w, $h)),
  (New-Object System.Drawing.Point(0, [int]($h * 0.4))),
  $coolCol, $clearCol)
$g.FillRectangle($coolBrush, 0, 0, $w, $h)
$coolBrush.Dispose()

# --- 5. Soft corner vignette ---
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse([int](-$w * 0.25), [int](-$h * 0.25), [int]($w * 1.5), [int]($h * 1.5))
$pgb = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
$pgb.CenterColor = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
$pgb.SurroundColors = @([System.Drawing.Color]::FromArgb(70, 5, 4, 3))
$g.FillPath($pgb, $path)  
$pgb.Dispose()
$path.Dispose()
$g.Dispose()

# --- 6. Save ---
Save-Jpeg $final (Join-Path $out "author-portrait.jpg") 86
$final.Dispose()
Write-Host "author-portrait.jpg written"

Get-ChildItem $out -Filter author-portrait.jpg | ForEach-Object {
  Write-Host ($_.Name + " " + [math]::Round($_.Length / 1KB) + "KB")
}
