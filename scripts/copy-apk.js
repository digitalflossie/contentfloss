const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'ContentFloss-release.apk');
const dest = path.join(__dirname, '..', 'ContentFloss-release.apk');

if (!fs.existsSync(src)) {
  console.error('APK not found. Run: npm run build:apk');
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log(`APK copied to ${dest}`);
