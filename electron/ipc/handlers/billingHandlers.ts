import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { IPC_CHANNELS } from '../channels';
import { mediBridgeDb } from '../../db/database';
import type { BillingPayload } from '@shared/payloads';

export function registerBillingHandlers() {
  ipcMain.handle(IPC_CHANNELS.BILLING_LIST, () => {
    const db = mediBridgeDb.connection;
    return db
      .prepare(
        `SELECT b.id, b.patient_id as patientId, p.full_name as patientName, b.amount, b.currency,
                b.status, b.payment_method as paymentMethod, b.notes, b.created_at as createdAt
         FROM billing_records b
         LEFT JOIN patients p ON b.patient_id = p.id
         ORDER BY b.created_at DESC`
      )
      .all();
  });

  ipcMain.handle(
    IPC_CHANNELS.BILLING_RECORD_PAYMENT,
    (_event: IpcMainInvokeEvent, payload: BillingPayload) => {
      const db = mediBridgeDb.connection;
      const insert = db.prepare(`
        INSERT INTO billing_records (patient_id, amount, status, payment_method, notes)
        VALUES (@patientId, @amount, 'paid', @paymentMethod, @notes)
      `);
      const result = insert.run(payload);
      return { id: result.lastInsertRowid };
    }
  );
}
