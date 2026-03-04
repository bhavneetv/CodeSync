# Code Sync

Code Sync is a **real-time collaborative coding platform** that allows multiple users to write, run, and manage code together in shared rooms. 

It includes:
- 🌐 **Web App** (React + Vite)
- ⚙️ **Runtime Server** for interactive code execution & HTML preview
- 📱 **Flutter App** for Android, iOS, and Windows

Live collaboration, file sync, execution, and GitHub integration — all in one place.

🔗 **Live Website:** https://codesyncioo.netlify.app/

---

## Features

### Room and access model
- Create & join rooms via link or code
- Room types:
  - `temporary` – anonymous sessions
  - `permanent` – authenticated users
  - `solo` – personal coding rooms
- Password-protected rooms
- Join tokens for access validation
- Owner / editor / guest roles
- Kick & rejoin protection

### Authentication
- Supabase authentication
- Email & password login
- OAuth (Google, GitHub)
- Flutter WebView OAuth with deep-link return to app

### Real-time collaboration
- Live user presence
- Cursor & selection sharing
- Real-time file sync
- Editor chat panel
- Conflict-safe fast typing sync
- Late-joiner file recovery using request/response sync

### Editor and file system
- Monaco Editor
- File tree with folders
- Create / rename / delete files
- Dirty tab tracking
- Encrypted file storage in Supabase
- Real-time file updates across users

### Run and preview
- Cloud execution fallback using Piston API
- Local runtime execution using WebSocket server
- Interactive stdin support
- HTML project preview endpoint
- Automatic fallback between local & cloud execution

### GitHub integration
- GitHub OAuth login
- Import repository into a room
- Push room changes back to GitHub

### Save & export
- Web: Download full project as ZIP
- Flutter: Save project to local device folder

---

## Tech Stack

- **Frontend:** React 19, Vite, Framer Motion, Monaco Editor
- **Backend:** Supabase (Auth, PostgreSQL, Realtime, Storage)
- **Runtime Server:** Node.js + WebSocket (`ws`)
- **App Wrapper:** Flutter + InAppWebView + App Links

---

## Repository Layout

```txt
.
├─ src/                       # Web app
│  ├─ pages/                  # Landing, room-create, editor, upload, etc.
│  ├─ function/               # Auth, rooms, files, editor helpers
│  ├─ Components/             # Shared UI components
│  └─ utils/route.jsx         # Client routes
├─ runtime-server/
│  ├─ server/index.js         # Local runtime + preview server
│  └─ Dockerfile              # Runtime container
├─ codesync/                  # Flutter wrapper app
│  ├─ lib/main.dart
│  └─ .github/workflows/      # App release workflows
└─ README.md

```
## Server

Code Sync uses a **separate runtime execution server** to run code interactively and provide HTML previews.  
This server communicates with the web editor via **WebSocket** and HTTP.

### Server Repository
- **GitHub:** https://github.com/bhavneetv/code-sync-server

You can self-host this server or deploy it to any Node.js–compatible platform.

---

## What the Server Does

- Executes user code securely in isolated processes
- Supports interactive stdin / stdout
- Provides WebSocket-based execution API
- Serves HTML project previews
- Acts as the primary runtime before cloud fallback

---

## Supported Languages

- Python  
- Node.js  
- Java  
- C  
- C++  
- Ruby  
- Prolog  

---

## Run Server Locally

### 1) Clone the server repository
```bash
git clone https://github.com/bhavneetv/code-sync-server.git
cd code-sync-server

npm install

npm start

http://localhost:3001

VITE_RUNTIME_WS_URL=ws://localhost:3001
```

## Cloud Fallback Execution

Code Sync includes an automatic **cloud execution fallback** to ensure code can still be run even when the local runtime server is unavailable.

### When Cloud Fallback Is Used
- Runtime server is offline or unreachable
- WebSocket connection fails
- Server execution times out
- Unsupported execution mode on client device

When this happens, the editor seamlessly switches to cloud execution without interrupting the user workflow.

---

## Cloud Execution Provider

- Powered by the **Piston API**
- Secure, sandboxed execution environment
- Stateless execution (no persistent filesystem)
- Best suited for quick runs and single-file execution

---

## Cloud Fallback Behavior

- Automatically retries execution using cloud runner
- Multi-file projects fall back to active file execution if needed
- Standard input is supported (limited by provider constraints)
- Execution output is streamed back to the editor

---

## Limitations of Cloud Fallback

- No persistent storage between runs
- Limited execution time and memory
- Multi-file and project-based execution is restricted
- Not suitable for long-running or server-based programs

For full project execution, the **local runtime server** is recommended.

---

## Flutter App Support

Code Sync is also available as a **Flutter-based wrapper app** for mobile and desktop platforms.

### Flutter Repository
- **GitHub:** https://github.com/bhavneetv/code-sync-flutter

### Available Platforms
- Android
- iOS
- Windows

### App Capabilities
- Full access to the Code Sync web editor
- OAuth login inside in-app WebView
- Deep-link handling for OAuth return
- Local file export to device storage
- Folder picker support (platform dependent)

---

## Download App Builds

Pre-built APKs and desktop builds are available via **GitHub Releases**:

- https://github.com/bhavneetv/code-sync-flutter/releases

These builds are generated automatically using GitHub Actions.

---

## Run Flutter App Locally

From the `code-sync-flutter` repository:

```bash
flutter pub get
flutter run --dart-define=APP_URL=https://codesyncioo.netlify.app/
flutter build apk --release --dart-define=APP_URL=https://codesyncioo.netlify.app/
flutter build ios --release --no-codesign --dart-define=APP_URL=https://codesyncioo.netlify.app/
flutter build windows --release --dart-define=APP_URL=https://codesyncioo.netlify.app/
```

---

## Developed By

**Bhavneet Verma**  
- GitHub: https://github.com/bhavneetv  
- LinkedIn: https://www.linkedin.com/in/bhavneet-verma/

---

## License

This project is licensed under the **MIT License**.

You are free to:
- Use the project for personal or commercial purposes
- Modify and distribute the code
- Include it in your own projects

See the `LICENSE` file in this repository for full license text.

---


  
