# ContentFloss

**Turn one idea into multiple high-performing posts**

ContentFloss is a lightweight AI content repurposing tool. Paste long-form text or a YouTube link, and generate platform-specific posts for Instagram, LinkedIn, and Twitter — powered by Groq LLaMA3.

---

## Project Structure

```
contentfloss/
├── www/                  # Web app (HTML, CSS, JS)
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── lib/
│   └── groq.js           # Groq API integration
├── android/              # Android WebView APK wrapper
│   └── app/src/main/
│       ├── assets/www/   # Bundled web app
│       └── java/.../MainActivity.java
├── server.js             # Node.js backend
├── package.json
└── README.md
```

---

## Prerequisites

- **Node.js** 18+ and npm
- **Groq API key** from [Groq Cloud Console](https://console.groq.com/keys)
- **JDK 17+** and **Android SDK** (for APK builds only)

---

## Run Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Set your Groq API key

Copy the example env file and add your key:

```bash
cp .env.example .env
```

Edit `.env`:

```
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
```

### 3. Start the server

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Add your Groq API key

Create a `.env` file in the project root:

```
GROQ_API_KEY=your_key
PORT=3000
```

Get a key from [Groq Cloud Console](https://console.groq.com/keys). The key is read server-side via `process.env.GROQ_API_KEY` and is never exposed to the browser.

---

## Free Usage Limit

ContentFloss includes a client-side free tier for monetization:

- **3 free generations per day** (tracked in `localStorage`)
- Resets automatically each day
- After the limit: *"You've reached your free limit. Upgrade to continue using ContentFloss."*

Storage keys: `contentfloss_usage_count`, `contentfloss_last_used_date`

---

## How It Works

1. **Input** — Paste long-form text or a YouTube URL.
2. **Detect** — YouTube links are resolved to transcripts automatically.
3. **Generate** — Content is sent to Groq and transformed into platform-specific posts.
4. **Output** — Results appear in card layout with one-click copy.

### API Endpoints

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/api/transcript` | POST | `{ "url": "..." }` | Fetch YouTube transcript |
| `/api/generate` | POST | `{ "text": "...", "platform": "all" }` | Generate repurposed content |
| `/generate` | POST | `{ "text": "...", "platform": "all" }` | Alias for `/api/generate` |

Platform values: `all`, `instagram`, `linkedin`, `twitter`

---

## Build Android APK

The Android app wraps the web UI in a native WebView. API calls go to your Node.js backend, so the server must be running (locally or deployed).

### 1. Install Android build tools

- Install [JDK 17+](https://adoptium.net/)
- Install [Android Studio](https://developer.android.com/studio) or Android SDK command-line tools
- Set `ANDROID_HOME` environment variable

### 2. Create signing keystore

**Windows (PowerShell):**

```powershell
.\scripts\create-keystore.ps1
```

**macOS / Linux:**

```bash
chmod +x scripts/create-keystore.sh
./scripts/create-keystore.sh
```

### 3. Copy web assets and build

```bash
npm run build:apk
```

Or step by step:

```bash
npm run copy-www
cd android
gradlew.bat assembleRelease      # Windows
./gradlew assembleRelease        # macOS/Linux
cd ..
node scripts/copy-apk.js
```

The signed release APK will be at:

```
ContentFloss-release.apk
```

### APK + Backend Configuration

The APK loads the web app from `file:///android_asset/www/index.html`. API calls need a reachable backend:

| Environment | API base URL |
|-------------|-------------|
| Android Emulator | `http://10.0.2.2:3000` (default) |
| Physical device | Your machine's LAN IP, e.g. `http://192.168.1.10:3000` |
| Production | Deploy `server.js` and set URL in `android/app/src/main/res/values/strings.xml` |

Edit `api_base_url` in `strings.xml`:

```xml
<string name="api_base_url">https://your-deployed-server.com</string>
```

Then rebuild the APK.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API key |
| `PORT` | No | Server port (default: 3000) |

---

## Design

| Token | Value |
|-------|-------|
| Primary | `#0A3D62` |
| Accent | `#00C2A8` |
| Background | `#F8F9FB` |

Package name: `com.contentfloss.app`

---

## License

MIT
