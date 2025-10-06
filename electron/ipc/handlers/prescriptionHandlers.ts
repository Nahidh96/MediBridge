import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { IPC_CHANNELS } from '../channels';
import { mediBridgeDb } from '../../db/database';
import type { PrescriptionPayload } from '@shared/payloads';

export function registerPrescriptionHandlers() {
  ipcMain.handle(IPC_CHANNELS.PRESCRIPTION_LIST, () => {
    const db = mediBridgeDb.connection;
    return db
      .prepare(
        `SELECT pr.id, pr.patient_id as patientId, p.full_name as patientName, pr.diagnosis,
                pr.medication, pr.dosage, pr.duration, pr.issued_at as issuedAt
         FROM prescriptions pr
         LEFT JOIN patients p ON pr.patient_id = p.id
         ORDER BY pr.issued_at DESC`
      )
      .all();
  });

  ipcMain.handle(
    IPC_CHANNELS.PRESCRIPTION_ADD,
    (_event: IpcMainInvokeEvent, payload: PrescriptionPayload) => {
      const db = mediBridgeDb.connection;
      const insert = db.prepare(`
        INSERT INTO prescriptions (patient_id, diagnosis, medication, dosage, duration)
        VALUES (@patientId, @diagnosis, @medication, @dosage, @duration)
      `);
      const result = insert.run(payload);
      return { id: result.lastInsertRowid };
    }
  );
}
