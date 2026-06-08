# Creates a release keystore for signing the APK
$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
    Write-Error "keytool not found. Install JDK and add it to PATH."
    exit 1
}

$keystore = Join-Path $PSScriptRoot "..\android\contentfloss-release.keystore"

keytool -genkeypair `
  -v `
  -keystore $keystore `
  -alias contentfloss `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -storepass contentfloss `
  -keypass contentfloss `
  -dname "CN=ContentFloss, OU=DigitalFlossie, O=DigitalFlossie, L=London, ST=England, C=GB"

Write-Host "Keystore created at $keystore"
