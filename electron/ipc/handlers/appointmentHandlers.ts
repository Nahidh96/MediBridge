import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { IPC_CHANNELS } from '../channels';
import { mediBridgeDb } from '../../db/database';
import type { AppointmentPayload } from '@shared/payloads';

export function registerAppointmentHandlers() {
  ipcMain.handle(IPC_CHANNELS.APPOINTMENT_LIST, () => {
    const db = mediBridgeDb.connection;
    const appointments = db
      .prepare(
        `SELECT a.id, a.patient_id as patientId, p.full_name as patientName, a.scheduled_for as scheduledFor,
                a.status, a.doctor_notes as doctorNotes, a.clinic_room as clinicRoom, a.created_at as createdAt
         FROM appointments a
         LEFT JOIN patients p ON a.patient_id = p.id
         ORDER BY a.scheduled_for DESC`
      )
      .all();
    return appointments;
  });

  ipcMain.handle(
    IPC_CHANNELS.APPOINTMENT_ADD,
    (_event: IpcMainInvokeEvent, payload: AppointmentPayload) => {
      const db = mediBridgeDb.connection;
      const insert = db.prepare(`
        INSERT INTO appointments (patient_id, scheduled_for, doctor_notes, clinic_room)
        VALUES (@patientId, @scheduledFor, @doctorNotes, @clinicRoom)
      `);
      const result = insert.run(payload);
      return { id: result.lastInsertRowid };
    }
  );
}
