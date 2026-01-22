# 🚀 CodeSync — Real-Time Collaborative Code Editor

CodeSync is a **modern, real-time collaborative code editor** that lets users **create or join coding rooms instantly — no login required**.  
Users can start coding immediately, collaborate live, and later log in to unlock advanced features like **GitHub integration, permanent storage, and team management**.

---

## ✨ Features

### 🧑‍💻 Instant Coding (No Login Required)
- Create or join a temporary room instantly
- Rooms are valid for **24 hours**
- Run and save code during the session
- No signup friction

### 🔐 Login to Unlock More
- Permanent rooms
- GitHub push & pull
- Invite collaborators
- Room ownership & permissions
- Cross-device access

### 🤝 Real-Time Collaboration
- Live multi-user editing
- Online users indicator
- Role-based actions (Owner / Editor / Viewer)
- Member management (kick, transfer ownership)

### 📁 File Management
- Create, rename, delete files
- Folder & file tree explorer
- Support for multiple languages:
  - Python, C, C++, Java, JavaScript
  - Custom extensions

### ▶️ Code Execution
- Run code directly from the editor
- Integrated terminal panel
- VS Code–like line & column indicator

### 🧩 GitHub Integration
- Import repositories
- Push code to GitHub
- OAuth via GitHub (login required)

### 🎨 Modern UI / UX
- Dark blue glassmorphism theme
- Smooth animations (Framer Motion)
- Fully responsive (desktop + mobile)
- Drawer-based UI for mobile devices

---

## 🧠 How It Works

1. Open CodeSync
2. Create or join a room (guest allowed)
3. Start coding instantly
4. Login anytime to save permanently & unlock features

---

## 🖥️ Tech Stack

### Frontend
- **React (Vite)**
- **Tailwind CSS**
- **Framer Motion**
- **Monaco Editor**
- **Lucide Icons**

### Backend *(Planned / In Progress)*
- WebSockets (real-time sync)
- Authentication (Email, Google, GitHub)
- File & room management APIs

---

## 📂 Project Structure

```txt
src/
├── components/
├── pages/
├── layouts/
├── context/
├── hooks/
├── services/
├── utils/
├── styles/
├── App.jsx
└── main.jsx
```

### 📊 Room Comparison

| Feature | Temporary Room | Permanent Room | Solo Room |
|------|----------------|----------------|-----------|
| Login Required | ❌ No | ✅ Yes | ❌ Optional |
| Expiry | 24 Hours | Unlimited | Session-based |
| Real-time Collaboration | ✅ Yes | ✅ Yes | ❌ No |
| Save Code | ✅ Temporary | ✅ Permanent | ✅ Local |
| Run Code | ✅ Yes | ✅ Yes | ✅ Yes |
| GitHub Integration | ❌ No | ✅ Yes | ❌ No |
| Invite Users | ❌ No | ✅ Yes | ❌ No |
| Ownership & Roles | ❌ No | ✅ Yes | ❌ No |

---
## 📱 Responsive Design

CodeSync is built with a **mobile-first approach** to ensure a smooth experience across all devices.

- **Desktop**
  - Full multi-panel editor layout
  - Persistent file explorer
  - Inline terminal and users panel

- **Tablet**
  - Adaptive panel widths
  - Collapsible sidebars
  - Touch-friendly controls

- **Mobile**
  - Drawer-based file explorer
  - Bottom-sheet terminal
  - Icon-only action buttons
  - Optimized editor focus

---

## 🛠 Local Development

Follow these steps to run CodeSync locally:

```bash
# Clone the repository
git clone https://github.com/your-username/codesync.git

# Navigate to the project directory
cd codesync

# Install dependencies
npm install

# Start the development server
npm run dev

```
### ⚙ Environment Variables

Create a .env file in the root directory:
```bash
VITE_APP_NAME=CodeSync
VITE_API_BASE_URL=http://localhost:4000
```
---
### 🔐 Authentication (by Supabase)

Email & password login
OAuth:
- Google
- GitHub
Session-based authentication
JWT for secure API access 
---
### 🤝 Contributing
We welcome contributions!
- Fork the repository
- Create a feature branch
- Commit your changes
- Open a Pull Request
Please follow clean code practices and consistent styling.
---
### 📜 License
This project is licensed under the MIT License.
