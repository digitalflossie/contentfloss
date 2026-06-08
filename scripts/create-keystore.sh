#!/bin/bash
# Creates a release keystore for signing the APK
keytool -genkeypair \
  -v \
  -keystore android/contentfloss-release.keystore \
  -alias contentfloss \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass contentfloss \
  -keypass contentfloss \
  -dname "CN=ContentFloss, OU=DigitalFlossie, O=DigitalFlossie, L=London, ST=England, C=GB"

echo "Keystore created at android/contentfloss-release.keystore"
