# Code Sync

Code Sync is a real-time collaborative coding platform with:
- A web app (React + Vite)
- A runtime server for interactive execution and HTML preview
- A Flutter wrapper app for Android, iOS, and Windows

It supports instant room-based collaboration, live code sync, file management, code execution, and GitHub integration.

## Features

### Room and access model
- Create and join rooms by link/code
- Room types:
  - `temporary` for anonymous sessions
  - `permanent` for logged-in users
  - `solo` for personal coding sessions
- Password-protected rooms
- Join tokens for room access validation
- Owner/editor/guest behavior
- Kicked-user protection

### Authentication
- Supabase auth integration
- Email/password login
- OAuth with Google and GitHub
- In-app OAuth support for Flutter WebView (deep-link return to app)

### Real-time collaboration
- Presence tracking (who is online)
- Live cursor and selection sharing
- Live content sync for shared files
- Multi-user chat in editor panel
- Conflict-safe content propagation improvements for fast multi-user typing
- Request/response file-content sync for late joiners and refresh recovery

### Editor and files
- Monaco Editor based code editing
- Open tabs, dirty state, and file tree explorer
- Create/rename/delete files and folders
- Encrypted file content at rest in Supabase Storage
- File sync in real-time across participants

### Run and preview
- Cloud execution fallback via Piston API (`emkc.org`)
- Local runtime execution via WebSocket runtime server (interactive stdin support)
- HTML project preview endpoint from runtime server
- Auto fallback between local runtime and cloud run modes in editor

### GitHub integration
- GitHub OAuth connection
- Import repository files into a room
- Push room changes back to GitHub

### Device save/export
- Web: download full project as ZIP
- Flutter app: pick local folder and sync files to device
- iOS app-documents fallback for local save path

### Maintenance
- Stale room cleanup support (temporary and inactive room handling)
- Room/file/member cleanup flow for deactivated rooms

## Tech stack

- Frontend: React 19, Vite, Framer Motion, Monaco Editor, Tailwind-style utility classes
- Backend services: Supabase (Auth, Postgres, Realtime, Storage)
- Runtime: Node.js + `ws` WebSocket server
- App wrapper: Flutter + InAppWebView + App Links

## Repository layout

```txt
.
|- src/                      # Web app
|  |- pages/                 # Landing, room-create, editor, upload, etc.
|  |- function/              # Auth, rooms, files, editor helpers
|  |- Components/            # Shared UI components
|  `- utils/route.jsx        # Client routes
|- runtime-server/
|  |- server/index.js        # Local runtime + preview websocket/http server
|  `- Dockerfile             # Runtime container build
|- codesync/                 # Flutter wrapper app
|  |- lib/main.dart
|  `- .github/workflows/     # Mobile/desktop release workflows
`- README.md
```

## Database objects used

Main tables queried by app logic:
- `rooms`
- `room_members`
- `files`
- `profiles`
- `folders` (best-effort cleanup path)

Main storage bucket:
- `user-files`

## Environment variables

Create a root `.env` file for the web app:

```env
VITE_Supabase_URL="https://<project>.supabase.co"
VITE_Supabase_Anon_Key="<anon-key>"
VITE_RUNTIME_WS_URL="wss://<your-runtime-host>"

# Optional overrides
VITE_AUTH_REDIRECT_ORIGIN="https://codesyncio.in"
VITE_APP_DEEP_LINK="codesync://auth-callback"
```

## Local development process

### 1) Install dependencies

```bash
npm install
```

### 2) Start runtime server (recommended for interactive run/preview)

In terminal A:

```bash
npm run server
```

This starts `runtime-server/server/index.js` on port `3001` by default.

### 3) Start web app

In terminal B:

```bash
npm run dev
```

### 4) Open app

Use the local URL printed by Vite.

## Runtime server process

### Run directly

```bash
cd runtime-server
npm install
npm start
```

### Run with Docker

```bash
cd runtime-server
docker build -t code-sync-runtime .
docker run --rm -p 3001:3001 code-sync-runtime
```

Runtime server supports:
- Python
- Node.js
- Java
- C
- C++
- Prolog
- Ruby

And provides:
- WebSocket command execution
- `/preview/<id>/...` static preview route for HTML projects

## Web build process

```bash
npm run build
npm run preview
```

Deploy the generated `dist/` as a static site.

## Flutter app process (Android/iOS/Windows wrapper)

From `codesync/`:

```bash
flutter pub get
flutter run --dart-define=APP_URL=https://codesyncio.in/
```

Release builds:

```bash
flutter build apk --release --dart-define=APP_URL=https://codesyncio.in/
flutter build ios --release --no-codesign --dart-define=APP_URL=https://codesyncio.in/
flutter build windows --release --dart-define=APP_URL=https://codesyncio.in/
```

## Release workflows process

Workflow files in `codesync/.github/workflows/`:
- `android-relese.yml` builds Android APK and publishes release asset
- `window.yml` builds Windows app and uploads zipped artifact
- `dart.yml` currently contains an iOS IPA release flow

Current Android/Windows workflows are tag-triggered for `v1.1` plus manual dispatch. Update tag patterns before broader release versioning.

## OAuth redirect setup process (Supabase)

Configure Supabase Auth `Site URL` and redirect URLs to include your domains and deep link.

Typical allowed redirects:
- `https://codesyncio.in/`
- `https://www.codesyncio.in/`
- `https://codesyncioo.netlify.app/`
- `https://www.codesyncioo.netlify.app/`
- `codesync://auth-callback`

## User flow process

1. Open landing page
2. Create room / join room / solo room
3. Collaborate in editor (live users, cursors, file updates)
4. Run code (local runtime or cloud fallback)
5. Save/export/share, optionally sync GitHub

## Notes and troubleshooting

- If local runtime is unreachable, editor falls back to cloud run mode for supported languages.
- If cloud run returns HTTP 400 for multi-file payloads, editor retries with active file.
- For app OAuth return issues, verify deep-link registration and Supabase redirect list.
- For refresh/open stale file issues, peer file-content request/response now resolves content by request ID.
