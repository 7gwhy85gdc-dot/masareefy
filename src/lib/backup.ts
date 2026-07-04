/** نسخة مرآة في IndexedDB لحماية البيانات لو مسح المتصفح localStorage */
import type { AppState } from '../types';

const DB = 'masareefy-db';
const STORE = 'state';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSaveState(state: AppState): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(state, 'app');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* غير حرج */
  }
}

export async function idbLoadState(): Promise<AppState | null> {
  try {
    const db = await openDb();
    const state = await new Promise<AppState | null>((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get('app');
      req.onsuccess = () => resolve((req.result as AppState) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return state;
  } catch {
    return null;
  }
}

/** هل مضى أكثر من 30 يومًا على آخر نسخة احتياطية؟ */
export function backupOverdue(lastBackup?: string): boolean {
  if (!lastBackup) return true;
  return Date.now() - new Date(lastBackup).getTime() > 30 * 86_400_000;
}
