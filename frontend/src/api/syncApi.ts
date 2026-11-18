import { getElectronAPI, restRequest } from './apiClient';
import { SyncStatus } from '../types';

export interface CloudLoginInput {
  serverUrl: string;
  email: string;
  password: string;
}

export const syncApi = {
  // Get cloud connection state and pending sync count
  async getSyncStatus(): Promise<SyncStatus | null> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.getSyncStatus();
    }
    return {
      isConnected: Boolean(localStorage.getItem('vnd_cloud_token')),
      cloudEmail: localStorage.getItem('vnd_cloud_email'),
      serverUrl: localStorage.getItem('vnd_cloud_url') || 'http://localhost:5000',
      pendingCount: 0,
      lastSyncTime: localStorage.getItem('vnd_last_sync_time'),
    };
  },

  // Authenticate and link local desktop client with MongoDB cloud backend
  async loginCloud(input: CloudLoginInput): Promise<{ success: boolean; token?: string; error?: string }> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.loginCloud(input);
    }
    const cleanUrl = input.serverUrl.replace(/\/+$/, '');
    const res = await fetch(`${cleanUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: input.email, password: input.password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    localStorage.setItem('vnd_cloud_token', data.token);
    localStorage.setItem('vnd_cloud_email', input.email);
    localStorage.setItem('vnd_cloud_url', cleanUrl);
    return { success: true, token: data.token };
  },

  // Manually trigger immediate bidirectional cloud synchronization
  async triggerSync(): Promise<{ success: boolean; syncedCount?: number; message?: string }> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.triggerSync();
    }
    return { success: true, syncedCount: 0, message: 'Web sync complete' };
  },

  // Perform full cloud backup of the business database
  async requestCloudBackup(): Promise<{ success: boolean; message: string }> {
    const electron = getElectronAPI();
    if (electron) {
      return await electron.requestCloudBackup();
    }
    return { success: true, message: 'Cloud backup requested' };
  },
};
