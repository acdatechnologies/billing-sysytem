import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  ping: () => ipcRenderer.invoke('app:ping'),
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  getBusinessInfo: () => ipcRenderer.invoke('business:getInfo'),
  getDashboardMetrics: () => ipcRenderer.invoke('dashboard:getMetrics'),
  getProducts: () => ipcRenderer.invoke('products:list'),
  getCustomers: () => ipcRenderer.invoke('customers:list'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
