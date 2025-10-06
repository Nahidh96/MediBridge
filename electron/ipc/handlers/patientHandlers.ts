import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { IPC_CHANNELS } from '../channels';
import { mediBridgeDb } from '../../db/database';
import type { PatientPayload } from '@shared/payloads';

export function registerPatientHandlers() {
  ipcMain.handle(IPC_CHANNELS.PATIENT_LIST, () => {
    const db = mediBridgeDb.connection;
    return db.prepare('SELECT * FROM patients ORDER BY created_at DESC').all();
  });

  ipcMain.handle(
    IPC_CHANNELS.PATIENT_ADD,
    (_event: IpcMainInvokeEvent, payload: PatientPayload) => {
      const db = mediBridgeDb.connection;
      const insert = db.prepare(`
        INSERT INTO patients (full_name, nic, contact, dob, allergies, notes)
        VALUES (@fullName, @nic, @contact, @dob, @allergies, @notes)
      `);
      const result = insert.run(payload);
      return { id: result.lastInsertRowid };
    }
  );
}
