import { ipcMain, app } from 'electron';
import Database from 'better-sqlite3';
import { getDashboardMetrics } from '../database/repositories/dashboardRepo';
import { getDatabasePath } from '../database/db';

export function registerIpcHandlers(db: Database.Database) {
  // Health ping
  ipcMain.handle('app:ping', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // App & System info
  ipcMain.handle('app:getInfo', async () => {
    return {
      version: app.getVersion(),
      name: app.getName(),
      databasePath: getDatabasePath(),
      isPackaged: app.isPackaged,
      platform: process.platform,
    };
  });

  // Business Info & Settings
  ipcMain.handle('business:getInfo', async () => {
    const biz = db.prepare(`
      SELECT b.*, s.invoice_prefix, s.invoice_counter, s.default_gst_rate, s.default_payment_method, s.paper_size, s.invoice_footer, s.terms_and_conditions
      FROM businesses b
      LEFT JOIN business_settings s ON b.id = s.business_id
      LIMIT 1
    `).get();
    return biz;
  });

  // Dashboard Metrics
  ipcMain.handle('dashboard:getMetrics', async () => {
    try {
      return getDashboardMetrics(db);
    } catch (err: any) {
      console.error('[IPC] Error in dashboard:getMetrics:', err);
      throw err;
    }
  });

  // Products preview (quick list for verification)
  ipcMain.handle('products:list', async () => {
    return db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC').all();
  });

  // Customers preview
  ipcMain.handle('customers:list', async () => {
    return db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
  });
}
