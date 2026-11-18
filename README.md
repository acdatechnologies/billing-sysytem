# 🧾 VND Tech Billing Software - 3-Tier Enterprise Architecture

This project is structured into **3 independent, cleanly decoupled layers**:
1. **`frontend/`** — Pure React Web UI
2. **`backend/`** — Cloud REST API & Database Server
3. **`desktop/`** — Native Electron Shell, Local SQLite Database & Hardware Printer Drivers

---

## 📁 Project Directory Structure

```
billing system/
├── 📂 frontend/                      # Pure React Web UI
│   ├── 📂 src/
│   │   ├── 📂 api/                   # Modular API Services
│   │   │   ├── apiClient.ts          # Universal API client (Electron IPC + Web REST)
│   │   │   ├── productApi.ts         # Products & categories
│   │   │   ├── customerApi.ts        # Customer ledger & management
│   │   │   ├── invoiceApi.ts         # Invoices, billing, and cancellations
│   │   │   ├── inventoryApi.ts       # Stock adjustments & movements
│   │   │   ├── dashboardApi.ts       # Key metrics & analytics
│   │   │   ├── settingsApi.ts        # Printers, business info & PDF export
│   │   │   ├── whatsappApi.ts        # WhatsApp automation
│   │   │   ├── syncApi.ts            # Cloud sync & backup operations
│   │   │   └── index.ts              # Central API export
│   │   ├── 📂 components/            # Reusable UI components & modals
│   │   ├── 📂 pages/                 # Full application pages
│   │   ├── 📂 types/                 # TypeScript interfaces
│   │   ├── 📂 utils/                 # Financial math & calculations
│   │   ├── App.tsx                   # Main React component
│   │   ├── main.tsx                  # React entry point
│   │   └── index.css                 # Tailwind CSS styles
│   ├── index.html                    # Web entry HTML
│   ├── vite.config.ts                # Pure Vite React configuration
│   ├── tsconfig.json                 # TypeScript configuration
│   └── package.json                  # Frontend dependencies
│
├── 📂 backend/                       # Cloud REST API Server (Node.js + Express + MongoDB)
│   ├── 📂 src/
│   │   ├── 📂 config/
│   │   │   └── db.js                 # MongoDB connection logic
│   │   ├── 📂 controllers/           # Modular business logic controllers
│   │   │   ├── authController.js     # User registration & JWT authentication
│   │   │   ├── productController.js  # Product & category CRUD
│   │   │   ├── customerController.js # Customer ledger & profile CRUD
│   │   │   ├── invoiceController.js  # Billing, stock auto-deductions & cancellations
│   │   │   ├── inventoryController.js# Stock adjustments & movement audits
│   │   │   ├── dashboardController.js# Realtime metrics & KPIs
│   │   │   └── syncController.js     # Offline-to-cloud sync engine
│   │   ├── 📂 middleware/
│   │   │   ├── auth.js               # JWT authentication middleware
│   │   │   └── errorHandler.js       # Centralized error handler
│   │   ├── 📂 models/                # Mongoose database models
│   │   │   ├── Business.js
│   │   │   ├── Product.js
│   │   │   ├── Category.js
│   │   │   ├── Customer.js
│   │   │   ├── Invoice.js
│   │   │   └── StockMovement.js
│   │   ├── 📂 routes/                # Modular REST API endpoints
│   │   │   ├── authRoutes.js         # /api/v1/auth
│   │   │   ├── productRoutes.js      # /api/v1/products
│   │   │   ├── customerRoutes.js     # /api/v1/customers
│   │   │   ├── invoiceRoutes.js      # /api/v1/invoices
│   │   │   ├── inventoryRoutes.js    # /api/v1/inventory
│   │   │   ├── dashboardRoutes.js    # /api/v1/dashboard
│   │   │   ├── syncRoutes.js         # /api/v1/sync
│   │   │   └── index.js              # Central API router
│   │   └── index.js                  # Express server entry point
│   ├── .env.example                  # Environment template
│   └── package.json                  # Backend dependencies
│
├── 📂 desktop/                       # Native Electron Desktop Shell
│   ├── 📂 src/
│   │   ├── 📂 database/              # Local SQLite repositories & schema migrations
│   │   │   ├── repositories/
│   │   │   └── db.ts
│   │   ├── 📂 ipc/                   # Desktop IPC communication handlers
│   │   │   └── handlers.ts
│   │   ├── 📂 services/              # Native print & cloud background sync workers
│   │   │   ├── printService.ts
│   │   │   └── syncService.ts
│   │   ├── main.ts                   # Electron main process & window lifecycle
│   │   └── preload.ts                # Context bridge exposing electronAPI
│   ├── vite.config.ts                # Desktop SSR bundler configuration
│   ├── tsconfig.json                 # Desktop TypeScript configuration
│   └── package.json                  # Desktop dependencies
│
├── package.json                      # Monorepo scripts (run everything from root)
└── .gitignore                        # Git ignore rules
```

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

## 🌐 API Overview

| Service | Route | Method | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/v1/auth/register` | `POST` | Register a new business account |
| **Auth** | `/api/v1/auth/login` | `POST` | Authenticate and retrieve JWT token |
| **Auth** | `/api/v1/auth/me` | `GET` | Get current business profile |
| **Products** | `/api/v1/products` | `GET / POST` | List products with filters or create product |
| **Products** | `/api/v1/products/:id` | `GET / PUT / DELETE`| Product details, update, or remove |
| **Products** | `/api/v1/products/categories` | `GET / POST` | Product categories |
| **Customers** | `/api/v1/customers` | `GET / POST` | Customer directory & create customer |
| **Customers** | `/api/v1/customers/:id` | `GET / PUT / DELETE`| Customer details, update, or remove |
| **Invoices** | `/api/v1/invoices/next-number` | `GET` | Get auto-incremented invoice number |
| **Invoices** | `/api/v1/invoices` | `GET / POST` | List invoices or create new invoice |
| **Invoices** | `/api/v1/invoices/:id/cancel` | `POST` | Cancel invoice and restock inventory |
| **Inventory** | `/api/v1/inventory/summary` | `GET` | Stock valuation, total units, low stock count |
| **Inventory** | `/api/v1/inventory/movements` | `GET` | Audit trail of stock changes |
| **Inventory** | `/api/v1/inventory/adjust` | `POST` | Manual stock adjustment |
| **Dashboard** | `/api/v1/dashboard/metrics` | `GET` | Daily/monthly revenue, counts & KPIs |
| **Sync** | `/api/v1/sync/push` | `POST` | Push offline mutations to MongoDB |
| **Sync** | `/api/v1/sync/pull` | `GET` | Pull delta changes from cloud |
