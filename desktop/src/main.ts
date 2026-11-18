import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database/db';
import { registerIpcHandlers } from './ipc/handlers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'VND Tech - Billing & Inventory Management Software',
    icon: path.join(__dirname, '../build/icon.png'),
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false, // Don't show until ready-to-show to prevent flicker
  });

  // Smooth window display
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Remove default menu for clean, modern desktop app feel
  mainWindow.setMenuBarVisibility(false);

  // Load URL (dev server) or local build
  const devUrl = process.env.VITE_DEV_SERVER_URL || process.env.ELECTRON_START_URL || 'http://localhost:5173';
  const prodFilePath = app.isPackaged
    ? path.join(app.getAppPath(), 'frontend/dist/index.html')
    : path.join(__dirname, '../../frontend/dist/index.html');

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL(devUrl).catch(() => {
      // Fallback to local build if dev server isn't running
      mainWindow?.loadFile(prodFilePath).catch(console.error);
    });
  } else {
    mainWindow.loadFile(prodFilePath).catch(console.error);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Initialize Database
  try {
    const db = initDatabase();
    registerIpcHandlers(db);
  } catch (error) {
    console.error('[Main] Failed to initialize database:', error);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
