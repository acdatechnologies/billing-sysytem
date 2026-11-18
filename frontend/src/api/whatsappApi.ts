import { getElectronAPI } from './apiClient';
import { WhatsAppLog } from '../types';

export interface WhatsAppSendInput {
  mobile: string;
  message: string;
  customerId?: string;
  invoiceId?: string;
}

export const whatsappApi = {
  // Launch WhatsApp Web or Desktop application with formatted bill message
  async openWhatsApp(input: WhatsAppSendInput): Promise<boolean> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.openWhatsApp(input);
    }
    const cleanNumber = input.mobile.replace(/\D/g, '');
    const encoded = encodeURIComponent(input.message);
    window.open(`https://wa.me/91${cleanNumber}?text=${encoded}`, '_blank');
    return true;
  },

  // Get WhatsApp message audit history
  async getWhatsAppLogs(limit?: number): Promise<WhatsAppLog[]> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.getWhatsAppLogs(limit);
    }
    return [];
  },
};
