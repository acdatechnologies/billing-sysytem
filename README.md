# 🧾 VND Tech Billing Software - 3-Tier Enterprise Architecture

This project is structured into **3 independent, cleanly decoupled layers**:
1. **`frontend/`** — Pure React Web UI
2. **`backend/`** — Cloud REST API & Database Server
3. **`desktop/`** — Native Electron Shell, Local SQLite Database & Hardware Printer Drivers

---

 

## 🚀 How to Run Each Layer

### 1. From the Root Directory (Convenient Scripts)
Run any service directly from the project root:

```bash
# Start the React Web UI in dev mode (http://localhost:5173)
npm run dev:frontend

# Start the Cloud REST API in dev mode (http://localhost:5000)
npm run dev:backend

# Launch the Electron Desktop application
npm run dev:desktop

# Build the Frontend for production
npm run build:frontend

# Build the Desktop shell for production
npm run build:desktop

# Package the Windows NSIS Installer (.exe)
npm run build:win
```

---

### 📦 Windows Installer (`VNDTechBillingSetup.exe`)
To generate the production Windows installer for retail shop owners:
```bash
npm run build:win
```
The installer executable is generated at:
`desktop/release/VNDTechBillingSetup.exe` (~82 MB)

**Installer Features:**
- Custom branded installer icon (`build/icon.ico`)
- Desktop & Start Menu shortcut creation
- Custom install directory selector
- Non-destructive updates (preserves local SQLite database in `%APPDATA%`)

---

### 2. Running Individual Folders Directly

#### A. Frontend (`frontend/`)
```bash
cd frontend
npm run dev      # Starts Vite dev server at http://localhost:5173
npm run build    # Compiles production web bundle to dist/
```

#### B. Backend (`backend/`)
```bash
cd backend
npm run dev      # Starts Express API at http://localhost:5000 with auto-reload
npm start        # Starts production server
```

#### C. Desktop Shell (`desktop/`)
```bash
cd desktop
npm run dev      # Bundles main/preload and launches Electron window
npm run build    # Bundles desktop scripts to dist/
```

---

 
