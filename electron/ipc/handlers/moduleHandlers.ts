import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { IPC_CHANNELS } from '../channels';
import { mediBridgeDb } from '../../db/database';
import { MODULES } from '@shared/modules';

export function registerModuleHandlers() {
  ipcMain.handle(IPC_CHANNELS.MODULES_GET_ENABLED, async () => {
    await mediBridgeDb.initialize();
    const db = mediBridgeDb.connection;
    const rows = db
      .prepare('SELECT module_key, enabled, metadata FROM enabled_modules WHERE enabled = 1')
      .all() as { module_key: string; enabled: number; metadata: string | null }[];
    const enabledSet = new Set(rows.map((row) => row.module_key));

    return MODULES.map((module) => ({
      ...module,
      enabled: enabledSet.has(module.key)
    }));
  });

  ipcMain.handle(
    IPC_CHANNELS.MODULES_UPDATE,
    async (_event: IpcMainInvokeEvent, payload: { modules: string[] }) => {
      try {
        await mediBridgeDb.initialize();
        const db = mediBridgeDb.connection;
        const { modules } = payload;

        db.transaction(() => {
          db.prepare('DELETE FROM enabled_modules').run();
          const insert = db.prepare(
            'INSERT INTO enabled_modules (module_key, enabled) VALUES (@moduleKey, 1)'
          );
          modules.forEach((moduleKey: string) => insert.run({ moduleKey }));
        })();

        return { success: true };
      } catch (error) {
        console.error('[IPC] Modules update failed:', error);
        throw error;
      }
    }
  );
}
