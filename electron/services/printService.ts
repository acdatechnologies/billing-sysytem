import { BrowserWindow, dialog, app } from 'electron';
import path from 'path';
import fs from 'fs';

export interface PrintOptions {
  printerName?: string;
  silent?: boolean;
  paperFormat: '58mm' | '80mm' | 'A4' | 'A5';
  htmlContent: string;
}

export async function getInstalledPrinters(window: BrowserWindow) {
  try {
    const printers = await window.webContents.getPrintersAsync();
    return printers.map((p) => ({
      name: p.name,
      displayName: p.displayName || p.name,
      description: p.description,
      isDefault: p.isDefault,
      status: p.status,
    }));
  } catch (err) {
    console.error('[PrintService] Failed to list printers:', err);
    return [];
  }
}

export async function printHtml(options: PrintOptions): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve, reject) => {
    // Create an invisible background BrowserWindow for clean, deterministic rendering
    const printWindow = new BrowserWindow({
      show: false,
      width: options.paperFormat === '58mm' ? 220 : options.paperFormat === '80mm' ? 310 : 800,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page {
              margin: ${options.paperFormat.endsWith('mm') ? '2mm' : '10mm'};
              size: ${
                options.paperFormat === '58mm'
                  ? '58mm auto'
                  : options.paperFormat === '80mm'
                  ? '80mm auto'
                  : options.paperFormat === 'A5'
                  ? 'A5'
                  : 'A4'
              };
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              margin: 0;
              padding: ${options.paperFormat.endsWith('mm') ? '4px' : '16px'};
              color: #111827;
              background: #fff;
              font-size: ${options.paperFormat === '58mm' ? '10px' : options.paperFormat === '80mm' ? '11px' : '12px'};
            }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>
          ${options.htmlContent}
        </body>
      </html>
    `;

    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`);

    printWindow.webContents.on('did-finish-load', () => {
      // Determine pageSize configuration
      let pageSize: any = 'A4';
      if (options.paperFormat === 'A5') pageSize = 'A5';
      else if (options.paperFormat === '58mm') pageSize = { width: 58000, height: 200000 };
      else if (options.paperFormat === '80mm') pageSize = { width: 80000, height: 297000 };

      printWindow.webContents.print(
        {
          silent: options.silent ?? false,
          printBackground: true,
          deviceName: options.printerName || '',
          pageSize,
          margins: {
            marginType: options.paperFormat.endsWith('mm') ? 'none' : 'default',
          },
        },
        (success, failureReason) => {
          printWindow.destroy();
          if (success) {
            resolve({ success: true, message: 'Print job dispatched successfully.' });
          } else {
            resolve({ success: false, message: `Printing failed: ${failureReason}` });
          }
        }
      );
    });

    printWindow.webContents.on('did-fail-load', () => {
      printWindow.destroy();
      reject(new Error('Failed to load invoice layout into print engine.'));
    });
  });
}

export async function exportToPdfFile(
  parentWindow: BrowserWindow,
  htmlContent: string,
  paperFormat: '58mm' | '80mm' | 'A4' | 'A5',
  defaultFileName = 'VND_Invoice.pdf'
): Promise<{ success: boolean; filePath?: string; message: string }> {
  const saveResult = await dialog.showSaveDialog(parentWindow, {
    title: 'Save Invoice as PDF',
    defaultPath: path.join(app.getPath('documents'), defaultFileName),
    filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
  });

  if (saveResult.canceled || !saveResult.filePath) {
    return { success: false, message: 'Save cancelled by user.' };
  }

  const pdfWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 1000,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page {
            margin: ${paperFormat.endsWith('mm') ? '4mm' : '10mm'};
            size: ${
              paperFormat === '58mm'
                ? '58mm auto'
                : paperFormat === '80mm'
                ? '80mm auto'
                : paperFormat === 'A5'
                ? 'A5'
                : 'A4'
            };
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            margin: 0;
            padding: ${paperFormat.endsWith('mm') ? '4px' : '20px'};
            color: #111827;
            background: #fff;
            font-size: ${paperFormat === '58mm' ? '10px' : paperFormat === '80mm' ? '11px' : '12px'};
          }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  return new Promise((resolve, reject) => {
    pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`);

    pdfWindow.webContents.on('did-finish-load', async () => {
      try {
        let pageSize: any = 'A4';
        if (paperFormat === 'A5') pageSize = 'A5';
        else if (paperFormat === '58mm') pageSize = { width: 58000, height: 200000 };
        else if (paperFormat === '80mm') pageSize = { width: 80000, height: 297000 };

        const pdfData = await pdfWindow.webContents.printToPDF({
          printBackground: true,
          pageSize,
          margins: {
            marginType: paperFormat.endsWith('mm') ? 'none' : 'default',
          },
        });

        fs.writeFileSync(saveResult.filePath!, pdfData);
        pdfWindow.destroy();

        resolve({
          success: true,
          filePath: saveResult.filePath,
          message: 'PDF exported successfully.',
        });
      } catch (err: any) {
        pdfWindow.destroy();
        resolve({ success: false, message: err.message || 'Failed to generate PDF' });
      }
    });

    pdfWindow.webContents.on('did-fail-load', () => {
      pdfWindow.destroy();
      reject(new Error('Failed to load invoice layout into PDF engine.'));
    });
  });
}
