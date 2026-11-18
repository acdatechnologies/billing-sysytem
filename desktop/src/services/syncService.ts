import Database from 'better-sqlite3';

export interface SyncStatus {
  isConnected: boolean;
  cloudEmail: string | null;
  serverUrl: string;
  pendingCount: number;
  lastSyncTime: string | null;
}

function getAppSetting(db: Database.Database, key: string): string | null {
  const row = db.prepare('SELECT value FROM application_settings WHERE key = ?').get(key) as any;
  return row ? row.value : null;
}

function setAppSetting(db: Database.Database, key: string, value: string) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO application_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, value, now);
}

export function getSyncStatus(db: Database.Database): SyncStatus {
  const token = getAppSetting(db, 'cloud_token');
  const email = getAppSetting(db, 'cloud_email');
  const serverUrl = getAppSetting(db, 'cloud_url') || 'http://localhost:5000';
  const lastSyncTime = getAppSetting(db, 'last_sync_time');

  const pendingRow = db.prepare(`
    SELECT COUNT(id) as pendingCount
    FROM sync_queue
    WHERE status = 'PENDING'
  `).get() as any;

  return {
    isConnected: Boolean(token),
    cloudEmail: email,
    serverUrl,
    pendingCount: pendingRow ? pendingRow.pendingCount : 0,
    lastSyncTime,
  };
}

export async function loginCloud(
  db: Database.Database,
  serverUrl: string,
  email: string,
  password: string
) {
  const cleanUrl = serverUrl.replace(/\/+$/, '');
  const response = await fetch(`${cleanUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = (await response.json()) as any;
  if (!response.ok) {
    throw new Error(data.error || 'Cloud authentication failed.');
  }

  setAppSetting(db, 'cloud_token', data.token);
  setAppSetting(db, 'cloud_email', data.business.email);
  setAppSetting(db, 'cloud_url', cleanUrl);

  return {
    success: true,
    business: data.business,
    token: data.token,
  };
}

export async function triggerSync(db: Database.Database) {
  const token = getAppSetting(db, 'cloud_token');
  const serverUrl = getAppSetting(db, 'cloud_url') || 'http://localhost:5000';
  const lastSyncTime = getAppSetting(db, 'last_sync_time');

  if (!token) {
    throw new Error('Not connected to cloud account. Please sign in first.');
  }

  // 1. Fetch pending mutations from sync_queue
  const pendingItems = db.prepare(`
    SELECT id as queueId, entity_type as entityType, entity_id as entityId, action, payload
    FROM sync_queue
    WHERE status = 'PENDING'
    ORDER BY created_at ASC
    LIMIT 100
  `).all() as any[];

  let pushedCount = 0;

  if (pendingItems.length > 0) {
    const pushRes = await fetch(`${serverUrl}/api/v1/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ batch: pendingItems }),
    });

    const pushData = (await pushRes.json()) as any;
    if (!pushRes.ok) {
      throw new Error(pushData.error || 'Failed to push mutations to cloud.');
    }

    if (pushData.syncedQueueIds && pushData.syncedQueueIds.length > 0) {
      const now = new Date().toISOString();
      const markStmt = db.prepare(`
        UPDATE sync_queue
        SET status = 'SYNCED', synced_at = ?
        WHERE id = ?
      `);

      for (const qId of pushData.syncedQueueIds) {
        markStmt.run(now, qId);
        pushedCount++;
      }
    }
  }

  // 2. Pull remote updates
  const pullUrl = lastSyncTime
    ? `${serverUrl}/api/v1/sync/pull?since=${encodeURIComponent(lastSyncTime)}`
    : `${serverUrl}/api/v1/sync/pull`;

  const pullRes = await fetch(pullUrl, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  let pulledCount = 0;
  if (pullRes.ok) {
    const pullData = (await pullRes.json()) as any;
    pulledCount =
      (pullData.products?.length || 0) +
      (pullData.customers?.length || 0) +
      (pullData.invoices?.length || 0);
  }

  const nowSync = new Date().toISOString();
  setAppSetting(db, 'last_sync_time', nowSync);

  return {
    success: true,
    pushedCount,
    pulledCount,
    timestamp: nowSync,
  };
}

export async function requestCloudBackup(db: Database.Database) {
  const token = getAppSetting(db, 'cloud_token');
  const serverUrl = getAppSetting(db, 'cloud_url') || 'http://localhost:5000';

  if (!token) {
    throw new Error('Please sign in to cloud before requesting backup.');
  }

  const res = await fetch(`${serverUrl}/api/v1/sync/backup`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate cloud backup.');
  }

  return data;
}
