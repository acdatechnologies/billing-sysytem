import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './database/db';
import { registerIpcHandlers } from './ipc/handlers';

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

  // Determine production/distribution HTML path
  let prodFilePath = '';
  if (app.isPackaged) {
    prodFilePath = path.join(app.getAppPath(), 'frontend/dist/index.html');
  } else {
    const localDist = path.resolve(__dirname, '../frontend/dist/index.html');
    const rootDist = path.resolve(__dirname, '../../frontend/dist/index.html');
    prodFilePath = fs.existsSync(localDist) ? localDist : rootDist;
  }

  // Load dev server if explicitly provided in environment, otherwise load bundled frontend
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (!app.isPackaged && devUrl) {
    mainWindow.loadURL(devUrl).catch(() => {
      mainWindow?.loadFile(prodFilePath).catch((err) => {
        console.error('[Main] Failed to load local fallback:', err);
      });
    });
  } else {
    mainWindow.loadFile(prodFilePath).catch((err) => {
      console.error('[Main] Failed to load file:', prodFilePath, err);
    });
  }

  // Log any load failures
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Renderer] Failed to load: ${errorCode} - ${errorDescription} (${validatedURL})`);
  });

  // Enable F12 DevTools toggle for inspection
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow?.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

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

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
