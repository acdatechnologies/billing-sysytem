import { getElectronAPI } from './apiClient';
import { BusinessInfo, PrinterDevice } from '../types';

export interface PrinterSettingsInput {
  paperSize: string;
  defaultPrinter?: string;
}

export interface PrintInvoiceOptions {
  invoiceId?: string;
  htmlContent: string;
  paperSize?: string;
  printerName?: string;
  silent?: boolean;
}

export interface ExportPDFInput {
  htmlContent: string;
  defaultFilename?: string;
  paperSize?: string;
}

export const settingsApi = {
  // Get system & app information
  async getAppInfo(): Promise<any> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.getAppInfo();
    }
    return {
      appName: 'VND Tech Billing Software',
      version: '1.0.0',
      environment: 'Web Browser Mode',
    };
  },

  // Get business details
  async getBusinessInfo(): Promise<BusinessInfo | null> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.getBusinessInfo();
    }
    return null;
  },

  // Save printer hardware and paper size configuration
  async savePrinterSettings(input: PrinterSettingsInput): Promise<boolean> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.savePrinterSettings(input);
    }
    return true;
  },

  // List hardware printers connected to this machine
  async getInstalledPrinters(): Promise<PrinterDevice[]> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.getInstalledPrinters();
    }
    return [];
  },

  // Trigger high-speed physical invoice printing
  async printInvoice(options: PrintInvoiceOptions): Promise<{ success: boolean; message?: string }> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.printInvoice(options);
    }
    window.print();
    return { success: true };
  },

  // Export invoice directly to vector PDF file
  async exportPDF(input: ExportPDFInput): Promise<{ success: boolean; filePath?: string }> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.exportPDF(input);
    }
    window.print();
    return { success: true };
  },
};
