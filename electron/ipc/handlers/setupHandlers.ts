import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { IPC_CHANNELS } from '../channels';
import { mediBridgeDb } from '../../db/database';
import type { SetupAnswers } from '@shared/setup';
import type { DoctorProfile, DoctorProfileEntity, ModuleConfigEntity } from '@shared/entities';

export function registerSetupHandlers() {
  ipcMain.handle(IPC_CHANNELS.SETUP_IS_COMPLETE, async () => {
    await mediBridgeDb.initialize();
    const db = mediBridgeDb.connection;
    const row = db.prepare("SELECT COUNT(1) AS count FROM doctor_profile").get() as { count: number };
    return row.count > 0;
  });

  ipcMain.handle(IPC_CHANNELS.SETUP_GET_PROFILE, async () => {
    await mediBridgeDb.initialize();
    const db = mediBridgeDb.connection;
    const rawProfile = db
      .prepare('SELECT * FROM doctor_profile WHERE id = 1')
      .get() as DoctorProfileEntity | undefined;
    const modules = db
      .prepare('SELECT module_key, enabled, metadata FROM enabled_modules')
      .all() as ModuleConfigEntity[];
    const profile = rawProfile
      ? {
          id: rawProfile.id,
          name: rawProfile.name,
          specialty: rawProfile.specialty,
          practiceType: rawProfile.practice_type,
          centreName: rawProfile.centre_name ?? undefined,
          location: rawProfile.location ?? undefined,
          createdAt: rawProfile.created_at
        }
      : undefined;
    return { profile: profile as DoctorProfile | undefined, modules };
  });

  ipcMain.handle(IPC_CHANNELS.SETUP_COMPLETE, async (_event: IpcMainInvokeEvent, payload: SetupAnswers) => {
    try {
      await mediBridgeDb.initialize();
      const db = mediBridgeDb.connection;
  const { name, specialty, practiceType, location, centreName, modules } = payload;
  const normalizedCentreName = centreName?.trim() ?? null;
  const normalizedLocation = location?.trim() ?? null;

      console.log('[IPC] Setup complete: inserting doctor profile and modules', { name, specialty, practiceType, moduleCount: modules.length });

      // Skip transactions entirely - just do sequential inserts
      // sql.js is in-memory and auto-persists, so atomicity isn't critical for setup
      
      const insertDoctor = db.prepare(`
        INSERT INTO doctor_profile (id, name, specialty, practice_type, centre_name, location, created_at)
        VALUES (1, @name, @specialty, @practiceType, @centreName, @location, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          specialty = excluded.specialty,
          practice_type = excluded.practice_type,
          centre_name = excluded.centre_name,
          location = excluded.location
      `);

      insertDoctor.run({
        name,
        specialty,
        practiceType,
        centreName: normalizedCentreName,
        location: normalizedLocation
      });
      console.log('[IPC] Doctor profile inserted');

      db.prepare('DELETE FROM enabled_modules').run();
      console.log('[IPC] Existing modules cleared');

      const insertModule = db.prepare('INSERT INTO enabled_modules (module_key, enabled) VALUES (@moduleKey, 1)');
      modules.forEach((moduleKey: string) => {
        insertModule.run({ moduleKey });
      });
      console.log(`[IPC] ${modules.length} modules inserted`);

      console.log('[IPC] Setup complete: success');
      return { success: true };
    } catch (error) {
      console.error('[IPC] Setup complete failed:', error);
      throw error;
    }
  });
}
